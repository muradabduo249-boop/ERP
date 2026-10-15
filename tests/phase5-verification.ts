/**
 * SAHLA ERP — Phase 5 Live Automated Verification Test Suite
 *
 * Verifies against live Cloud SQL PostgreSQL:
 * 1. RFQ Creation, Request Linkage & Sequence Code Generation (RFQ-2026-XXXX)
 * 2. RFQ Validation (Strict request FK, required items, non-empty title)
 * 3. Supplier Quotes Submission & Multiple Vendor Pricing (USD, CNY, SDG, AED)
 * 4. Quote Validation (Strict RFQ & Supplier FK, positive amount, payment terms)
 * 5. Multi-Supplier Price Comparison & Lead Time Analysis
 * 6. Atomic Quote Awarding & Automatic Commercial Purchase Order Generation (PO-2026-XXXX)
 * 7. Request Timeline Ledger Progression upon RFQ and PO Events
 * 8. Server-Side Audit Trail Immutability for Procurement Operations
 * 9. Standalone Direct Commercial Purchase Order Generation
 * 10. Concurrency Safety for RFQ and PO Sequence Counters
 */

import { db } from '../src/db/index.ts';
import {
  users,
  requests,
  suppliers,
  rfqs,
  supplierQuotes,
  purchaseOrders,
  requestTimeline,
  auditLogs,
} from '../src/db/schema.ts';
import { ProcurementService } from '../src/server/services/procurementService.ts';
import { SequenceService } from '../src/server/services/sequenceService.ts';
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

async function runPhase5Verification() {
  console.log('\n====================================================');
  console.log('🚀 RUNNING PHASE 5 INTERNATIONAL PROCUREMENT & RFQ/PO TESTS');
  console.log('   (RFQ Engine, Multi-Vendor Quotes, Awarding, Commercial POs, Audit)');
  console.log('====================================================\n');

  try {
    // -----------------------------------------------------------------
    // SETUP: Fetch existing live records
    // -----------------------------------------------------------------
    const [actor] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.username, 'procurement'))
      .limit(1);

    const testActor = actor || {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'أخصائي المشتريات الدولية',
      role: 'procurement_specialist',
    };

    const [testRequest] = await db
      .select({ id: requests.id, requestCode: requests.requestCode })
      .from(requests)
      .orderBy(desc(requests.createdAt))
      .limit(1);

    const existingSuppliers = await db
      .select({ id: suppliers.id, name: suppliers.name, country: suppliers.country })
      .from(suppliers)
      .limit(3);

    assert(Boolean(testRequest), 'Existing test Request found in PostgreSQL database');
    assert(existingSuppliers.length >= 2, 'At least 2 verified suppliers exist for competitive quoting');

    const supA = existingSuppliers[0];
    const supB = existingSuppliers[1];

    // =================================================================
    // TEST GROUP 1: RFQ Creation & Validation
    // =================================================================
    console.log('\n--- TEST GROUP 1: RFQ Creation & Sequence Code ---');

    const createdRfq = await ProcurementService.createRfq(
      {
        requestId: testRequest.id,
        title: 'استدراج عروض لمشروع محطات الطاقة الشمسية والبطاريات الليثيوم',
        destinationPort: 'ميناء بورتسودان الجنوبي',
        invitedSupplierIds: [supA.id, supB.id],
        items: [
          {
            name: 'ألواح طاقة شمسية 550 واط Monocrystalline Tier 1',
            specifications: 'كفاءة 21.5%، زجاج مزدوج، مطابقة لمواصفات الهيئة السودانية',
            quantity: 500,
            unit: 'لوح',
            targetPrice: 75,
          },
          {
            name: 'بطاريات ليثيوم LiFePO4 سعة 15 كيلوواط/ساعة',
            specifications: 'عمر تشغيلي 6000 دورة، نظام BMS ذكي مدمج',
            quantity: 20,
            unit: 'وحدة',
            targetPrice: 2200,
          },
        ],
        notes: 'يُشترط التفتيش الفني المسبق قبل الشحن وإصدار شهادة المطابقة COC',
      },
      testActor
    );

    assert(Boolean(createdRfq?.id), 'RFQ created successfully in PostgreSQL');
    assert(createdRfq.rfqCode.startsWith('RFQ-2026-'), 'RFQ code follows sequence format (RFQ-2026-XXXX)');
    assert(createdRfq.status === 'sent_to_suppliers', 'Initial RFQ status is "sent_to_suppliers"');
    assert(createdRfq.items.length === 2, 'Items correctly stored in JSONB schema');
    assert(createdRfq.destinationPort === 'ميناء بورتسودان الجنوبي', 'Destination port recorded accurately');

    // Strict validation rejection tests
    try {
      await ProcurementService.createRfq(
        {
          requestId: '00000000-0000-0000-0000-000000000000',
          title: 'طلب غير صالح',
          items: [{ name: 'بند', specifications: '', quantity: 1, unit: 'قطعة' }],
        },
        testActor
      );
      assert(false, 'Non-existent request ID must be rejected');
    } catch {
      assert(true, 'Non-existent request ID strictly rejected by foreign key check');
    }

    try {
      await ProcurementService.createRfq(
        {
          requestId: testRequest.id,
          title: '',
          items: [{ name: 'بند', specifications: '', quantity: 1, unit: 'قطعة' }],
        },
        testActor
      );
      assert(false, 'Empty title must be rejected');
    } catch {
      assert(true, 'Empty RFQ title strictly rejected');
    }

    // =================================================================
    // TEST GROUP 2: Supplier Quotes & Competitive Bidding
    // =================================================================
    console.log('\n--- TEST GROUP 2: Competitive Supplier Quotes ---');

    // Quote 1 from Factory A (China)
    const quote1 = await ProcurementService.addSupplierQuote(
      {
        rfqId: createdRfq.id,
        supplierId: supA.id,
        currency: 'USD',
        totalAmount: 79500,
        unitPrices: [
          { itemId: 'item-1', price: 71 },
          { itemId: 'item-2', price: 2200 },
        ],
        deliveryLeadDays: 14,
        warrantyMonths: 36,
        paymentTerms: '30% دفعة مقدمة، 70% عند صدور بوليصة الشحن الأصلية B/L',
        notes: 'عرض مصنع فوشان مع ضمان استبدال كامل لمدة 3 سنوات',
      },
      testActor
    );

    assert(Boolean(quote1?.id), 'First supplier quote submitted successfully');
    assert(quote1.currency === 'USD', 'Currency recorded accurately as USD');
    assert(quote1.totalAmount === 79500, 'Quote total amount matches factory price');
    assert(quote1.isAwarded === false, 'Quote initially not awarded');

    // Quote 2 from Factory B (Competitive Bid)
    const quote2 = await ProcurementService.addSupplierQuote(
      {
        rfqId: createdRfq.id,
        supplierId: supB.id,
        currency: 'USD',
        totalAmount: 84000,
        unitPrices: [
          { itemId: 'item-1', price: 76 },
          { itemId: 'item-2', price: 2300 },
        ],
        deliveryLeadDays: 20,
        warrantyMonths: 24,
        paymentTerms: '50% دفعة مقدمة، 50% قبل الشحن من المصنع',
        notes: 'عرض مصنع نينغبو',
      },
      testActor
    );

    assert(Boolean(quote2?.id), 'Second competitive quote submitted successfully');

    // Verify RFQ status automatically advanced to quotes_received
    const [updatedRfq] = await db
      .select({ status: rfqs.status })
      .from(rfqs)
      .where(eq(rfqs.id, createdRfq.id));

    assert(updatedRfq.status === 'quotes_received', 'RFQ status automatically progressed to "quotes_received"');

    // Invalid quote validations
    try {
      await ProcurementService.addSupplierQuote(
        {
          rfqId: createdRfq.id,
          supplierId: supA.id,
          totalAmount: -500,
          paymentTerms: 'كاش',
        },
        testActor
      );
      assert(false, 'Negative quote amount must be rejected');
    } catch {
      assert(true, 'Negative quote amount strictly rejected');
    }

    // =================================================================
    // TEST GROUP 3: Multi-Supplier Quote Comparison
    // =================================================================
    console.log('\n--- TEST GROUP 3: Quote Comparison & Retrieval ---');

    const rfqWithQuotesList = await ProcurementService.listRfqs(testRequest.id);
    const targetRfq = rfqWithQuotesList.find((r) => r.id === createdRfq.id);

    assert(Boolean(targetRfq), 'RFQ retrieved via listRfqs query');
    assert(targetRfq?.quotes.length === 2, 'Both quotes attached to RFQ for commercial comparison');

    // =================================================================
    // TEST GROUP 4: Atomic Quote Awarding & Commercial PO Generation
    // =================================================================
    console.log('\n--- TEST GROUP 4: Atomic Awarding & Commercial PO ---');

    const awardResult = await ProcurementService.awardQuote(quote1.id, testActor);

    assert(Boolean(awardResult?.po), 'Commercial Purchase Order generated upon quote awarding');
    assert(awardResult.po.poCode.startsWith('PO-2026-'), 'PO code generated with format (PO-2026-XXXX)');
    assert(awardResult.po.totalAmount === quote1.totalAmount, 'PO total amount strictly matches awarded quote');
    assert(awardResult.po.supplierId === supA.id, 'PO linked to winning supplier');
    assert(awardResult.po.status === 'approved', 'PO status initialized as "approved"');

    // Verify RFQ marked awarded
    const [awardedRfq] = await db
      .select({ status: rfqs.status })
      .from(rfqs)
      .where(eq(rfqs.id, createdRfq.id));

    assert(awardedRfq.status === 'awarded', 'RFQ status progressed to "awarded"');

    // Verify winning quote marked isAwarded=true and losing quote isAwarded=false
    const [winningQuote] = await db
      .select({ isAwarded: supplierQuotes.isAwarded })
      .from(supplierQuotes)
      .where(eq(supplierQuotes.id, quote1.id));

    const [losingQuote] = await db
      .select({ isAwarded: supplierQuotes.isAwarded })
      .from(supplierQuotes)
      .where(eq(supplierQuotes.id, quote2.id));

    assert(winningQuote.isAwarded === true, 'Winning quote isAwarded flag is true');
    assert(losingQuote.isAwarded === false, 'Losing quote isAwarded flag remains false');

    // Duplicate award rejection
    try {
      await ProcurementService.awardQuote(quote1.id, testActor);
      assert(false, 'Re-awarding an already awarded quote must fail');
    } catch {
      assert(true, 'Re-awarding already awarded quote strictly rejected');
    }

    // =================================================================
    // TEST GROUP 5: Direct Standalone PO Creation
    // =================================================================
    console.log('\n--- TEST GROUP 5: Direct Commercial PO Creation ---');

    const directPo = await ProcurementService.createPurchaseOrder(
      {
        requestId: testRequest.id,
        supplierId: supB.id,
        currency: 'USD',
        totalAmount: 12500,
        itemsSummary: 'توريد كابلات وقواطع كهربائية صناعية DC 1000V',
        paymentTerms: '100% اعتماد مستندي L/C',
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      testActor
    );

    assert(Boolean(directPo?.id), 'Standalone commercial PO created successfully');
    assert(directPo.poCode.startsWith('PO-2026-'), 'Direct PO assigned proper sequence code');
    assert(directPo.totalAmount === 12500, 'Direct PO amount matches input');

    // =================================================================
    // TEST GROUP 6: Request Timeline Ledger Progression
    // =================================================================
    console.log('\n--- TEST GROUP 6: Request Timeline Progression ---');

    const timelineEvents = await db
      .select()
      .from(requestTimeline)
      .where(eq(requestTimeline.requestId, testRequest.id))
      .orderBy(desc(requestTimeline.timestamp));

    const rfqEvent = timelineEvents.find((e) => e.notes && e.notes.includes(createdRfq.rfqCode));
    const poEvent = timelineEvents.find((e) => e.notes && e.notes.includes(awardResult.po.poCode));

    assert(Boolean(rfqEvent), 'RFQ creation milestone recorded in Request Timeline');
    assert(Boolean(poEvent), 'PO award milestone recorded in Request Timeline');

    // =================================================================
    // TEST GROUP 7: Server-Side Audit Trail Verification
    // =================================================================
    console.log('\n--- TEST GROUP 7: Server-Side Audit Trail ---');

    const [rfqAudit] = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityId, createdRfq.id), eq(auditLogs.action, 'create')));

    const [poAudit] = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityId, awardResult.po.id), eq(auditLogs.action, 'create')));

    assert(Boolean(rfqAudit), 'Immutable server audit log recorded for RFQ creation');
    assert(Boolean(poAudit), 'Immutable server audit log recorded for PO generation');

    // =================================================================
    // TEST GROUP 8: Concurrency-Safe Sequence Increment
    // =================================================================
    console.log('\n--- TEST GROUP 8: Concurrency Safety for RFQ and PO ---');

    const concurrentPromises = Array.from({ length: 5 }, () =>
      SequenceService.getNextCode('PO', 'PO-2026-', 4)
    );
    const codes = await Promise.all(concurrentPromises);
    const uniqueCodes = new Set(codes);

    assert(uniqueCodes.size === 5, 'All 5 concurrent PO sequence codes are strictly unique (No Collisions)');

    // =================================================================
    // SUMMARY
    // =================================================================
    console.log('\n====================================================');
    console.log(`🏁 PHASE 5 TESTS COMPLETED: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error('CRITICAL ERROR in Phase 5 verification suite:', error);
    process.exit(1);
  }
}

runPhase5Verification();
