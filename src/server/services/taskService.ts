import { db } from '../../db/index.ts';
import {
  requestAssignments,
  requests,
  customers,
  departments,
  users,
  requestTimeline,
  notifications,
} from '../../db/schema.ts';
import { eq, and, or, ilike, desc, asc, sql, isNull, lt, notInArray } from 'drizzle-orm';
import { AuditService } from './auditService.ts';
import { NotificationService } from './notificationService.ts';

export interface CreateTaskInput {
  requestId: string;
  title: string;
  departmentId?: string;
  assignedUserId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  dueDate?: Date | string;
  notes?: string;
}

export interface ReassignTaskInput {
  assignedUserId?: string;
  departmentId?: string;
  notes?: string;
}

export interface ListTasksFilter {
  page?: number;
  limit?: number;
  search?: string;
  queue?: 'all' | 'my_tasks' | 'department' | 'unassigned' | 'overdue';
  status?: string;
  priority?: string;
  departmentId?: string;
  assignedUserId?: string;
  requestId?: string;
  isOverdue?: boolean | string;
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  currentUserId?: string;
  currentUserDeptId?: string;
}

export interface TaskActor {
  id: string;
  name: string;
  role: string;
}

export class TaskService {
  /**
   * Create a sub-task or assignment linked to a Request
   */
  public static async createTask(
    input: CreateTaskInput,
    actor: TaskActor,
    ipAddress?: string,
    userAgent?: string
  ) {
    if (!input.requestId) {
      throw new Error('معرف الطلب مطلوب لإنشاء المهمة');
    }
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('عنوان المهمة مطلوب');
    }

    // Verify parent request exists
    const [req] = await db
      .select({
        id: requests.id,
        requestCode: requests.requestCode,
        title: requests.title,
        status: requests.status,
        departmentId: requests.departmentId,
      })
      .from(requests)
      .where(eq(requests.id, input.requestId));

    if (!req) {
      throw new Error('الطلب التابع لهذه المهمة غير موجود');
    }

    let assignedUser: { id: string; name: string } | null = null;
    if (input.assignedUserId) {
      const [user] = await db
        .select({ id: users.id, name: users.name, status: users.status })
        .from(users)
        .where(eq(users.id, input.assignedUserId));

      if (!user) {
        throw new Error('الموظف المكلف بالمهمة غير موجود في النظام');
      }
      if (user.status !== 'active') {
        throw new Error('لا يمكن إسناد مهمة لموظف حسابه غير نشط');
      }
      assignedUser = user;
    }

    const dueDateVal = input.dueDate ? new Date(input.dueDate) : null;
    const deptId = input.departmentId || req.departmentId || null;

    const task = await db.transaction(async (tx) => {
      const [createdTask] = await tx
        .insert(requestAssignments)
        .values({
          requestId: input.requestId,
          title: input.title.trim(),
          departmentId: deptId,
          assignedUserId: input.assignedUserId || null,
          assignedByUserId: actor.id,
          priority: input.priority || 'normal',
          dueDate: dueDateVal,
          notes: input.notes?.trim() || null,
          status: 'pending',
        })
        .returning();

      // Add entry to request timeline
      await tx.insert(requestTimeline).values({
        requestId: input.requestId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        eventType: 'task_created',
        toUserId: input.assignedUserId || null,
        notes: `تم إنشاء مهمة جديدة: [${input.title.trim()}]${
          assignedUser ? ` وإسنادها إلى ${assignedUser.name}` : ''
        }`,
        metadata: { taskId: createdTask.id, priority: createdTask.priority, dueDate: createdTask.dueDate },
      });

      // Record immutable audit log within the same atomic transaction
      await AuditService.log({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: 'task',
        entityId: createdTask.id,
        action: 'create',
        afterState: createdTask,
        notes: `إنشاء مهمة [${createdTask.title}] للطلب ${req.requestCode}`,
        ipAddress,
        userAgent,
      }, tx);

      return createdTask;
    });

    // Trigger in-app notification to the assigned user
    if (input.assignedUserId && input.assignedUserId !== actor.id) {
      try {
        await NotificationService.createNotification({
          userId: input.assignedUserId,
          title: 'تكليف بمهمة عمل جديدة',
          message: `تم تكليفك بمهمة: [${task.title}] للطلب ${req.requestCode}`,
          type: 'assignment',
          entityType: 'task',
          entityId: task.id,
          metadata: {
            requestId: req.id,
            requestCode: req.requestCode,
            priority: task.priority,
            dueDate: task.dueDate,
          },
        });
      } catch (err) {
        console.error('Failed to dispatch task assignment notification:', err);
      }
    }

    return await this.getTaskById(task.id);
  }

  /**
   * Update task status (e.g. mark in_progress, completed, cancelled)
   */
  public static async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    actor: TaskActor,
    notes?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const [current] = await db
      .select()
      .from(requestAssignments)
      .where(eq(requestAssignments.id, taskId));

    if (!current) {
      throw new Error('المهمة غير موجودة');
    }

    // Strict ownership enforcement: Only the assigned employee or management/admin can change status
    const isOwner = current.assignedUserId === actor.id;
    const isSuperAdmin = actor.role === 'super_admin' || actor.role === 'admin';
    if (!isOwner && !isSuperAdmin) {
      throw new Error('غير مصرح لك بتغيير حالة مهمة مسندة لموظف آخر. يمكنك فقط إدارة مهامك الخاصة.');
    }

    const now = new Date();
    const completedAtVal = status === 'completed' ? now : null;

    const formattedHandoverNote = notes?.trim()
      ? current.notes
        ? `${current.notes}\n[${now.toLocaleDateString('ar-SD')} - ${actor.name}]: ${notes.trim()}`
        : `[${now.toLocaleDateString('ar-SD')} - ${actor.name}]: ${notes.trim()}`
      : current.notes;

    const updated = await db.transaction(async (tx) => {
      const [u] = await tx
        .update(requestAssignments)
        .set({
          status,
          notes: formattedHandoverNote,
          completedAt: completedAtVal,
          updatedAt: now,
        })
        .where(eq(requestAssignments.id, taskId))
        .returning();

      // Add entry to parent request timeline
      const eventType = status === 'completed' ? 'task_completed' : 'task_status_changed';
      await tx.insert(requestTimeline).values({
        requestId: current.requestId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        eventType,
        fromStatus: current.status,
        toStatus: status,
        notes: `تحديث حالة المهمة [${current.title}] من [${current.status}] إلى [${status}]`,
        metadata: { taskId: current.id },
      });

      // Record immutable audit log within the same transaction
      await AuditService.log({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: 'task',
        entityId: taskId,
        action: 'status_change',
        beforeState: { status: current.status, completedAt: current.completedAt },
        afterState: { status: u.status, completedAt: u.completedAt },
        notes: `تحديث حالة المهمة [${current.title}] إلى [${status}]`,
        ipAddress,
        userAgent,
      }, tx);

      return u;
    });

    // Notify creator if task was completed by someone else
    if (status === 'completed' && current.assignedByUserId && current.assignedByUserId !== actor.id) {
      try {
        await NotificationService.createNotification({
          userId: current.assignedByUserId,
          title: 'تم إنجاز المهمة بنجاح',
          message: `قام ${actor.name} بإنجاز المهمة: [${current.title}]`,
          type: 'status_change',
          entityType: 'task',
          entityId: taskId,
          metadata: { requestId: current.requestId },
        });
      } catch (err) {
        console.error('Failed to dispatch task completed notification:', err);
      }
    }

    return await this.getTaskById(taskId);
  }

  /**
   * Reassign a task to another employee or department
   */
  public static async reassignTask(
    taskId: string,
    input: ReassignTaskInput,
    actor: TaskActor,
    ipAddress?: string,
    userAgent?: string
  ) {
    const [current] = await db
      .select()
      .from(requestAssignments)
      .where(eq(requestAssignments.id, taskId));

    if (!current) {
      throw new Error('المهمة غير موجودة');
    }

    let assignedUser: { id: string; name: string } | null = null;
    if (input.assignedUserId) {
      const [u] = await db
        .select({ id: users.id, name: users.name, status: users.status })
        .from(users)
        .where(eq(users.id, input.assignedUserId));

      if (!u) {
        throw new Error('الموظف الجديد غير موجود في النظام');
      }
      if (u.status !== 'active') {
        throw new Error('لا يمكن إسناد المهمة لموظف حسابه غير نشط');
      }
      assignedUser = u;
    }

    const now = new Date();
    const updatePayload: Partial<typeof requestAssignments.$inferInsert> = {
      updatedAt: now,
    };

    if (input.assignedUserId !== undefined) {
      updatePayload.assignedUserId = input.assignedUserId || null;
    }
    if (input.departmentId !== undefined) {
      updatePayload.departmentId = input.departmentId || null;
    }
    if (input.notes) {
      updatePayload.notes = input.notes;
    }

    const updated = await db.transaction(async (tx) => {
      const [u] = await tx
        .update(requestAssignments)
        .set(updatePayload)
        .where(eq(requestAssignments.id, taskId))
        .returning();

      // Timeline event
      await tx.insert(requestTimeline).values({
        requestId: current.requestId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        eventType: 'task_reassigned',
        fromUserId: current.assignedUserId,
        toUserId: u.assignedUserId,
        notes: input.notes || `إعادة إسناد المهمة [${current.title}]${
          assignedUser ? ` إلى ${assignedUser.name}` : ' (إلغاء التعيين)'
        }`,
        metadata: { taskId: current.id },
      });

      // Audit log within the same transaction
      await AuditService.log({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: 'task',
        entityId: taskId,
        action: 'reassign',
        beforeState: { assignedUserId: current.assignedUserId, departmentId: current.departmentId },
        afterState: { assignedUserId: u.assignedUserId, departmentId: u.departmentId },
        notes: `إعادة إسناد المهمة [${current.title}]`,
        ipAddress,
        userAgent,
      }, tx);

      return u;
    });

    // Notify newly assigned user
    if (updated.assignedUserId && updated.assignedUserId !== actor.id) {
      try {
        await NotificationService.createNotification({
          userId: updated.assignedUserId,
          title: 'إعادة إسناد مهمة إليك',
          message: `تمت إعادة إسناد المهمة: [${current.title}] إليك بواسطة ${actor.name}`,
          type: 'assignment',
          entityType: 'task',
          entityId: taskId,
          metadata: { requestId: current.requestId },
        });
      } catch (err) {
        console.error('Failed to dispatch task reassign notification:', err);
      }
    }

    return await this.getTaskById(taskId);
  }

  /**
   * Get single task with joined details and computed overdue flag
   */
  public static async getTaskById(taskId: string) {
    const [row] = await db
      .select({
        task: requestAssignments,
        request: {
          id: requests.id,
          requestCode: requests.requestCode,
          title: requests.title,
          status: requests.status,
          priority: requests.priority,
        },
        customer: {
          id: customers.id,
          customerCode: customers.customerCode,
          companyName: customers.companyName,
          primaryPhone: customers.primaryPhone,
        },
        department: {
          id: departments.id,
          code: departments.code,
          nameAr: departments.nameAr,
        },
        assignedUser: {
          id: users.id,
          name: users.name,
          username: users.username,
        },
      })
      .from(requestAssignments)
      .innerJoin(requests, eq(requestAssignments.requestId, requests.id))
      .innerJoin(customers, eq(requests.customerId, customers.id))
      .leftJoin(departments, eq(requestAssignments.departmentId, departments.id))
      .leftJoin(users, eq(requestAssignments.assignedUserId, users.id))
      .where(eq(requestAssignments.id, taskId));

    if (!row) {
      return null;
    }

    const now = new Date();
    const isOverdue =
      !!row.task.dueDate &&
      new Date(row.task.dueDate) < now &&
      row.task.status !== 'completed' &&
      row.task.status !== 'cancelled';

    return {
      ...row.task,
      isOverdue,
      request: row.request,
      customer: row.customer,
      department: row.department?.id ? row.department : null,
      assignedUser: row.assignedUser?.id ? row.assignedUser : null,
    };
  }

  /**
   * List tasks with multi-queue filtering, overdue calculation, and pagination
   */
  public static async listTasks(filter: ListTasksFilter = {}) {
    const {
      page = 1,
      limit = 25,
      search = '',
      queue = 'all',
      status = 'all',
      priority = 'all',
      departmentId = 'all',
      assignedUserId = 'all',
      requestId,
      isOverdue,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      currentUserId,
      currentUserDeptId,
    } = filter;

    const offset = (page - 1) * limit;
    const conditions = [];
    const now = new Date();

    // Search query in task title, notes, request code, or customer name
    if (search && search.trim().length > 0) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(requestAssignments.title, q),
          ilike(requestAssignments.notes, q),
          ilike(requests.requestCode, q),
          ilike(requests.title, q),
          ilike(customers.companyName, q)
        )
      );
    }

    // Queue filter
    if (queue === 'my_tasks' && currentUserId) {
      conditions.push(eq(requestAssignments.assignedUserId, currentUserId));
    } else if (queue === 'department' && currentUserDeptId) {
      conditions.push(eq(requestAssignments.departmentId, currentUserDeptId));
    } else if (queue === 'unassigned') {
      conditions.push(isNull(requestAssignments.assignedUserId));
    } else if (queue === 'overdue') {
      conditions.push(
        and(
          lt(requestAssignments.dueDate, now),
          notInArray(requestAssignments.status, ['completed', 'cancelled'])
        )
      );
    }

    // Status filter
    if (status && status !== 'all') {
      conditions.push(eq(requestAssignments.status, status));
    }

    // Priority filter
    if (priority && priority !== 'all') {
      conditions.push(eq(requestAssignments.priority, priority));
    }

    // Department filter
    if (departmentId && departmentId !== 'all') {
      conditions.push(eq(requestAssignments.departmentId, departmentId));
    }

    // Assigned User filter
    if (assignedUserId && assignedUserId !== 'all') {
      conditions.push(eq(requestAssignments.assignedUserId, assignedUserId));
    }

    // Request filter
    if (requestId) {
      conditions.push(eq(requestAssignments.requestId, requestId));
    }

    // Overdue filter flag
    if (isOverdue === true || isOverdue === 'true') {
      conditions.push(
        and(
          lt(requestAssignments.dueDate, now),
          notInArray(requestAssignments.status, ['completed', 'cancelled'])
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting
    let orderExpression = desc(requestAssignments.createdAt);
    if (sortBy === 'dueDate') {
      orderExpression =
        sortOrder === 'asc' ? asc(requestAssignments.dueDate) : desc(requestAssignments.dueDate);
    } else if (sortBy === 'priority') {
      orderExpression =
        sortOrder === 'asc' ? asc(requestAssignments.priority) : desc(requestAssignments.priority);
    } else if (sortBy === 'status') {
      orderExpression =
        sortOrder === 'asc' ? asc(requestAssignments.status) : desc(requestAssignments.status);
    } else if (sortOrder === 'asc') {
      orderExpression = asc(requestAssignments.createdAt);
    }

    // Total count for current filter
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(requestAssignments)
      .innerJoin(requests, eq(requestAssignments.requestId, requests.id))
      .innerJoin(customers, eq(requests.customerId, customers.id))
      .where(whereClause);

    const total = countResult?.count || 0;

    // Query paginated rows
    const rows = await db
      .select({
        task: requestAssignments,
        request: {
          id: requests.id,
          requestCode: requests.requestCode,
          title: requests.title,
          status: requests.status,
          priority: requests.priority,
        },
        customer: {
          id: customers.id,
          customerCode: customers.customerCode,
          companyName: customers.companyName,
          primaryPhone: customers.primaryPhone,
        },
        department: {
          id: departments.id,
          code: departments.code,
          nameAr: departments.nameAr,
        },
        assignedUser: {
          id: users.id,
          name: users.name,
          username: users.username,
        },
      })
      .from(requestAssignments)
      .innerJoin(requests, eq(requestAssignments.requestId, requests.id))
      .innerJoin(customers, eq(requests.customerId, customers.id))
      .leftJoin(departments, eq(requestAssignments.departmentId, departments.id))
      .leftJoin(users, eq(requestAssignments.assignedUserId, users.id))
      .where(whereClause)
      .orderBy(orderExpression)
      .limit(limit)
      .offset(offset);

    const mapped = rows.map((r) => {
      const overdue =
        !!r.task.dueDate &&
        new Date(r.task.dueDate) < now &&
        r.task.status !== 'completed' &&
        r.task.status !== 'cancelled';

      return {
        ...r.task,
        isOverdue: overdue,
        request: r.request,
        customer: r.customer,
        department: r.department?.id ? r.department : null,
        assignedUser: r.assignedUser?.id ? r.assignedUser : null,
      };
    });

    // Counts for quick queue tabs
    let myTasksCount = 0;
    let deptTasksCount = 0;
    let overdueCount = 0;

    if (currentUserId) {
      const [myRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.assignedUserId, currentUserId),
            notInArray(requestAssignments.status, ['completed', 'cancelled'])
          )
        );
      myTasksCount = myRes?.count || 0;
    }

    if (currentUserDeptId) {
      const [deptRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(requestAssignments)
        .where(
          and(
            eq(requestAssignments.departmentId, currentUserDeptId),
            notInArray(requestAssignments.status, ['completed', 'cancelled'])
          )
        );
      deptTasksCount = deptRes?.count || 0;
    }

    const [overdueRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(requestAssignments)
      .where(
        and(
          lt(requestAssignments.dueDate, now),
          notInArray(requestAssignments.status, ['completed', 'cancelled'])
        )
      );
    overdueCount = overdueRes?.count || 0;

    return {
      tasks: mapped,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        total,
        myTasksCount,
        deptTasksCount,
        overdueCount,
      },
    };
  }

  /**
   * Scan open tasks and generate deadline alert notifications if due within 24h or overdue
   */
  public static async checkUpcomingDeadlines() {
    const now = new Date();
    const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const dueTasks = await db
      .select({
        task: requestAssignments,
        requestCode: requests.requestCode,
      })
      .from(requestAssignments)
      .innerJoin(requests, eq(requestAssignments.requestId, requests.id))
      .where(
        and(
          lt(requestAssignments.dueDate, next24h),
          notInArray(requestAssignments.status, ['completed', 'cancelled'])
        )
      );

    let sentCount = 0;
    for (const item of dueTasks) {
      if (!item.task.assignedUserId || !item.task.dueDate) continue;

      const isPast = new Date(item.task.dueDate) < now;
      const windowKey = `${isPast ? 'overdue' : 'upcoming'}_${new Date(item.task.dueDate).toISOString().slice(0, 10)}`;

      // Deduplication check: skip if notification already dispatched for this task and window
      const [alreadyDispatched] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.entityType, 'task'),
            eq(notifications.entityId, item.task.id),
            eq(notifications.type, 'task_deadline'),
            sql`metadata->>'windowKey' = ${windowKey}`
          )
        )
        .limit(1);

      if (alreadyDispatched) {
        continue;
      }

      const title = isPast ? 'تنبيه: مهمة متأخرة عن موعدها' : 'تذكير: اقتراب موعد تسليم المهمة';
      const msg = isPast
        ? `المهمة [${item.task.title}] للطلب [${item.requestCode}] تجاوزت موعد الاستحقاق المجدول.`
        : `المهمة [${item.task.title}] للطلب [${item.requestCode}] مستحقة خلال 24 ساعة.`;

      try {
        const notif = await NotificationService.createNotification({
          userId: item.task.assignedUserId,
          title,
          message: msg,
          type: 'task_deadline',
          entityType: 'task',
          entityId: item.task.id,
          metadata: {
            dueDate: item.task.dueDate,
            isOverdue: isPast,
            requestId: item.task.requestId,
            windowKey,
          },
        });
        if (notif && !(notif as any).isDuplicate) {
          sentCount++;
        }
      } catch (err) {
        console.error('Error generating deadline alert:', err);
      }
    }

    return { sentCount, scanned: dueTasks.length };
  }
}
