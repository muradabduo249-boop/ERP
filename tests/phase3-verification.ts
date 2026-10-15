import { db } from '../src/db/index.ts';
import { users, customers, requests, requestTimeline, requestAssignments, partyDocuments, auditLogs } from '../src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { RequestService } from '../src/server/services/requestService.ts';
import { CustomerService } from '../src/server/services/customerService.ts';
import { DocumentService } from '../src/server/services/documentService.ts';

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 3 REQUEST CORE / WORKFLOW VERIFICATION');
  console.log('   (Request Master, Timeline, State Machine, Assignments, Audit)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // Get admin user for actor context
  const [adminUser] = await db.select().from(users).where(eq(users.username, 'admin'));
  if (!adminUser) {
    throw new Error('Admin user not found. Ensure Phase 1 seed has run.');
  }
  const actor = { id: adminUser.id, name: adminUser.name, role: 'super_admin' };

  try {
    // -----------------------------------------------------------------
    // TEST 1: Setup Real Customer for Request Link
    // -----------------------------------------------------------------
    console.log('--- TEST GROUP 1: Request Creation & Sequence Code ---');
    const custPhone = `+2499${Date.now().toString().slice(-8)}`;
    const cust = await CustomerService.createCustomer(
      {
        companyName: `شركة الاستيراد المتقدمة ${Date.now()}`,
        phone: custPhone,
        customerType: 'commercial',
        city: 'بورتسودان',
      },
      actor
    );

    const req1 = (await RequestService.createRequest(
      {
        customerId: cust.id,
        title: 'استيراد حاوية 40 قدم معدات صناعية من فوشان',
        requestType: 'PURCHASE_AND_SHIP',
        priority: 'high',
        originCountry: 'الصين',
        destinationCountry: 'السودان',
        destinationCity: 'بورتسودان',
        estimatedBudget: 45000,
        currency: 'USD',
        notes: 'معدات مصانع ذات حساسية عالية يلزم فحصها قبل الشحن',
      },
      actor
    ))!;

    assert(Boolean(req1), 'Request created successfully');
    assert(req1.requestCode.startsWith('REQ-2026-'), 'Request code has proper prefix (REQ-2026-)', req1.requestCode);
    assert(req1.status === 'new', 'Initial status of unassigned request is "new"');
    assert(req1.approvalStatus === 'none', 'Initial approval status is "none"');
    assert(req1.customer.id === cust.id, 'Request is strictly linked to real Customer in PostgreSQL');
    assert(req1.priority === 'high', 'Priority recorded accurately');

    // -----------------------------------------------------------------
    // TEST 2: Customer Relationship Enforcement (Foreign Key Protection)
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Customer Foreign Key Validation ---');
    let fakeCustRejected = false;
    try {
      await RequestService.createRequest(
        {
          customerId: '00000000-0000-0000-0000-000000000000', // Non-existent customer
          title: 'طلب لعميل غير موجود',
          requestType: 'SHIPPING_ONLY',
        },
        actor
      );
    } catch {
      fakeCustRejected = true;
    }
    assert(fakeCustRejected, 'Creation with non-existent customerId strictly rejected');

    // -----------------------------------------------------------------
    // TEST 3: Initial Timeline Creation
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Request Timeline Initialization ---');
    assert(req1.timeline.length >= 1, 'Initial event automatically added to timeline');
    assert(req1.timeline[0].eventType === 'created', 'First timeline event is "created"');
    assert(req1.timeline[0].actorName === actor.name, 'Timeline records accurate actor');

    // -----------------------------------------------------------------
    // TEST 4: Assignment to Active Employee
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Request Assignment & Auto-Status ---');
    const assignedReq = (await RequestService.assignRequest(
      req1.id,
      {
        assignedUserId: adminUser.id,
        notes: 'إسناد الطلب لمدير العمليات للمتابعة مع المصانع',
      },
      actor
    ))!;

    assert(assignedReq.assignedUserId === adminUser.id, 'Request assigned to user accurately');
    assert(assignedReq.status === 'assigned', 'Assigning "new" request automatically progresses status to "assigned"');

    // Check timeline has assignment event
    const assignEvent = assignedReq.timeline.find((t: any) => t.eventType === 'assigned');
    assert(Boolean(assignEvent), 'Timeline includes "assigned" event with details');

    // -----------------------------------------------------------------
    // TEST 5: Strict State Machine Valid Transitions
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: State Machine: Valid Progression ---');
    // assigned -> ready_for_processing
    const rReady = (await RequestService.transitionStatus(
      req1.id,
      { targetStatus: 'ready_for_processing', notes: 'تم استلام عينات البضائع وجاهز للتنفيذ' },
      actor
    ))!;
    assert(rReady.status === 'ready_for_processing', 'Transitioned: assigned -> ready_for_processing');
    assert(Boolean(rReady.readyForProcessingAt), 'readyForProcessingAt timestamp set');

    // ready_for_processing -> in_progress
    const rProgress = (await RequestService.transitionStatus(
      req1.id,
      { targetStatus: 'in_progress', notes: 'بدء مرحلة التعاقد وتجهيز الشحنة' },
      actor
    ))!;
    assert(rProgress.status === 'in_progress', 'Transitioned: ready_for_processing -> in_progress');

    // in_progress -> on_hold
    const rHold = (await RequestService.transitionStatus(
      req1.id,
      { targetStatus: 'on_hold', notes: 'في انتظار تحويل الدفعة المقدمة من العميل' },
      actor
    ))!;
    assert(rHold.status === 'on_hold', 'Transitioned: in_progress -> on_hold');

    // on_hold -> in_progress (resumed)
    const rResumed = (await RequestService.transitionStatus(
      req1.id,
      { targetStatus: 'in_progress', notes: 'تم استلام الإشعار البنكي واستئناف العمل' },
      actor
    ))!;
    assert(rResumed.status === 'in_progress', 'Transitioned: on_hold -> in_progress (Resumed)');

    // in_progress -> completed
    const rCompleted = (await RequestService.transitionStatus(
      req1.id,
      { targetStatus: 'completed', notes: 'تم تسليم البضاعة في بورتسودان وإنهاء كافة الإجراءات' },
      actor
    ))!;
    assert(rCompleted.status === 'completed', 'Transitioned: in_progress -> completed');
    assert(Boolean(rCompleted.completedAt), 'completedAt timestamp set');

    // -----------------------------------------------------------------
    // TEST 6: Strict State Machine Invalid Transitions Rejection
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: State Machine: Invalid Transitions Rejection ---');
    // Attempt to transition completed request back to in_progress (completed is terminal!)
    let terminalViolationRejected = false;
    try {
      await RequestService.transitionStatus(
        req1.id,
        { targetStatus: 'in_progress', notes: 'محاولة غير قانونية لتغيير طلب مكتمل' },
        actor
      );
    } catch {
      terminalViolationRejected = true;
    }
    assert(terminalViolationRejected, 'Transitioning terminal "completed" request rejected by state machine');

    // Create a new request and attempt illegal jump new -> completed
    const req2 = (await RequestService.createRequest(
      {
        customerId: cust.id,
        title: 'طلب اختبار تخطي المراحل',
        requestType: 'CUSTOMS_CLEARANCE',
      },
      actor
    ))!;

    let illegalJumpRejected = false;
    try {
      await RequestService.transitionStatus(
        req2.id,
        { targetStatus: 'completed', notes: 'محاولة القفز المباشر' },
        actor
      );
    } catch {
      illegalJumpRejected = true;
    }
    assert(illegalJumpRejected, 'Illegal transition (new -> completed) strictly rejected with 400 error');

    // -----------------------------------------------------------------
    // TEST 7: Manager Approval Decisions (Distinct from Operational Status)
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Distinct Approval Decisions ---');
    const rApproved = (await RequestService.submitApprovalDecision(
      req2.id,
      {
        decision: 'approved',
        notes: 'معتمد من مدير العمليات وفق لائحة الأسعار القياسية',
      },
      actor
    ))!;
    assert(rApproved.approvalStatus === 'approved', 'Approval status updated to "approved"');
    assert(rApproved.status === 'new', 'Operational status remains distinct from approval decision');

    const approvalEvent = rApproved.timeline.find((t: any) => t.eventType === 'approved');
    assert(Boolean(approvalEvent), 'Timeline recorded manager approval event');

    // -----------------------------------------------------------------
    // TEST 8: Timeline Notes
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Timeline Manual Notes & Activity Logging ---');
    const noteEvent = await RequestService.addTimelineNote(
      req2.id,
      'تم إرسال مسودة بوليصة الشحن للعميل للمراجعة عبر الواتساب',
      actor
    );
    assert(noteEvent.eventType === 'note_added', 'Timeline note added successfully');
    assert(Boolean(noteEvent.notes && noteEvent.notes.includes('مسودة بوليصة')), 'Timeline note content matches');

    // -----------------------------------------------------------------
    // TEST 9: Request Sub-Tasks / Assignments
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: Request Sub-Tasks Engine ---');
    const task = await RequestService.createTask(
      req2.id,
      {
        title: 'فحص الحاوية في ميناء بورتسودان الجنوبي',
        priority: 'high',
        assignedUserId: adminUser.id,
        notes: 'التأكد من سلامة الأختام الجمركية وشهادة المطابقة',
      },
      actor
    );

    assert(task?.title?.includes('فحص الحاوية') || false, 'Task created and linked to Request');
    assert(task?.status === 'pending', 'Initial task status is "pending"');

    const updatedTask = await RequestService.updateTaskStatus(task!.id, 'completed', actor);
    assert(updatedTask?.status === 'completed', 'Task status updated to "completed"');

    // -----------------------------------------------------------------
    // TEST 10: Document Linkage Foundation (Universal Attachments)
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 10: Universal Document Linkage to Request ---');
    const doc = await DocumentService.addDocument(
      {
        entityType: 'request',
        requestId: req2.id,
        title: 'بوليصة الشحن البحري (Bill of Lading - B/L)',
        documentType: 'bill_of_lading',
        documentNumber: 'COSU6354128990',
        fileName: 'bol_cosco_guangzhou.pdf',
        fileUrl: 'https://storage.sahla.sd/requests/bol_cosco.pdf',
        notes: 'بوليصة الشحن الصادرة من خط كورسكو للشحن الدولي',
      },
      actor
    );

    assert(Boolean(doc), 'Document created for Request');
    const loadedReq2 = await RequestService.getRequestById(req2.id);
    assert(loadedReq2?.documents.length! >= 1, 'Document successfully retrieved in Request details');
    assert(loadedReq2?.documents[0].documentType === 'bill_of_lading', 'Document type matches');

    // -----------------------------------------------------------------
    // TEST 11: Immutable Audit Trail Verification for Requests
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 11: Audit Trail Verification for Requests ---');
    const [auditReq] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, req1.id))
      .orderBy(desc(auditLogs.timestamp));

    assert(Boolean(auditReq), 'Audit log successfully recorded for Request lifecycle');
    assert(auditReq?.actorName === actor.name, 'Audit log accurately records actor name');

    // -----------------------------------------------------------------
    // TEST 12: List Requests with Search, Queues, and Pagination
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 12: List Requests, Queues, and Pagination ---');
    const listResult = await RequestService.listRequests({
      page: 1,
      limit: 10,
      search: 'معدات صناعية',
    });

    assert(listResult.requests.length >= 1, 'Search query successfully found matching request');
    assert(listResult.pagination.total >= 1, 'Pagination total count accurately calculated');
    assert(Boolean(listResult.requests[0].customer.companyName), 'Customer companyName joined in list');

    console.log('\n====================================================');
    console.log(`🏁 PHASE 3 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error: any) {
    console.error('💥 UNEXPECTED ERROR IN PHASE 3 TESTS:', error);
    process.exit(1);
  }
}

runPhase3Tests();
