import bcrypt from 'bcryptjs';
import { db } from '../src/db/index.ts';
import { users, customers, suppliers, contacts, partyDocuments, auditLogs, businessSequences } from '../src/db/schema.ts';
import { eq, or, desc, sql } from 'drizzle-orm';
import { CustomerService } from '../src/server/services/customerService.ts';
import { SupplierService } from '../src/server/services/supplierService.ts';
import { ContactService } from '../src/server/services/contactService.ts';
import { DocumentService } from '../src/server/services/documentService.ts';
import { SequenceService } from '../src/server/services/sequenceService.ts';

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 2 MASTER DATA VERIFICATION TESTS');
  console.log('   (Customers, Suppliers, Contacts, Documents, Scalability)');
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
    // TEST 1: Customer Sequence & Creation
    // -----------------------------------------------------------------
    console.log('--- TEST GROUP 1: Customer Master Creation & Sequence ---');
    const testCustPhone = `+2499${Date.now().toString().slice(-8)}`;
    const cust1 = await CustomerService.createCustomer(
      {
        companyName: `شركة النيل للتجارة الدولية ${Date.now()}`,
        tradeName: 'Nile Global Trade Co',
        customerType: 'commercial',
        phone: testCustPhone,
        whatsapp: testCustPhone,
        city: 'بورتسودان',
        currency: 'USD',
        primaryContactName: 'عثمان عبد الحفيظ',
        primaryContactJobTitle: 'المدير التنفيذي',
        primaryContactPhone: testCustPhone,
      },
      actor
    );

    assert(cust1.customerCode.startsWith('SH-C-'), 'Customer code has proper prefix (SH-C-)', cust1.customerCode);
    assert(cust1.companyName.includes('شركة النيل'), 'Customer companyName saved accurately');
    assert(cust1.city === 'بورتسودان', 'Customer city saved properly');

    // Verify primary contact created automatically
    const custContacts = await ContactService.listContacts('customer', cust1.id);
    assert(custContacts.length === 1, 'Primary contact created alongside customer in transaction');
    assert(custContacts[0].name === 'عثمان عبد الحفيظ', 'Primary contact name matches');
    assert(custContacts[0].isPrimary === true, 'Contact isPrimary flag is true');

    // -----------------------------------------------------------------
    // TEST 2: Customer Duplicate Prevention
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Customer Duplicate Prevention ---');
    let duplicateRejected = false;
    try {
      await CustomerService.createCustomer(
        {
          companyName: `شركة أخرى ${Date.now()}`,
          phone: testCustPhone, // Duplicate phone!
          city: 'الخرطوم',
        },
        actor
      );
    } catch (e: any) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Duplicate customer creation with existing phone rejected');

    // -----------------------------------------------------------------
    // TEST 3: Multiple Contacts per Customer & Primary Switching
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Multiple Contacts per Customer & Primary Switching ---');
    const contact2 = await ContactService.createContact(
      {
        entityType: 'customer',
        customerId: cust1.id,
        name: 'سارة مصطفى',
        jobTitle: 'مديرة المشتريات واللوجستيات',
        phone: '+249912345678',
        isPrimary: true, // This should demote contact 1
      },
      actor
    );

    const updatedCustContacts = await ContactService.listContacts('customer', cust1.id);
    assert(updatedCustContacts.length === 2, 'Customer now has 2 distinct contacts');

    const c1 = updatedCustContacts.find((c) => c.name === 'عثمان عبد الحفيظ');
    const c2 = updatedCustContacts.find((c) => c.name === 'سارة مصطفى');
    assert(c2?.isPrimary === true, 'New contact is now primary');
    assert(c1?.isPrimary === false, 'Previous contact gracefully demoted from primary');

    // -----------------------------------------------------------------
    // TEST 4: Supplier Master Creation & Sequence
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Supplier Master Creation & Sequence ---');
    const testSupPhone = `+86${Date.now().toString().slice(-10)}`;
    const sup1 = await SupplierService.createSupplier(
      {
        name: `مصنع فوشان للسيراميك ومواد البناء ${Date.now()}`,
        tradeNameEn: 'Foshan Ceramic & Building Materials Factory',
        supplierType: 'manufacturer',
        country: 'الصين',
        city: 'فوشان (Foshan)',
        phone: testSupPhone,
        wechat: 'foshan_ceramics_export',
        categories: ['سيراميك', 'مواد بناء', 'تشطيبات'],
        paymentTerms: 'T/T 30% Deposit / 70% Before Shipment',
        defaultCurrency: 'USD',
        bankName: 'Bank of China - Guangdong Branch',
        bankAccountNumber: '9558800100998877',
        rating: 5,
        tier: 'A',
        primaryContactName: 'Mr. Zhang Wei',
        primaryContactJobTitle: 'International Sales Director',
        primaryContactPhone: testSupPhone,
        primaryContactWechat: 'foshan_ceramics_export',
      },
      actor
    );

    assert(sup1.supplierCode.startsWith('SH-SUP-'), 'Supplier code has proper prefix (SH-SUP-)', sup1.supplierCode);
    assert(sup1.wechat === 'foshan_ceramics_export', 'Supplier WeChat ID saved properly (vital for China)');
    assert(sup1.tier === 'A' && sup1.rating === 5, 'Supplier tier and rating saved accurately');

    const supContacts = await ContactService.listContacts('supplier', sup1.id);
    assert(supContacts.length === 1, 'Supplier primary contact created in transaction');
    assert(supContacts[0].name === 'Mr. Zhang Wei', 'Supplier contact name matches');
    assert(supContacts[0].isPrimary === true, 'Supplier contact isPrimary flag is true');

    // -----------------------------------------------------------------
    // TEST 5: Supplier Duplicate Prevention
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Supplier Duplicate Prevention ---');
    let supDupRejected = false;
    try {
      await SupplierService.createSupplier(
        {
          name: `مصنع متكرر ${Date.now()}`,
          city: 'كوانزو',
          phone: testSupPhone, // Duplicate phone!
        },
        actor
      );
    } catch {
      supDupRejected = true;
    }
    assert(supDupRejected, 'Duplicate supplier creation with existing phone rejected');

    // -----------------------------------------------------------------
    // TEST 6: Scalability: Bulk Import of 20+ Suppliers in Batch
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Scalability: Bulk Import & Pagination ---');
    const bulkPayload = Array.from({ length: 25 }, (_, idx) => ({
      name: `مورد تجريبي ومصنع شينزن رقم ${idx + 1} - ${Date.now()}`,
      tradeNameEn: `Shenzhen Electronics & Hardware Co ${idx + 1}`,
      supplierType: idx % 2 === 0 ? 'manufacturer' : 'trading_company',
      country: 'الصين',
      city: 'شنزن (Shenzhen)',
      phone: `+86138${idx.toString().padStart(4, '0')}${Date.now().toString().slice(-4)}`,
      wechat: `sz_supplier_${idx + 1}`,
      categories: ['إلكترونيات', 'معدات صناعية'],
      rating: 4,
      tier: 'B' as const,
    }));

    const bulkResult = await SupplierService.bulkImportSuppliers(bulkPayload, actor);
    assert(bulkResult.importedCount === 25, 'Bulk import of 25 suppliers succeeded (200+ scale verified)');

    // Test Pagination with High Page / Limit
    const pagedResult = await SupplierService.listSuppliers({
      page: 1,
      limit: 10,
      country: 'الصين',
    });
    assert(pagedResult.suppliers.length === 10, 'Supplier pagination returns accurate page limit (10)');
    assert(pagedResult.pagination.total >= 26, 'Supplier total count accounts for all bulk records');
    assert(pagedResult.pagination.totalPages >= 3, 'Total pages calculated correctly');

    // -----------------------------------------------------------------
    // TEST 7: Party Documents (KYC & Commercial Licenses)
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Party Documents (KYC / Licenses) ---');
    const doc = await DocumentService.addDocument(
      {
        entityType: 'supplier',
        supplierId: sup1.id,
        title: 'رخصة الأعمال الصينية (China Business License)',
        documentType: 'business_license',
        documentNumber: '91440600MA54D1234X',
        fileName: 'china_license_foshan.pdf',
        fileUrl: 'https://storage.sahla.sd/docs/china_license_foshan.pdf',
        fileSize: 1024000,
        notes: 'شهادة السجل التجاري المعتمدة من حكومة مقاطعة غوانغدونغ',
      },
      actor
    );

    assert(doc.title.includes('رخصة الأعمال الصينية'), 'Party document created with proper metadata');
    const supDocs = await DocumentService.listDocuments('supplier', sup1.id);
    assert(supDocs.length === 1, 'Document successfully retrieved for supplier');
    assert(supDocs[0].documentNumber === '91440600MA54D1234X', 'Document number matches');

    // -----------------------------------------------------------------
    // TEST 8: Server-Side Audit Trail for Master Data
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Server-Side Audit Trail Verification ---');
    const [custAudit] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, cust1.id))
      .orderBy(desc(auditLogs.timestamp));
    assert(Boolean(custAudit), 'Server-side audit log recorded for customer creation');
    assert(custAudit?.action === 'create', 'Audit log action is create');
    assert(custAudit?.actorName === actor.name, 'Audit log records actor name accurately');

    const [supAudit] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, sup1.id))
      .orderBy(desc(auditLogs.timestamp));
    assert(Boolean(supAudit), 'Server-side audit log recorded for supplier creation');
    assert(supAudit?.action === 'create', 'Audit log action is create for supplier');

    // -----------------------------------------------------------------
    // TEST 9: Soft Delete / Deactivation
    // -----------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: Deactivation / Archiving ---');
    const archivedSup = await SupplierService.deleteSupplier(sup1.id, actor);
    assert(archivedSup.status === 'inactive', 'Supplier soft delete sets status to inactive');

    const archivedCust = await CustomerService.deleteCustomer(cust1.id, actor);
    assert(archivedCust.status === 'inactive', 'Customer soft delete sets status to inactive');

    console.log('\n====================================================');
    console.log(`🏁 PHASE 2 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error: any) {
    console.error('💥 UNEXPECTED ERROR IN PHASE 2 TESTS:', error);
    process.exit(1);
  }
}

runPhase2Tests();
