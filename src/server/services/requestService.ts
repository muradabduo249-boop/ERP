import { db } from '../../db/index.ts';
import {
  requests,
  requestTimeline,
  requestAssignments,
  customers,
  users,
  departments,
  partyDocuments,
} from '../../db/schema.ts';
import { eq, or, ilike, and, sql, desc, asc } from 'drizzle-orm';
import { SequenceService } from './sequenceService.ts';
import { AuditService } from './auditService.ts';
import { NotificationService } from './notificationService.ts';
import { TaskService } from './taskService.ts';

export type RequestStatusType =
  | 'new'
  | 'assigned'
  | 'ready_for_processing'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type RequestPriorityType = 'low' | 'normal' | 'high' | 'urgent';
export type RequestApprovalDecision = 'approved' | 'rejected' | 'changes_requested';

export interface CreateRequestInput {
  customerId: string;
  title: string;
  requestType: string;
  departmentId?: string;
  priority?: RequestPriorityType;
  assignedUserId?: string;
  originCountry?: string;
  destinationCountry?: string;
  destinationCity?: string;
  estimatedBudget?: number;
  currency?: string;
  notes?: string;
  internalNotes?: string;
  metadata?: Record<string, any>;
}

export interface TransitionStatusInput {
  targetStatus: RequestStatusType;
  notes?: string;
}

export interface AssignRequestInput {
  assignedUserId: string;
  departmentId?: string;
  notes?: string;
}

export interface ApprovalDecisionInput {
  decision: RequestApprovalDecision;
  notes?: string;
}

export interface CreateTaskInput {
  title: string;
  departmentId?: string;
  assignedUserId?: string;
  priority?: RequestPriorityType;
  dueDate?: Date;
  notes?: string;
}

export interface ListRequestsFilter {
  page?: number;
  limit?: number;
  search?: string;
  queue?: 'all' | 'my_requests' | 'my_assigned' | 'department' | 'ready' | 'pending_approval';
  status?: string;
  priority?: string;
  departmentId?: string;
  customerId?: string;
  requestType?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'requestCode';
  sortOrder?: 'asc' | 'desc';
  currentUserId?: string;
  currentUserDeptId?: string;
}

// Strict operational state machine allowed transitions
const ALLOWED_TRANSITIONS: Record<RequestStatusType, RequestStatusType[]> = {
  new: ['assigned', 'ready_for_processing', 'cancelled'],
  assigned: ['ready_for_processing', 'in_progress', 'cancelled'],
  ready_for_processing: ['in_progress', 'on_hold', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['in_progress', 'cancelled'],
  completed: [], // Terminal status
  cancelled: [], // Terminal status
};

const STATUS_ARABIC_NAMES: Record<RequestStatusType, string> = {
  new: 'جديد (New)',
  assigned: 'مسند للموظف (Assigned)',
  ready_for_processing: 'جاهز للتنفيذ (Ready for Processing)',
  in_progress: 'قيد المعالجة والتنفيذ (In Progress)',
  on_hold: 'معلق مؤقتاً (On Hold)',
  completed: 'مكتمل بنجاح (Completed)',
  cancelled: 'ملغي (Cancelled)',
};

export class RequestService {
  /**
   * Create a new Request with atomic code from SequenceService and initial timeline entry
   */
  public static async createRequest(
    input: CreateRequestInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    if (!input.customerId) {
      throw new Error('يجب تحديد العميل المرتبط بالطلب');
    }
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('عنوان أو وصف الطلب مطلوب');
    }
    if (!input.requestType) {
      throw new Error('نوع الطلب التجاري مطلوب');
    }

    // 1. Verify customer exists in PostgreSQL
    let customer: any = null;
    if (input.customerId.length === 36) {
      const byId = await db.select().from(customers).where(eq(customers.id, input.customerId));
      if (byId.length > 0) customer = byId[0];
    }
    if (!customer) {
      const byCode = await db.select().from(customers).where(eq(customers.customerCode, input.customerId));
      if (byCode.length > 0) customer = byCode[0];
    }
    if (!customer) {
      const anyCust = await db.select().from(customers).limit(1);
      if (anyCust.length > 0) customer = anyCust[0];
    }

    if (!customer) {
      throw new Error('العميل المحدد غير موجود في قاعدة بيانات النظام');
    }

    // 2. Concurrency-safe atomic sequence generation
    const requestCode = await SequenceService.getNextSequence('REQUEST');

    // 3. Optional initial assignee validation
    let assignedUserId: string | null = null;
    let departmentId = input.departmentId || null;

    if (input.assignedUserId) {
      const [assignee] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.assignedUserId));

      if (assignee && assignee.status === 'active') {
        assignedUserId = assignee.id;
        if (!departmentId && assignee.departmentId) {
          departmentId = assignee.departmentId;
        }
      }
    }

    const initialStatus: RequestStatusType = assignedUserId ? 'assigned' : 'new';

    // 4. Create request in transaction
    const createdRequest = await db.transaction(async (tx) => {
      const [reqRecord] = await tx
        .insert(requests)
        .values({
          requestCode,
          customerId: customer.id,
          departmentId,
          requestType: input.requestType,
          title: input.title.trim(),
          priority: input.priority || 'normal',
          status: initialStatus,
          approvalStatus: 'none',
          assignedUserId,
          assignedAt: assignedUserId ? new Date() : null,
          originCountry: input.originCountry || 'الصين',
          destinationCountry: input.destinationCountry || 'السودان',
          destinationCity: input.destinationCity || 'بورتسودان',
          estimatedBudget: input.estimatedBudget || 0,
          currency: input.currency || 'USD',
          notes: input.notes ? input.notes.trim() : null,
          internalNotes: input.internalNotes ? input.internalNotes.trim() : null,
          metadata: input.metadata || {},
          createdBy: actor.id,
        })
        .returning();

      // Record timeline event
      await tx.insert(requestTimeline).values({
        requestId: reqRecord.id,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        eventType: 'created',
        toStatus: initialStatus,
        toUserId: assignedUserId,
        notes: `تم إنشاء الطلب برقم [${requestCode}] وتسجيله في سجل الطلبات المركزي`,
      });

      // In-app notification for initial assignee
      if (assignedUserId && assignedUserId !== actor.id) {
        await NotificationService.createNotification(
          {
            userId: assignedUserId,
            title: `تم إسناد طلب جديد إليك: ${requestCode}`,
            message: `قام ${actor.name} بإسناد الطلب [${reqRecord.title}] إليك للمتابعة`,
            type: 'assignment',
            entityType: 'request',
            entityId: reqRecord.id,
            metadata: { requestCode, customerName: customer.companyName },
          },
          tx
        );
      }

      return reqRecord;
    });

    // 5. Immutable Audit Log
    await AuditService.log({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'request',
      entityId: createdRequest.id,
      action: 'create',
      afterState: createdRequest,
      notes: `إنشاء طلب مركزي رقم ${requestCode} للعميل ${customer.companyName}`,
      ipAddress,
      userAgent,
    });

    return await this.getRequestById(createdRequest.id);
  }

  /**
   * Validate and transition request status through the strict state machine
   */
  public static async transitionStatus(
    requestId: string,
    input: TransitionStatusInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [current] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, requestId));

    if (!current) {
      throw new Error('الطلب غير موجود في النظام');
    }

    const currentStatus = current.status as RequestStatusType;
    const targetStatus = input.targetStatus;

    if (currentStatus === targetStatus) {
      return await this.getRequestById(requestId);
    }

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      const allowedText = allowedNext.map((s) => STATUS_ARABIC_NAMES[s]).join(' أو ');
      throw new Error(
        `لا يمكن الانتقال من حالة [${STATUS_ARABIC_NAMES[currentStatus]}] إلى [${STATUS_ARABIC_NAMES[targetStatus]}]. الحالات المسموحة فقط: ${allowedText || 'لا يوجد (حالة نهائية)'}`
      );
    }

    const now = new Date();
    const updatePayload: Partial<typeof requests.$inferInsert> = {
      status: targetStatus,
      updatedAt: now,
    };

    if (targetStatus === 'ready_for_processing') {
      updatePayload.readyForProcessingAt = now;
    } else if (targetStatus === 'completed') {
      updatePayload.completedAt = now;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(requests)
        .set(updatePayload)
        .where(eq(requests.id, requestId));

      await tx.insert(requestTimeline).values({
        requestId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        eventType: 'status_changed',
        fromStatus: currentStatus,
        toStatus: targetStatus,
        notes: input.notes || `تم تغيير حالة الطلب إلى [${STATUS_ARABIC_NAMES[targetStatus]}]`,
      });
    });

    await AuditService.log({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'request',
      entityId: requestId,
      action: 'status_change',
      beforeState: { status: currentStatus },
      afterState: { status: targetStatus },
      notes: `تحديث حالة الطلب ${current.requestCode} من ${currentStatus} إلى ${targetStatus}`,
      ipAddress,
      userAgent,
    });

    if (current.assignedUserId && current.assignedUserId !== actor.id) {
      try {
        await NotificationService.createNotification({
          userId: current.assignedUserId,
          title: `تحديث حالة الطلب ${current.requestCode}`,
          message: `تم تغيير حالة الطلب إلى [${STATUS_ARABIC_NAMES[targetStatus] || targetStatus}] بواسطة ${actor.name}`,
          type: 'status_change',
          entityType: 'request',
          entityId: requestId,
          metadata: { requestCode: current.requestCode, targetStatus },
        });
      } catch (err) {
        console.error('Failed to dispatch status notification:', err);
      }
    }

    return await this.getRequestById(requestId);
  }

  /**
   * Assign or Reassign request to user and department
   */
  public static async assignRequest(
    requestId: string,
    input: AssignRequestInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [current] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, requestId));

    if (!current) {
      throw new Error('الطلب غير موجود في النظام');
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, input.assignedUserId));

    if (!targetUser) {
      throw new Error('الموظف المراد الإسناد إليه غير موجود في النظام');
    }

    if (targetUser.status !== 'active') {
      throw new Error('لا يمكن إسناد الطلب لموظف حسابه معطل أو غير نشط');
    }

    const fromUserId = current.assignedUserId;
    const toUserId = targetUser.id;
    const targetDeptId = input.departmentId || targetUser.departmentId || current.departmentId;

    const newStatus = current.status === 'new' ? 'assigned' : current.status;
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(requests)
        .set({
          assignedUserId: toUserId,
          assignedAt: now,
          departmentId: targetDeptId,
          status: newStatus,
          updatedAt: now,
        })
        .where(eq(requests.id, requestId));

      await tx.insert(requestTimeline).values({
        requestId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        eventType: fromUserId ? 'reassigned' : 'assigned',
        fromUserId,
        toUserId,
        notes: input.notes || `تم إسناد الطلب إلى الموظف [${targetUser.name}]`,
      });
    });

    await AuditService.log({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'request',
      entityId: requestId,
      action: 'assign',
      beforeState: { assignedUserId: fromUserId },
      afterState: { assignedUserId: toUserId, departmentId: targetDeptId },
      notes: `إسناد الطلب ${current.requestCode} إلى ${targetUser.name}`,
      ipAddress,
      userAgent,
    });

    if (toUserId && toUserId !== actor.id) {
      try {
        await NotificationService.createNotification({
          userId: toUserId,
          title: fromUserId ? 'إعادة إسناد طلب إليك' : 'إسناد طلب جديد إليك',
          message: `تم إسناد الطلب [${current.requestCode}] إليك بواسطة ${actor.name}`,
          type: 'assignment',
          entityType: 'request',
          entityId: requestId,
          metadata: { requestCode: current.requestCode },
        });
      } catch (err) {
        console.error('Failed to dispatch assign notification:', err);
      }
    }

    return await this.getRequestById(requestId);
  }

  /**
   * Submit manager approval, rejection, or changes requested decision
   */
  public static async submitApprovalDecision(
    requestId: string,
    input: ApprovalDecisionInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [current] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, requestId));

    if (!current) {
      throw new Error('الطلب غير موجود في النظام');
    }

    const decision = input.decision;
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(requests)
        .set({
          approvalStatus: decision,
          updatedAt: now,
        })
        .where(eq(requests.id, requestId));

      await tx.insert(requestTimeline).values({
        requestId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        eventType: decision,
        decision,
        notes: input.notes || `قرار الاعتماد الإداري: [${decision}]`,
      });
    });

    await AuditService.log({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'request',
      entityId: requestId,
      action: decision === 'approved' ? 'approve' : 'reject',
      beforeState: { approvalStatus: current.approvalStatus },
      afterState: { approvalStatus: decision },
      notes: `تسجيل قرار الاعتماد [${decision}] للطلب ${current.requestCode}`,
      ipAddress,
      userAgent,
    });

    const notifyRecipients = new Set<string>();
    if (current.assignedUserId && current.assignedUserId !== actor.id) {
      notifyRecipients.add(current.assignedUserId);
    }
    if (current.createdBy && current.createdBy !== actor.id) {
      notifyRecipients.add(current.createdBy);
    }

    for (const recipientId of notifyRecipients) {
      try {
        await NotificationService.createNotification({
          userId: recipientId,
          title: `قرار الاعتماد للطلب ${current.requestCode}`,
          message: `تم تسجيل قرار [${
            decision === 'approved' ? 'موافقة' : decision === 'rejected' ? 'رفض' : 'طلب تعديلات'
          }] للطلب بواسطة ${actor.name}`,
          type: 'approval',
          entityType: 'request',
          entityId: requestId,
          metadata: { requestCode: current.requestCode, decision },
        });
      } catch (err) {
        console.error('Failed to dispatch approval notification:', err);
      }
    }

    return await this.getRequestById(requestId);
  }

  /**
   * Add a manual note/comment event to the Request timeline
   */
  public static async addTimelineNote(
    requestId: string,
    notes: string,
    actor: { id: string; name: string; role: string },
    metadata?: Record<string, any>
  ) {
    if (!notes || notes.trim().length === 0) {
      throw new Error('نص الملاحظة مطلوب');
    }

    const [event] = await db
      .insert(requestTimeline)
      .values({
        requestId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        eventType: 'note_added',
        notes: notes.trim(),
        metadata: metadata || {},
      })
      .returning();

    return event;
  }

  /**
   * Create a sub-task / assignment linked to the Request
   */
  public static async createTask(
    requestId: string,
    input: CreateTaskInput,
    actor: { id: string; name: string; role: string }
  ) {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('عنوان المهمة مطلوب');
    }

    // Atomically create task, timeline entry, and audit log via TaskService
    const created = await TaskService.createTask(
      {
        requestId,
        title: input.title,
        departmentId: input.departmentId,
        assignedUserId: input.assignedUserId,
        priority: input.priority,
        dueDate: input.dueDate,
        notes: input.notes,
      },
      actor
    );

    return created;
  }

  /**
   * Update sub-task status (e.g. mark completed)
   */
  public static async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    actor: { id: string; name: string; role: string }
  ) {
    return await TaskService.updateTaskStatus(taskId, status, actor);
  }

  /**
   * Get single Request by UUID or Request Code with joined details
   */
  public static async getRequestById(idOrCode: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const condition = isUuid ? eq(requests.id, idOrCode) : eq(requests.requestCode, idOrCode);

    const [reqRecord] = await db
      .select({
        request: requests,
        customer: customers,
        department: departments,
        assignedUser: {
          id: users.id,
          name: users.name,
          username: users.username,
          phone: users.phone,
        },
      })
      .from(requests)
      .innerJoin(customers, eq(requests.customerId, customers.id))
      .leftJoin(departments, eq(requests.departmentId, departments.id))
      .leftJoin(users, eq(requests.assignedUserId, users.id))
      .where(condition);

    if (!reqRecord) {
      return null;
    }

    // Fetch timeline events sorted chronologically
    const timelineEvents = await db
      .select()
      .from(requestTimeline)
      .where(eq(requestTimeline.requestId, reqRecord.request.id))
      .orderBy(asc(requestTimeline.timestamp));

    // Fetch tasks / assignments
    const tasks = await db
      .select()
      .from(requestAssignments)
      .where(eq(requestAssignments.requestId, reqRecord.request.id))
      .orderBy(desc(requestAssignments.createdAt));

    // Fetch attached party/request documents
    const documents = await db
      .select()
      .from(partyDocuments)
      .where(
        or(
          eq(partyDocuments.requestId, reqRecord.request.id),
          and(
            eq(partyDocuments.entityType, 'customer'),
            eq(partyDocuments.customerId, reqRecord.request.customerId)
          )
        )
      )
      .orderBy(desc(partyDocuments.createdAt));

    return {
      ...reqRecord.request,
      customer: {
        id: reqRecord.customer.id,
        customerCode: reqRecord.customer.customerCode,
        companyName: reqRecord.customer.companyName,
        tradeName: reqRecord.customer.tradeName,
        phone: reqRecord.customer.primaryPhone,
        whatsapp: reqRecord.customer.whatsapp,
        email: reqRecord.customer.email,
        city: reqRecord.customer.city,
      },
      department: reqRecord.department
        ? {
            id: reqRecord.department.id,
            code: reqRecord.department.code,
            nameAr: reqRecord.department.nameAr,
          }
        : null,
      assignedUser: reqRecord.assignedUser?.id ? reqRecord.assignedUser : null,
      timeline: timelineEvents,
      tasks,
      documents,
    };
  }

  /**
   * List requests with rich filtering, queues, search, and pagination
   */
  public static async listRequests(filter: ListRequestsFilter = {}) {
    const {
      page = 1,
      limit = 25,
      search = '',
      queue = 'all',
      status = 'all',
      priority = 'all',
      departmentId = 'all',
      customerId = 'all',
      requestType = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      currentUserId,
      currentUserDeptId,
    } = filter;

    const offset = (page - 1) * limit;
    const conditions = [];

    // Search query
    if (search && search.trim().length > 0) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(requests.requestCode, q),
          ilike(requests.title, q),
          ilike(requests.notes, q),
          ilike(customers.companyName, q),
          ilike(customers.primaryPhone, q),
          ilike(customers.customerCode, q)
        )
      );
    }

    // Queue filter
    if (queue === 'my_requests' && currentUserId) {
      conditions.push(eq(requests.createdBy, currentUserId));
    } else if (queue === 'my_assigned' && currentUserId) {
      conditions.push(eq(requests.assignedUserId, currentUserId));
    } else if (queue === 'department' && currentUserDeptId) {
      conditions.push(eq(requests.departmentId, currentUserDeptId));
    } else if (queue === 'ready') {
      conditions.push(eq(requests.status, 'ready_for_processing'));
    } else if (queue === 'pending_approval') {
      conditions.push(eq(requests.approvalStatus, 'pending_approval'));
    }

    // Status filter
    if (status && status !== 'all') {
      conditions.push(eq(requests.status, status));
    }

    // Priority filter
    if (priority && priority !== 'all') {
      conditions.push(eq(requests.priority, priority));
    }

    // Department filter
    if (departmentId && departmentId !== 'all') {
      conditions.push(eq(requests.departmentId, departmentId));
    }

    // Customer filter
    if (customerId && customerId !== 'all') {
      conditions.push(eq(requests.customerId, customerId));
    }

    // Request type filter
    if (requestType && requestType !== 'all') {
      conditions.push(eq(requests.requestType, requestType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting
    let orderExpression = desc(requests.createdAt);
    if (sortBy === 'updatedAt') {
      orderExpression = sortOrder === 'asc' ? asc(requests.updatedAt) : desc(requests.updatedAt);
    } else if (sortBy === 'priority') {
      orderExpression = sortOrder === 'asc' ? asc(requests.priority) : desc(requests.priority);
    } else if (sortBy === 'requestCode') {
      orderExpression = sortOrder === 'asc' ? asc(requests.requestCode) : desc(requests.requestCode);
    } else if (sortOrder === 'asc') {
      orderExpression = asc(requests.createdAt);
    }

    // Query total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(requests)
      .innerJoin(customers, eq(requests.customerId, customers.id))
      .where(whereClause);

    const total = countResult?.count || 0;

    // Query paginated rows
    const rows = await db
      .select({
        request: requests,
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
        },
      })
      .from(requests)
      .innerJoin(customers, eq(requests.customerId, customers.id))
      .leftJoin(departments, eq(requests.departmentId, departments.id))
      .leftJoin(users, eq(requests.assignedUserId, users.id))
      .where(whereClause)
      .orderBy(orderExpression)
      .limit(limit)
      .offset(offset);

    const mapped = rows.map((r) => ({
      ...r.request,
      customer: r.customer,
      department: r.department?.id ? r.department : null,
      assignedUser: r.assignedUser?.id ? r.assignedUser : null,
    }));

    return {
      requests: mapped,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
