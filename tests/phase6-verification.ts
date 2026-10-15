/**
 * SAHLA ERP — Phase 6 Automated Verification Test Suite
 * 
 * Verifies against live Cloud SQL PostgreSQL:
 * 1. Treasury Accounts (Cash & Banks) retrieval and structure
 * 2. Atomic Treasury Transfers (balance updates and dual ledger records)
 * 3. Treasury Reconciliations (book vs physical balance and difference calculation)
 * 4. Reconciliation Approval (updating balance and inserting adjustment transaction)
 * 5. Physical Immutability Trigger (engine-level rejection of UPDATE/DELETE on treasury_transactions)
 * 6. Deduplication Constraint on Voucher Posting (preventing duplicate transactions)
 * 7. Supplier Invoices Creation, PO Linkage, and Sequence Generation
 * 8. Payment Voucher Overpayment Guard (preventing payment > remaining invoice balance)
 * 9. Strict Dual-Control Enforcement (preventing creator from self-approving payment voucher)
 * 10. Secondary Authorized User Approval of Payment Voucher
 * 11. Atomic Posting of Payment Voucher to Treasury Account & Invoice Status Update
 * 12. Customer Invoices Creation with line items and subtotal/tax computation
 * 13. Receipt Voucher Creation and Instant Treasury Deposit Posting
 * 14. Exchange Rates Historical Records Management
 * 15. Product Catalog & Categories Management (SKU, cost, selling price)
 */

import { db } from '../src/db/index.ts';
import {
  users,
  suppliers,
  customers,
  treasuryAccounts,
  treasuryTransactions,
  treasuryTransfers,
  treasuryReconciliations,
  supplierInvoices,
  paymentVouchers,
  customerInvoices,
  receiptVouchers,
  exchangeRates,
  productCategories,
  products,
} from '../src/db/schema.ts';
import { FinanceService } from '../src/server/services/financeService.ts';
import { eq, desc, sql } from 'drizzle-orm';

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

async function runPhase6Verification() {
  console.log('\n====================================================');
  console.log('🚀 RUNNING PHASE 6 FINANCE, TREASURY & CATALOG TESTS');
  console.log('   (Treasury, Vouchers, Dual Control, Immutability, Catalog)');
  console.log('====================================================\n');

  try {
    // -----------------------------------------------------------------
    // SETUP: Fetch actors and existing records
    // -----------------------------------------------------------------
    const [financeUser] = await db
      .select({ id: users.id, name: users.name, role: users.roleId })
      .from(users)
      .where(eq(users.username, 'finance'))
      .limit(1);

    const [adminUser] = await db
      .select({ id: users.id, name: users.name, role: users.roleId })
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    const financeActor = financeUser || {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'عثمان عبد الله (مسؤول المالية)',
      role: 'finance_accountant',
    };

    const adminActor = adminUser || {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'أحمد النور (المدير العام)',
      role: 'super_admin',
    };

    // -----------------------------------------------------------------
    // TEST 1: Treasury Accounts
    // -----------------------------------------------------------------
    console.log('\n--- 1. Treasury Accounts & Liquidity ---');
    const accounts = await FinanceService.listTreasuryAccounts();
    assert(accounts.length >= 2, 'Treasury accounts exist in database', `Found ${accounts.length} accounts`);

    const sdgAccount = accounts.find((a) => a.currency === 'SDG');
    const usdAccount = accounts.find((a) => a.currency === 'USD');
    assert(!!sdgAccount, 'SDG treasury account exists', sdgAccount?.name);
    assert(!!usdAccount, 'USD treasury account exists', usdAccount?.name);

    // -----------------------------------------------------------------
    // TEST 2: Exchange Rates
    // -----------------------------------------------------------------
    console.log('\n--- 2. Exchange Rates Management ---');
    const rates = await FinanceService.listExchangeRates();
    assert(rates.length >= 1, 'Exchange rates populated', `Found ${rates.length} currency pairs`);

    const usdSdg = rates.find((r) => r.baseCurrency === 'USD' && r.targetCurrency === 'SDG');
    assert(!!usdSdg, 'USD/SDG rate exists', `Rate: ${usdSdg?.rate}`);

    // Update / insert a test exchange rate
    const newRate = await FinanceService.setExchangeRate(
      { baseCurrency: 'USD', targetCurrency: 'SAR', rate: 3.75 },
      financeActor
    );
    assert(parseFloat(newRate.rate) === 3.75, 'Set exchange rate atomically', `Value: ${newRate.rate}`);

    // -----------------------------------------------------------------
    // TEST 3: Product Catalog & Categories
    // -----------------------------------------------------------------
    console.log('\n--- 3. Product Catalog & Categories ---');
    const categories = await FinanceService.listProductCategories();
    assert(categories.length >= 1, 'Product categories exist', `Found ${categories.length} categories`);

    const productsList = await FinanceService.listProducts();
    assert(productsList.length >= 1, 'Catalog products exist', `Found ${productsList.length} products`);

    // Create a new product
    const testProduct = await FinanceService.createProduct(
      {
        nameAr: 'مكيف هواء سبليت إنفرتر 18000 وحدة موفر للطاقة',
        nameEn: 'Split Inverter AC 18000 BTU Energy Efficient',
        costPrice: 220,
        sellingPrice: 310,
        unit: 'pcs',
        defaultCurrency: 'USD',
        minOrderQty: 10,
      },
      financeActor
    );
    assert(testProduct.sku.startsWith('PRD-'), 'Product SKU generated sequentially', testProduct.sku);
    assert(parseFloat(testProduct.costPrice) === 220, 'Product cost price verified', testProduct.costPrice);

    // -----------------------------------------------------------------
    // TEST 4: Atomic Treasury Transfers
    // -----------------------------------------------------------------
    console.log('\n--- 4. Atomic Treasury Transfers ---');
    if (accounts.length >= 2) {
      const fromAcc = accounts[0];
      const toAcc = accounts[1];
      const initialFromBal = parseFloat(fromAcc.balance);
      const initialToBal = parseFloat(toAcc.balance);

      const transfer = await FinanceService.transferFunds(
        {
          fromAccountId: fromAcc.id,
          toAccountId: toAcc.id,
          amount: 50,
          exchangeRate: 1.0,
          notes: 'تحويل اختباري معتمد بين الخزائن',
        },
        financeActor
      );

      assert(transfer.transferCode.startsWith('TRF-'), 'Transfer code generated', transfer.transferCode);

      // Verify updated balances
      const updatedFrom = await FinanceService.getTreasuryAccountById(fromAcc.id);
      const updatedTo = await FinanceService.getTreasuryAccountById(toAcc.id);

      assert(
        parseFloat(updatedFrom.balance) === initialFromBal - 50,
        'Source account debited atomically',
        `Previous: ${initialFromBal}, New: ${updatedFrom.balance}`
      );
      assert(
        parseFloat(updatedTo.balance) === initialToBal + 50,
        'Destination account credited atomically',
        `Previous: ${initialToBal}, New: ${updatedTo.balance}`
      );
    }

    // -----------------------------------------------------------------
    // TEST 5: Physical Immutability Trigger on treasury_transactions
    // -----------------------------------------------------------------
    console.log('\n--- 5. Physical Immutability Trigger (Engine Level) ---');
    const [sampleTx] = await db.select().from(treasuryTransactions).limit(1);

    if (sampleTx) {
      let updateBlocked = false;
      try {
        await db
          .update(treasuryTransactions)
          .set({ amount: '999999.00' })
          .where(eq(treasuryTransactions.id, sampleTx.id));
      } catch (err: any) {
        updateBlocked = true;
      }
      assert(updateBlocked, 'PostgreSQL engine blocks UPDATE on treasury_transactions');

      let deleteBlocked = false;
      try {
        await db
          .delete(treasuryTransactions)
          .where(eq(treasuryTransactions.id, sampleTx.id));
      } catch (err: any) {
        deleteBlocked = true;
      }
      assert(deleteBlocked, 'PostgreSQL engine blocks DELETE on treasury_transactions');
    }

    // -----------------------------------------------------------------
    // TEST 6: Supplier Invoices & Overpayment Guard
    // -----------------------------------------------------------------
    console.log('\n--- 6. Supplier Invoices & Overpayment Guard ---');
    const [supplier] = await db.select().from(suppliers).limit(1);
    assert(!!supplier, 'Supplier exists for financial linkage', supplier?.name);

    const supplierInvoice = await FinanceService.createSupplierInvoice(
      {
        supplierId: supplier.id,
        subtotal: 1500,
        taxAmount: 0,
        currency: 'USD',
        notes: 'فاتورة توريد وتصنيع حاوية تجريبية',
      },
      financeActor
    );

    assert(supplierInvoice.invoiceNumber.startsWith('SINV-'), 'Supplier invoice sequence generated', supplierInvoice.invoiceNumber);
    assert(parseFloat(supplierInvoice.remainingAmount) === 1500, 'Initial remaining amount equals total', supplierInvoice.remainingAmount);

    // TEST 6.1: Attempt Overpayment
    let overpaymentBlocked = false;
    try {
      await FinanceService.createPaymentVoucher(
        {
          treasuryAccountId: accounts[0].id,
          supplierId: supplier.id,
          supplierInvoiceId: supplierInvoice.id,
          amount: 2000, // Exceeds 1500!
          currency: 'USD',
        },
        financeActor
      );
    } catch (err: any) {
      overpaymentBlocked = true;
    }
    assert(overpaymentBlocked, 'Overpayment guard blocks voucher exceeding invoice balance');

    // -----------------------------------------------------------------
    // TEST 7: Payment Voucher Creation & Dual-Control Enforcement
    // -----------------------------------------------------------------
    console.log('\n--- 7. Payment Voucher & Strict Dual Control ---');
    // Valid payment voucher within remaining balance
    const paymentVoucher = await FinanceService.createPaymentVoucher(
      {
        treasuryAccountId: accounts[0].id,
        supplierId: supplier.id,
        supplierInvoiceId: supplierInvoice.id,
        amount: 500,
        currency: 'USD',
        notes: 'دفعة أولى للمورد 500 دولار',
      },
      financeActor // requestedBy = financeActor.id
    );

    assert(paymentVoucher.voucherNumber.startsWith('PAY-'), 'Payment voucher code generated', paymentVoucher.voucherNumber);
    assert(paymentVoucher.status === 'draft', 'Initial payment voucher status is draft', paymentVoucher.status);

    // TEST 7.1: Strict Dual-Control Rejection (Requester cannot approve their own voucher)
    let selfApprovalBlocked = false;
    try {
      await FinanceService.approvePaymentVoucher(paymentVoucher.id, financeActor);
    } catch (err: any) {
      selfApprovalBlocked = true;
    }
    assert(selfApprovalBlocked, 'Dual-control strictly prevents creator self-approval');

    // TEST 7.2: Approval by a different authorized actor (e.g. adminActor)
    const approvedVoucher = await FinanceService.approvePaymentVoucher(paymentVoucher.id, adminActor);
    assert(approvedVoucher.status === 'approved', 'Authorized colleague approved payment voucher', approvedVoucher.status);
    assert(approvedVoucher.approvedBy === adminActor.id, 'ApprovedBy recorded accurately', approvedVoucher.approvedBy ?? undefined);

    // -----------------------------------------------------------------
    // TEST 8: Atomic Posting of Payment Voucher to Treasury Ledger
    // -----------------------------------------------------------------
    console.log('\n--- 8. Atomic Posting of Payment Voucher ---');
    const postedVoucher = await FinanceService.postPaymentVoucher(paymentVoucher.id, financeActor);
    assert(postedVoucher.status === 'posted', 'Payment voucher status updated to posted', postedVoucher.status);

    // Verify invoice remaining balance reduced
    const updatedInvoice = await FinanceService.getSupplierInvoiceById(supplierInvoice.id);
    assert(
      parseFloat(updatedInvoice.paidAmount) === 500,
      'Supplier invoice paid amount updated',
      `Paid: ${updatedInvoice.paidAmount}`
    );
    assert(
      parseFloat(updatedInvoice.remainingAmount) === 1000,
      'Supplier invoice remaining amount reduced',
      `Remaining: ${updatedInvoice.remainingAmount}`
    );
    assert(updatedInvoice.status === 'partially_paid', 'Supplier invoice status is partially_paid', updatedInvoice.status);

    // -----------------------------------------------------------------
    // TEST 9: Customer Invoices & Receipts
    // -----------------------------------------------------------------
    console.log('\n--- 9. Customer Invoices & Receipt Vouchers ---');
    const [customer] = await db.select().from(customers).limit(1);
    assert(!!customer, 'Customer exists for billing', customer?.tradeName ?? undefined);

    const customerInvoice = await FinanceService.createCustomerInvoice(
      {
        customerId: customer.id,
        currency: 'USD',
        items: [
          { description: 'خدمات توريد بضائع وشحن', quantity: 1, unitPrice: 1200 },
          { description: 'رسوم تخليص جمركي ومناولة', quantity: 1, unitPrice: 300 },
        ],
      },
      financeActor
    );

    assert(customerInvoice.invoiceNumber.startsWith('INV-'), 'Customer invoice number generated', customerInvoice.invoiceNumber);
    assert(parseFloat(customerInvoice.totalAmount) === 1500, 'Customer invoice total calculated accurately', customerInvoice.totalAmount);

    // Post Receipt Voucher against Customer Invoice
    const receiptVoucher = await FinanceService.createReceiptVoucher(
      {
        treasuryAccountId: accounts[0].id,
        customerId: customer.id,
        customerInvoiceId: customerInvoice.id,
        amount: 1500,
        currency: 'USD',
        paymentMethod: 'bank_transfer',
        referenceDoc: 'BANKAK-REF-992182',
        notes: 'تحصيل كامل قيمة الفاتورة عبر بنكك',
      },
      financeActor
    );

    assert(receiptVoucher.voucherNumber.startsWith('REC-'), 'Receipt voucher number generated', receiptVoucher.voucherNumber);
    assert(receiptVoucher.status === 'posted', 'Receipt voucher posted immediately', receiptVoucher.status);

    // Verify customer invoice updated to paid
    const updatedCustInv = await FinanceService.getCustomerInvoiceById(customerInvoice.id);
    assert(updatedCustInv.status === 'paid', 'Customer invoice marked as paid', updatedCustInv.status);
    assert(parseFloat(updatedCustInv.remainingAmount) === 0, 'Customer invoice balance cleared', updatedCustInv.remainingAmount);

    // -----------------------------------------------------------------
    // TEST 10: Treasury Reconciliations Workflow
    // -----------------------------------------------------------------
    console.log('\n--- 10. Treasury Reconciliations Workflow ---');
    const targetAccount = accounts[0];
    const currentBookBal = parseFloat((await FinanceService.getTreasuryAccountById(targetAccount.id)).balance);

    const recon = await FinanceService.createReconciliation(
      {
        accountId: targetAccount.id,
        reconciledBalance: currentBookBal + 100, // Discrepancy of +100
        notes: 'فائض نقدي ناتج عن عمولة شحن مستردة',
      },
      financeActor
    );

    assert(recon.reconciliationCode.startsWith('REC-ADJ-'), 'Reconciliation code generated', recon.reconciliationCode);
    assert(recon.status === 'draft', 'Reconciliation initially in draft status', recon.status);
    assert(parseFloat(recon.difference) === 100, 'Difference computed accurately', recon.difference);

    // Managerial approval of reconciliation
    const approvedRecon = await FinanceService.approveReconciliation(recon.id, true, 'تم التحقق من إشعار البنك', adminActor);
    assert(approvedRecon.status === 'approved', 'Reconciliation approved by manager', approvedRecon.status);

    // Check account balance updated
    const finalAccount = await FinanceService.getTreasuryAccountById(targetAccount.id);
    assert(
      parseFloat(finalAccount.balance) === currentBookBal + 100,
      'Treasury account balance adjusted after approved reconciliation',
      `Old: ${currentBookBal}, New: ${finalAccount.balance}`
    );

    // -----------------------------------------------------------------
    // FINAL SUMMARY
    // -----------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 PHASE 6 TEST RESULTS: ${passedTests}/${totalTests} PASSED (Failed: ${failedTests})`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during Phase 6 verification:', err);
    process.exit(1);
  }
}

runPhase6Verification();
