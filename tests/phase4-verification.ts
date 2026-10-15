/**
 * SAHLA ERP — Phase 4 Live Automated Verification Test Suite
 *
 * Verifies against live Cloud SQL PostgreSQL:
 * 1. Task Creation, Request Linkage & Strict Validation
 * 2. Task Assignment & Automated In-App Notification Dispatch
 * 3. Task Status Lifecycle (Pending -> In Progress -> Completed -> Reopened) & Completion Timestamps
 * 4. Task Reassignment, Audit Trail & Timeline History
 * 5. Due Dates & Overdue State Engine (isOverdue computation)
 * 6. Multi-Queue Task Engine ("My Tasks", Department Queue, Overdue, Search, Pagination)
 * 7. Proactive Deadline Alerts & Notification Generation
 * 8. Request Workflow Event Triggers (Assignment, State Machine, Manager Approvals)
 * 9. In-App Notification Inbox, Strict User Isolation, Unread Counter & Read Tracking
 * 10. Audit Trail Verification for Task Operations
 */

import { db } from '../src/db/index.ts';
import {
  users,
  departments,
  customers,
  requests,
  requestAssignments,
  requestTimeline,
  notifications,
  auditLogs,
} from '../src/db/schema.ts';
import { TaskService } from '../src/server/services/taskService.ts';
import { RequestService } from '../src/server/services/requestService.ts';
import { NotificationService } from '../src/server/services/notificationService.ts';
import { eq, desc, and } from 'drizzle-orm';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) {
      console.error(`     Details: ${details}`);
    }
  }
}

async function runPhase4Verification() {
  console.log('\n====================================================');
  console.log('🚀 RUNNING PHASE 4 TASK MANAGEMENT & EVENT NOTIFICATIONS TESTS');
  console.log('   (Task Core, Queues, Overdue Engine, In-App Notifications, Triggers)');
  console.log('====================================================\n');

  try {
    // -----------------------------------------------------------------
    // SETUP: Fetch existing live records for test context
    // -----------------------------------------------------------------
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'));

    const [customsUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'customs'));

    const [procurementUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'procurement'));

    const [financeUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'finance'));

    const [customer] = await db.select().from(customers).limit(1);
    const [dept] = await db.select().from(departments).limit(1);

    if (!adminUser || !customsUser || !procurementUser || !customer) {
      throw new Error('Seed prerequisites missing from PostgreSQL database');
    }

    const actorAdmin = {
      id: adminUser.id,
      name: adminUser.name,
      role: 'super_admin',
    };

    // Create a dedicated Request for Phase 4 testing
    const testRequest = await RequestService.createRequest(
      {
        customerId: customer.id,
        title: 'طلب اختبار التحقق من المرحلة الرابعة - المهام والإشعارات',
        requestType: 'PURCHASE_AND_SHIP',
        priority: 'high',
        notes: 'طلب مؤتمت لاختبار مهام وسير العمل',
      },
      actorAdmin
    );

    if (!testRequest) {
      throw new Error('Failed to create test request');
    }

    // -----------------------------------------------------------------
    // TEST GROUP 1: Task Creation, Request Linkage & Strict Validation
    // -----------------------------------------------------------------
    console.log('--- TEST GROUP 1: Task Creation & Validation ---');

    const pastDate = new Date(Date.now() - 48 * 3600 * 1000); // 2 days ago
    const futureDate = new Date(Date.now() + 72 * 3600 * 1000); // 3 days in future

    const task1 = await TaskService.createTask(
      {
        requestId: testRequest.id,
        title: 'استلام بوليصة الشحن وتدقيق الفاتورة التجارية',
        departmentId: dept ? dept.id : undefined,
        assignedUserId: customsUser.id,
        priority: 'high',
        dueDate: futureDate,
        notes: 'مهمة فحص المستندات الأولية للبضاعة',
      },
      actorAdmin
    );

    assert(!!task1, 'Task created successfully');
    assert(task1?.requestId === testRequest.id, 'Task strictly linked to parent Request in PostgreSQL');
    assert(task1?.assignedUser?.id === customsUser.id, 'Task assigned to designated active employee');
    assert(task1?.status === 'pending', 'Initial task status is "pending"');
    assert(task1?.priority === 'high', 'Task priority set accurately');
    assert(task1?.isOverdue === false, 'Future due date correctly marked isOverdue = false');

    // Validation: Invalid request ID rejection
    let invalidReqRejected = false;
    try {
      await TaskService.createTask(
        {
          requestId: '00000000-0000-0000-0000-000000000000',
          title: 'مهمة وهمية',
        },
        actorAdmin
      );
    } catch {
      invalidReqRejected = true;
    }
    assert(invalidReqRejected, 'Task creation with non-existent request rejected');

    // Validation: Empty title rejection
    let emptyTitleRejected = false;
    try {
      await TaskService.createTask(
        {
          requestId: testRequest.id,
          title: '   ',
        },
        actorAdmin
      );
    } catch {
      emptyTitleRejected = true;
    }
    assert(emptyTitleRejected, 'Task creation with empty title rejected');

    // -----------------------------------------------------------------
    // TEST GROUP 2: Automated In-App Notification on Assignment
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: In-App Notification on Assignment ---');

    const customsNotifications = await NotificationService.getUserNotifications(customsUser.id);
    const assignmentNotif = customsNotifications.notifications.find(
      (n) => n.entityId === task1?.id && n.type === 'assignment'
    );

    assert(!!assignmentNotif, 'Notification automatically generated for assigned employee');
    assert(assignmentNotif?.userId === customsUser.id, 'Notification strictly routed to assignee user ID');
    assert(assignmentNotif?.isRead === false, 'New notification is initially unread (isRead = false)');
    assert(assignmentNotif?.entityType === 'task', 'Notification entityType is "task"');

    // -----------------------------------------------------------------
    // TEST GROUP 3: Task Status Lifecycle & Completion Timestamp
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Task Status Lifecycle & Completion ---');

    // Move pending -> in_progress
    const inProgressTask = await TaskService.updateTaskStatus(
      task1!.id,
      'in_progress',
      { id: customsUser.id, name: customsUser.name, role: 'operations_officer' }
    );
    assert(inProgressTask?.status === 'in_progress', 'Task transitioned to "in_progress"');
    assert(inProgressTask?.completedAt === null, 'completedAt remains null during in_progress');

    // Move in_progress -> completed
    const completedTask = await TaskService.updateTaskStatus(
      task1!.id,
      'completed',
      { id: customsUser.id, name: customsUser.name, role: 'operations_officer' }
    );
    assert(completedTask?.status === 'completed', 'Task transitioned to "completed"');
    assert(completedTask?.completedAt !== null, 'completedAt timestamp set upon completion');

    // Verify parent request timeline recorded task completion event
    const [timelineEvent] = await db
      .select()
      .from(requestTimeline)
      .where(
        and(
          eq(requestTimeline.requestId, testRequest.id),
          eq(requestTimeline.eventType, 'task_completed')
        )
      )
      .orderBy(desc(requestTimeline.timestamp))
      .limit(1);

    assert(!!timelineEvent, 'Task completion event recorded in Request timeline ledger');

    // Reopen task: completed -> in_progress
    const reopenedTask = await TaskService.updateTaskStatus(
      task1!.id,
      'in_progress',
      actorAdmin
    );
    assert(reopenedTask?.status === 'in_progress', 'Completed task successfully reopened to in_progress');
    assert(reopenedTask?.completedAt === null, 'completedAt cleared back to null upon reopening');

    // -----------------------------------------------------------------
    // TEST GROUP 4: Task Reassignment & Audit Trail
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Task Reassignment & Timeline Tracking ---');

    const reassignedTask = await TaskService.reassignTask(
      task1!.id,
      {
        assignedUserId: procurementUser.id,
        notes: 'إعادة إسناد إلى مسؤول المشتريات للتنسيق مع المورد',
      },
      actorAdmin
    );

    assert(reassignedTask?.assignedUser?.id === procurementUser.id, 'Task successfully reassigned to new employee');

    // Check notification sent to new assignee
    const procNotifications = await NotificationService.getUserNotifications(procurementUser.id);
    const reassignNotif = procNotifications.notifications.find(
      (n) => n.entityId === task1?.id && n.type === 'assignment'
    );
    assert(!!reassignNotif, 'Notification dispatched to new assignee upon reassignment');

    // Check timeline entry for reassignment
    const [reassignTimeline] = await db
      .select()
      .from(requestTimeline)
      .where(
        and(
          eq(requestTimeline.requestId, testRequest.id),
          eq(requestTimeline.eventType, 'task_reassigned')
        )
      )
      .orderBy(desc(requestTimeline.timestamp))
      .limit(1);

    assert(!!reassignTimeline, 'Task reassignment recorded in Request timeline');

    // Check audit log
    const [reassignAudit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityId, task1!.id),
          eq(auditLogs.action, 'reassign')
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(1);

    assert(!!reassignAudit, 'Immutable audit log recorded for task reassignment');

    // -----------------------------------------------------------------
    // TEST GROUP 5: Due Dates & Overdue Calculation Engine
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Due Dates & Overdue Calculation Engine ---');

    // Create overdue task (due 2 days ago)
    const overdueTask = await TaskService.createTask(
      {
        requestId: testRequest.id,
        title: 'مهمة متأخرة: سداد رسوم الميناء العاجلة',
        assignedUserId: financeUser ? financeUser.id : customsUser.id,
        priority: 'urgent',
        dueDate: pastDate,
        notes: 'تجاوزت الموعد المحدد',
      },
      actorAdmin
    );

    assert(!!overdueTask, 'Overdue test task created');
    assert(overdueTask?.isOverdue === true, 'Task with past due date correctly calculated isOverdue = true');

    // Mark as completed, verify isOverdue becomes false
    const resolvedOverdue = await TaskService.updateTaskStatus(
      overdueTask!.id,
      'completed',
      actorAdmin
    );
    assert(resolvedOverdue?.isOverdue === false, 'Completed overdue task is no longer marked overdue');

    // -----------------------------------------------------------------
    // TEST GROUP 6: Multi-Queue Engine ("My Tasks", Department, Overdue)
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Multi-Queue Task Engine & Query Filters ---');

    // Queue: my_tasks
    const myTasksResult = await TaskService.listTasks({
      queue: 'my_tasks',
      currentUserId: procurementUser.id,
    });
    assert(Array.isArray(myTasksResult.tasks), 'My Tasks query returns array of tasks');
    const allBelongToUser = myTasksResult.tasks.every(
      (t) => t.assignedUser?.id === procurementUser.id
    );
    assert(allBelongToUser, 'My Tasks queue strictly isolates tasks to authenticated employee');

    // Queue: unassigned
    const unassignedTask = await TaskService.createTask(
      {
        requestId: testRequest.id,
        title: 'مهمة عامة في انتظار الإسناد',
        priority: 'normal',
      },
      actorAdmin
    );
    const unassignedResult = await TaskService.listTasks({
      queue: 'unassigned',
    });
    const foundUnassigned = unassignedResult.tasks.some((t) => t.id === unassignedTask?.id);
    assert(foundUnassigned, 'Unassigned queue accurately retrieves unallocated tasks');

    // Filtering by priority
    const urgentTasks = await TaskService.listTasks({
      priority: 'urgent',
    });
    const allUrgent = urgentTasks.tasks.every((t) => t.priority === 'urgent');
    assert(allUrgent, 'Priority filter strictly returns tasks with requested priority');

    // Pagination metrics
    const pagedResult = await TaskService.listTasks({ limit: 2, page: 1 });
    assert(pagedResult.tasks.length <= 2, 'Pagination limit strictly respected');
    assert(pagedResult.pagination.page === 1, 'Pagination page number matches');
    assert(pagedResult.pagination.total >= 3, 'Total task count reflects all records');

    // -----------------------------------------------------------------
    // TEST GROUP 7: Proactive Deadline Alerts Scan
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Proactive Deadline Alerts Scan ---');

    // Create an open task due yesterday to trigger deadline alert
    const deadlineTask = await TaskService.createTask(
      {
        requestId: testRequest.id,
        title: 'مهمة فحص التنبيهات المجدولة',
        assignedUserId: customsUser.id,
        priority: 'high',
        dueDate: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      },
      actorAdmin
    );

    const deadlineScan = await TaskService.checkUpcomingDeadlines();
    // 7.1 Initial Scan Dispatches Notification
    assert(deadlineScan.scanned > 0, 'Deadline scanner successfully processed open tasks');
    assert(deadlineScan.sentCount > 0, 'Deadline scanner dispatched alerts for past/impending due dates');

    // Verify deadline notification was delivered
    const customsAlerts = await NotificationService.getUserNotifications(customsUser.id);
    const deadlineNotif = customsAlerts.notifications.find(
      (n) => n.type === 'task_deadline' && n.entityId === deadlineTask?.id
    );
    assert(!!deadlineNotif, 'Task deadline alert notification successfully delivered to recipient inbox');

    // 7.2 Repeated Sequential Scan Deduplication
    const repeatScan = await TaskService.checkUpcomingDeadlines();
    const countAfterRepeat = (await NotificationService.getUserNotifications(customsUser.id)).notifications.filter(
      (n) => n.type === 'task_deadline' && n.entityId === deadlineTask?.id
    ).length;
    assert(countAfterRepeat === 1, 'Repeated sequential scan strictly produces zero duplicates (1 notification only)');

    // 7.3 Concurrent Scans Deduplication
    const [concurrentResult1, concurrentResult2, concurrentResult3] = await Promise.all([
      TaskService.checkUpcomingDeadlines(),
      TaskService.checkUpcomingDeadlines(),
      TaskService.checkUpcomingDeadlines(),
    ]);
    const countAfterConcurrent = (await NotificationService.getUserNotifications(customsUser.id)).notifications.filter(
      (n) => n.type === 'task_deadline' && n.entityId === deadlineTask?.id
    ).length;
    assert(countAfterConcurrent === 1, 'Concurrent scans produce zero duplicate notifications (concurrency safety)');

    // 7.4 Deduplication Isolation Across Different Tasks
    const secondDeadlineTask = await TaskService.createTask(
      {
        requestId: testRequest.id,
        title: 'مهمة فحص ثانية لاختبار العزل',
        assignedUserId: customsUser.id,
        priority: 'urgent',
        dueDate: new Date(Date.now() - 7200 * 1000), // 2 hours ago
      },
      actorAdmin
    );
    const scanForSecondTask = await TaskService.checkUpcomingDeadlines();
    assert(scanForSecondTask.sentCount >= 1, 'Distinct task legitimately receives its own deadline notification');
    const secondTaskNotif = (await NotificationService.getUserNotifications(customsUser.id)).notifications.find(
      (n) => n.type === 'task_deadline' && n.entityId === secondDeadlineTask?.id
    );
    assert(!!secondTaskNotif, 'Second task notification delivered successfully without interference');

    // 7.5 Completed & Cancelled Tasks Excluded from Deadline Scans
    await TaskService.updateTaskStatus(secondDeadlineTask!.id, 'completed', actorAdmin);
    const thirdDeadlineTask = await TaskService.createTask(
      {
        requestId: testRequest.id,
        title: 'مهمة ملغاة لاختبار التجاهل',
        assignedUserId: customsUser.id,
        priority: 'normal',
        dueDate: new Date(Date.now() - 3600 * 1000),
      },
      actorAdmin
    );
    await TaskService.updateTaskStatus(thirdDeadlineTask!.id, 'cancelled', actorAdmin);
    const countBeforeTerminalScan = (await NotificationService.getUserNotifications(customsUser.id)).notifications.length;
    await TaskService.checkUpcomingDeadlines();
    const countAfterTerminalScan = (await NotificationService.getUserNotifications(customsUser.id)).notifications.length;
    assert(countBeforeTerminalScan === countAfterTerminalScan, 'Completed and cancelled overdue tasks are strictly excluded from scanner');

    // 7.6 Atomic Task Operations: Failure-Path Transaction Rollback Verification
    let rollbackVerified = false;
    const taskCountBeforeError = (await db.select({ count: requestAssignments.id }).from(requestAssignments)).length;
    try {
      // Simulate transaction failure using an invalid request UUID that causes a DB foreign key violation inside the tx
      await TaskService.createTask(
        {
          requestId: '00000000-0000-0000-0000-000000000000',
          title: 'مهمة لن تكتمل بسبب خطأ',
        },
        actorAdmin
      );
    } catch {
      rollbackVerified = true;
    }
    const taskCountAfterError = (await db.select({ count: requestAssignments.id }).from(requestAssignments)).length;
    assert(rollbackVerified, 'Invalid task operation triggers proper rejection error');
    assert(taskCountBeforeError === taskCountAfterError, 'Database error leaves zero partially committed records (Atomicity guaranteed)');

    // -----------------------------------------------------------------
    // TEST GROUP 8: Request Lifecycle Notification Triggers
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Request Lifecycle Notification Triggers ---');

    // 8.1 Request Assignment Notification
    await RequestService.assignRequest(
      testRequest.id,
      { assignedUserId: customsUser.id, notes: 'تكليف بالطلب' },
      actorAdmin
    );
    const notifsAfterReqAssign = await NotificationService.getUserNotifications(customsUser.id);
    const reqAssignNotif = notifsAfterReqAssign.notifications.find(
      (n) => n.entityType === 'request' && n.entityId === testRequest.id && n.type === 'assignment'
    );
    assert(!!reqAssignNotif, 'Request assignment triggered notification to assigned user');

    // 8.2 Request Status Change Notification
    await RequestService.transitionStatus(
      testRequest.id,
      { targetStatus: 'ready_for_processing', notes: 'جاهز للمعالجة' },
      actorAdmin
    );
    const notifsAfterStatus = await NotificationService.getUserNotifications(customsUser.id);
    const statusNotif = notifsAfterStatus.notifications.find(
      (n) => n.entityType === 'request' && n.entityId === testRequest.id && n.type === 'status_change'
    );
    assert(!!statusNotif, 'Request status change triggered notification to assigned user');

    // 8.3 Request Managerial Approval Decision Notification
    await RequestService.submitApprovalDecision(
      testRequest.id,
      { decision: 'approved', notes: 'معتمد رسمياً' },
      actorAdmin
    );
    const notifsAfterApproval = await NotificationService.getUserNotifications(customsUser.id);
    const approvalNotif = notifsAfterApproval.notifications.find(
      (n) => n.entityType === 'request' && n.entityId === testRequest.id && n.type === 'approval'
    );
    assert(!!approvalNotif, 'Managerial approval decision triggered notification to team');

    // -----------------------------------------------------------------
    // TEST GROUP 9: Notification Inbox, Isolation & Read Tracking
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: Notification Inbox & Strict User Isolation ---');

    // Unread count
    const initialUnreadCount = await NotificationService.getUnreadCount(customsUser.id);
    assert(initialUnreadCount > 0, 'Unread notification count accurately reflects pending items');

    // Mark single notification as read
    const firstNotif = notifsAfterApproval.notifications[0];
    const markedRead = await NotificationService.markAsRead(firstNotif.id, customsUser.id);
    assert(markedRead?.isRead === true, 'Single notification marked as read (isRead = true)');
    assert(markedRead?.readAt !== null, 'readAt timestamp populated upon reading');

    // Verify unread count decremented
    const updatedUnreadCount = await NotificationService.getUnreadCount(customsUser.id);
    assert(updatedUnreadCount === initialUnreadCount - 1, 'Unread count accurately decremented by 1');

    // Strict Isolation: User B cannot modify User A's notification
    let isolationCrossModRejected = false;
    try {
      await NotificationService.markAsRead(firstNotif.id, procurementUser.id);
    } catch {
      isolationCrossModRejected = true;
    }
    assert(isolationCrossModRejected, 'Cross-user notification modification strictly rejected (User Isolation)');

    // Mark all as read for user
    const markedAllCount = await NotificationService.markAllAsRead(customsUser.id);
    assert(markedAllCount >= 0, 'markAllAsRead successfully processed user inbox');
    const finalUnreadCount = await NotificationService.getUnreadCount(customsUser.id);
    assert(finalUnreadCount === 0, 'All notifications marked as read; final unread count is 0');

    // -----------------------------------------------------------------
    // TEST GROUP 10: Audit Trail Verification
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 10: Server-Side Audit Trail for Tasks ---');

    const [taskAudit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, 'task'),
          eq(auditLogs.action, 'create')
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(1);

    assert(!!taskAudit, 'Immutable audit log recorded for task creation');
    assert(taskAudit?.actorId === adminUser.id, 'Task audit log accurately records actor ID');

    console.log('\n====================================================');
    console.log(`🏁 PHASE 4 TESTS COMPLETED: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during Phase 4 verification tests:', err);
    process.exit(1);
  }
}

runPhase4Verification().then(() => {
  process.exit(0);
});
