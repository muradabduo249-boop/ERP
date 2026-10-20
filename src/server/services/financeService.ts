import { db } from '../../db/index.ts';
import {
  treasuryAccounts,
  treasuryTransactions,
  treasuryTransfers,
  treasuryReconciliations,
  exchangeRates,
  supplierInvoices,
  customerInvoices,
  customerInvoiceItems,
  paymentVouchers,
  receiptVouchers,
  productCategories,
  products,
  suppliers,
  customers,
  purchaseOrders,
  requests,
  requestTimeline,
} from '../../db/schema.ts';
import { SequenceService } from './sequenceService.ts';
import { AuditService } from './auditService.ts';
import { eq, desc, and, sql } from 'drizzle-orm';

export interface ActorInfo {
  id: string;
  name: string;
  role?: string | null;
}

export class FinanceService {
  // =========================================================================
  // 1. TREASURY ACCOUNTS
  // =========================================================================

  public static async listTreasuryAccounts() {
    return await db
      .select()
      .from(treasuryAccounts)
      .orderBy(treasuryAccounts.accountCode);
  }

  public static async getTreasuryAccountById(id: string) {
    const [account] = await db
      .select()
      .from(treasuryAccounts)
      .where(eq(treasuryAccounts.id, id));

    if (!account) {
      throw new Error('حساب الخزينة غير موجود');
    }

    const transactions = await db
      .select()
      .from(treasuryTransactions)
      .where(eq(treasuryTransactions.accountId, id))
      .orderBy(desc(treasuryTransactions.createdAt))
      .limit(50);

    return {
      ...account,
      recentTransactions: transactions,
    };
  }

  public static async createTreasuryAccount(
    data: {
      name: string;
      type: 'cash' | 'bank';
      currency: string;
      accountNumber?: string;
      bankName?: string;
      initialBalance?: number;
      notes?: string;
    },
    actor: ActorInfo
  ) {
    if (!data.name || !data.currency) {
      throw new Error('اسم الخزينة والعملة حقول إلزامية');
    }

    const accountCode = await SequenceService.getNextCode('TREASURY', 'TR-', 4);
    const initialBalance = Number(data.initialBalance) || 0;

    return await db.transaction(async (tx) => {
      const [newAccount] = await tx
        .insert(treasuryAccounts)
        .values({
          accountCode,
          name: data.name,
          type: data.type || 'bank',
          currency: data.currency.toUpperCase(),
          accountNumber: data.accountNumber || null,
          bankName: data.bankName || null,
          balance: initialBalance.toFixed(2),
          status: 'active',
          notes: data.notes || null,
        })
        .returning();

      // If opening balance > 0, record initial transaction
      if (initialBalance > 0) {
        const txCode = await SequenceService.getNextCode('TX', 'TX-2026-', 6, tx);
        await tx.insert(treasuryTransactions).values({
          transactionCode: txCode,
          accountId: newAccount.id,
          transactionType: 'deposit',
          amount: initialBalance.toFixed(2),
          currency: newAccount.currency,
          exchangeRate: '1.000000',
          amountInTreasuryCurrency: initialBalance.toFixed(2),
          runningBalance: initialBalance.toFixed(2),
          referenceType: 'manual_adjustment',
          referenceId: newAccount.id,
          description: `رصيد افتتاحي لحساب ${newAccount.name}`,
          actorId: actor.id,
        });
      }

      await AuditService.log({
        actorName: actor.name,
        actorRole: actor.role || 'finance',
        entityType: 'treasury_account',
        entityId: newAccount.id,
        action: 'create',
        afterState: { accountCode, name: data.name, currency: data.currency, initialBalance },
        notes: `تم إنشاء حساب خزينة جديد: ${accountCode} - ${data.name}`,
      });

      return newAccount;
    });
  }

  public static async updateTreasuryAccount(
    id: string,
    data: {
      name?: string;
      accountNumber?: string;
      bankName?: string;
      status?: 'active' | 'frozen' | 'closed';
      notes?: string;
    },
    actor: ActorInfo
  ) {
    const [existing] = await db
      .select()
      .from(treasuryAccounts)
      .where(eq(treasuryAccounts.id, id));

    if (!existing) {
      throw new Error('حساب الخزينة غير موجود');
    }

    const [updated] = await db
      .update(treasuryAccounts)
      .set({
        name: data.name ?? existing.name,
        accountNumber: data.accountNumber ?? existing.accountNumber,
        bankName: data.bankName ?? existing.bankName,
        status: data.status ?? existing.status,
        notes: data.notes ?? existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(treasuryAccounts.id, id))
      .returning();

    await AuditService.log({
      actorName: actor.name,
      actorRole: actor.role || 'finance',
      entityType: 'treasury_account',
      entityId: id,
      action: 'update',
      afterState: data,
      notes: `تم تحديث بيانات حساب الخزينة ${existing.accountCode}`,
    });

    return updated;
  }

  // =========================================================================
  // 2. TREASURY TRANSACTIONS (LEDGER)
  // =========================================================================

  public static async listTreasuryTransactions(filters?: {
    accountId?: string;
    transactionType?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = db
      .select({
        id: treasuryTransactions.id,
        transactionCode: treasuryTransactions.transactionCode,
        accountId: treasuryTransactions.accountId,
        accountName: treasuryAccounts.name,
        accountCurrency: treasuryAccounts.currency,
        transactionType: treasuryTransactions.transactionType,
        amount: treasuryTransactions.amount,
        currency: treasuryTransactions.currency,
        exchangeRate: treasuryTransactions.exchangeRate,
        amountInTreasuryCurrency: treasuryTransactions.amountInTreasuryCurrency,
        runningBalance: treasuryTransactions.runningBalance,
        referenceType: treasuryTransactions.referenceType,
        referenceId: treasuryTransactions.referenceId,
        description: treasuryTransactions.description,
        actorId: treasuryTransactions.actorId,
        createdAt: treasuryTransactions.createdAt,
      })
      .from(treasuryTransactions)
      .leftJoin(treasuryAccounts, eq(treasuryTransactions.accountId, treasuryAccounts.id))
      .orderBy(desc(treasuryTransactions.createdAt))
      .$dynamic();

    if (filters?.accountId) {
      query = query.where(eq(treasuryTransactions.accountId, filters.accountId));
    }

    if (filters?.transactionType) {
      query = query.where(eq(treasuryTransactions.transactionType, filters.transactionType));
    }

    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    return await query.limit(limit).offset(offset);
  }

  // =========================================================================
  // 3. ATOMIC TREASURY TRANSFERS (تحويلات بين الخزائن)
  // =========================================================================

  public static async transferFunds(
    data: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      exchangeRate?: number;
      notes?: string;
    },
    actor: ActorInfo
  ) {
    if (data.fromAccountId === data.toAccountId) {
      throw new Error('لا يمكن إجراء تحويل بين نفس الحساب');
    }

    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
      throw new Error('المبلغ المحول يجب أن يكون قيمة موجبة أكبر من صفر');
    }

    const exchangeRate = Number(data.exchangeRate) || 1.0;
    if (exchangeRate <= 0) {
      throw new Error('سعر الصرف يجب أن يكون قيمة موجبة أكبر من صفر');
    }

    return await db.transaction(async (tx) => {
      // 1. Lock source account
      const [fromAccount] = await tx
        .select()
        .from(treasuryAccounts)
        .where(eq(treasuryAccounts.id, data.fromAccountId))
        .for('update');

      if (!fromAccount) {
        throw new Error('حساب الخزينة المصدر غير موجود');
      }
      if (fromAccount.status !== 'active') {
        throw new Error(`حساب الخزينة المصدر (${fromAccount.name}) غير نشط حاليًا`);
      }

      const sourceBalance = Number(fromAccount.balance);
      if (sourceBalance < amount) {
        throw new Error(
          `رصيد الحساب المصدر غير كافٍ. الرصيد الحالي: ${sourceBalance.toFixed(2)} ${fromAccount.currency}، المبلغ المطلوب: ${amount.toFixed(2)}`
        );
      }

      // 2. Lock destination account
      const [toAccount] = await tx
        .select()
        .from(treasuryAccounts)
        .where(eq(treasuryAccounts.id, data.toAccountId))
        .for('update');

      if (!toAccount) {
        throw new Error('حساب الخزينة المستلم غير موجود');
      }
      if (toAccount.status !== 'active') {
        throw new Error(`حساب الخزينة المستلم (${toAccount.name}) غير نشط حاليًا`);
      }

      // Converted amount calculation
      const convertedAmount = Number((amount * exchangeRate).toFixed(2));
      const newSourceBalance = Number((sourceBalance - amount).toFixed(2));
      const newDestBalance = Number((Number(toAccount.balance) + convertedAmount).toFixed(2));

      // 3. Update balances
      await tx
        .update(treasuryAccounts)
        .set({ balance: newSourceBalance.toFixed(2), updatedAt: new Date() })
        .where(eq(treasuryAccounts.id, fromAccount.id));

      await tx
        .update(treasuryAccounts)
        .set({ balance: newDestBalance.toFixed(2), updatedAt: new Date() })
        .where(eq(treasuryAccounts.id, toAccount.id));

      // 4. Generate transfer record
      const transferCode = await SequenceService.getNextCode('TRF', 'TRF-2026-', 4, tx);
      const [transfer] = await tx
        .insert(treasuryTransfers)
        .values({
          transferCode,
          fromAccountId: fromAccount.id,
          toAccountId: toAccount.id,
          amount: amount.toFixed(2),
          exchangeRate: exchangeRate.toFixed(6),
          convertedAmount: convertedAmount.toFixed(2),
          notes: data.notes || null,
          actorId: actor.id,
        })
        .returning();

      // 5. Insert ledger entry for source (Transfer Out)
      const txCodeOut = await SequenceService.getNextCode('TX', 'TX-2026-', 6, tx);
      await tx.insert(treasuryTransactions).values({
        transactionCode: txCodeOut,
        accountId: fromAccount.id,
        transactionType: 'transfer_out',
        amount: amount.toFixed(2),
        currency: fromAccount.currency,
        exchangeRate: '1.000000',
        amountInTreasuryCurrency: amount.toFixed(2),
        runningBalance: newSourceBalance.toFixed(2),
        referenceType: 'treasury_transfer',
        referenceId: transfer.id,
        description: `تحويل صادر إلى ${toAccount.name} (${transferCode})`,
        actorId: actor.id,
      });

      // 6. Insert ledger entry for destination (Transfer In)
      const txCodeIn = await SequenceService.getNextCode('TX', 'TX-2026-', 6, tx);
      await tx.insert(treasuryTransactions).values({
        transactionCode: txCodeIn,
        accountId: toAccount.id,
        transactionType: 'transfer_in',
        amount: convertedAmount.toFixed(2),
        currency: toAccount.currency,
        exchangeRate: exchangeRate.toFixed(6),
        amountInTreasuryCurrency: convertedAmount.toFixed(2),
        runningBalance: newDestBalance.toFixed(2),
        referenceType: 'treasury_transfer',
        referenceId: transfer.id,
        description: `تحويل وارد من ${fromAccount.name} (${transferCode})`,
        actorId: actor.id,
      });

      // 7. Audit log
      await AuditService.log({
        actorName: actor.name,
        actorRole: actor.role || 'finance',
        entityType: 'treasury_transfer',
        entityId: transfer.id,
        action: 'transfer',
        afterState: { transferCode, from: fromAccount.accountCode, to: toAccount.accountCode, amount, convertedAmount },
        notes: `تحويل خزينة ذري ${transferCode}: خصم ${amount} ${fromAccount.currency} وإيداع ${convertedAmount} ${toAccount.currency}`,
      });

      return transfer;
    });
  }

  // =========================================================================
  // 4. TREASURY RECONCILIATIONS (مطابقات وتسويات الأرصدة)
  // =========================================================================

  public static async listReconciliations(accountId?: string) {
    let query = db
      .select({
        id: treasuryReconciliations.id,
        reconciliationCode: treasuryReconciliations.reconciliationCode,
        accountId: treasuryReconciliations.accountId,
        accountName: treasuryAccounts.name,
        currency: treasuryAccounts.currency,
        bookBalance: treasuryReconciliations.bookBalance,
        reconciledBalance: treasuryReconciliations.reconciledBalance,
        difference: treasuryReconciliations.difference,
        status: treasuryReconciliations.status,
        notes: treasuryReconciliations.notes,
        requestedBy: treasuryReconciliations.requestedBy,
        approvedBy: treasuryReconciliations.approvedBy,
        approvedAt: treasuryReconciliations.approvedAt,
        createdAt: treasuryReconciliations.createdAt,
      })
      .from(treasuryReconciliations)
      .leftJoin(treasuryAccounts, eq(treasuryReconciliations.accountId, treasuryAccounts.id))
      .orderBy(desc(treasuryReconciliations.createdAt))
      .$dynamic();

    if (accountId) {
      query = query.where(eq(treasuryReconciliations.accountId, accountId));
    }

    return await query;
  }

  public static async createReconciliation(
    data: {
      accountId: string;
      reconciledBalance: number;
      notes?: string;
    },
    actor: ActorInfo
  ) {
    const [account] = await db
      .select()
      .from(treasuryAccounts)
      .where(eq(treasuryAccounts.id, data.accountId));

    if (!account) {
      throw new Error('حساب الخزينة غير موجود');
    }

    const bookBalance = Number(account.balance);
    const reconciledBalance = Number(data.reconciledBalance);
    const difference = Number((reconciledBalance - bookBalance).toFixed(2));

    const reconciliationCode = await SequenceService.getNextCode('RECON', 'REC-ADJ-', 4);

    const [reconciliation] = await db
      .insert(treasuryReconciliations)
      .values({
        reconciliationCode,
        accountId: account.id,
        bookBalance: bookBalance.toFixed(2),
        reconciledBalance: reconciledBalance.toFixed(2),
        difference: difference.toFixed(2),
        status: 'draft',
        notes: data.notes || null,
        requestedBy: actor.id,
      })
      .returning();

    await AuditService.log({
      actorName: actor.name,
      actorRole: actor.role || 'finance',
      entityType: 'treasury_reconciliation',
      entityId: reconciliation.id,
      action: 'create',
      afterState: { reconciliationCode, bookBalance, reconciledBalance, difference },
      notes: `تسجيل طلب تسوية خزينة ${reconciliationCode} بفارق مالي: ${difference} ${account.currency}`,
    });

    return reconciliation;
  }

  public static async approveReconciliation(
    id: string,
    approved: boolean,
    notes: string | undefined,
    actor: ActorInfo
  ) {
    return await db.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(treasuryReconciliations)
        .where(eq(treasuryReconciliations.id, id))
        .for('update');

      if (!recon) {
        throw new Error('سجل التسوية غير موجود');
      }

      if (recon.status !== 'draft') {
        throw new Error(`لا يمكن تعديل تسوية حالتها الحالية: ${recon.status}`);
      }

      if (!approved) {
        const [rejected] = await tx
          .update(treasuryReconciliations)
          .set({
            status: 'rejected',
            approvedBy: actor.id,
            approvedAt: new Date(),
            notes: notes ? `${recon.notes || ''} | سبب الرفض: ${notes}` : recon.notes,
          })
          .where(eq(treasuryReconciliations.id, id))
          .returning();

        await AuditService.log({
          actorName: actor.name,
          actorRole: actor.role || 'manager',
          entityType: 'treasury_reconciliation',
          entityId: id,
          action: 'reject',
          notes: `رفض تسوية الخزينة ${recon.reconciliationCode}`,
        });

        return rejected;
      }

      // If approved, update account balance & post adjustment transaction
      const [account] = await tx
        .select()
        .from(treasuryAccounts)
        .where(eq(treasuryAccounts.id, recon.accountId))
        .for('update');

      const difference = Number(recon.difference);
      const targetBalance = Number(recon.reconciledBalance);

      await tx
        .update(treasuryAccounts)
        .set({
          balance: targetBalance.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(treasuryAccounts.id, account.id));

      // Ledger adjustment
      const txCode = await SequenceService.getNextCode('TX', 'TX-2026-', 6, tx);
      await tx.insert(treasuryTransactions).values({
        transactionCode: txCode,
        accountId: account.id,
        transactionType: 'adjustment',
        amount: Math.abs(difference).toFixed(2),
        currency: account.currency,
        exchangeRate: '1.000000',
        amountInTreasuryCurrency: Math.abs(difference).toFixed(2),
        runningBalance: targetBalance.toFixed(2),
        referenceType: 'reconciliation_adjustment',
        referenceId: recon.id,
        description: `تسوية مطابقة رصيد معتمدة (${recon.reconciliationCode}): ${difference >= 0 ? '+' : ''}${difference} ${account.currency}`,
        actorId: actor.id,
      });

      const [updatedRecon] = await tx
        .update(treasuryReconciliations)
        .set({
          status: 'approved',
          approvedBy: actor.id,
          approvedAt: new Date(),
          notes: notes ? `${recon.notes || ''} | ملاحظات الاعتماد: ${notes}` : recon.notes,
        })
        .where(eq(treasuryReconciliations.id, id))
        .returning();

      await AuditService.log({
        actorName: actor.name,
        actorRole: actor.role || 'manager',
        entityType: 'treasury_reconciliation',
        entityId: id,
        action: 'approve',
        afterState: { difference, newBalance: targetBalance },
        notes: `اعتماد تسوية الخزينة ${recon.reconciliationCode} وتحديث الرصيد الفعلي إلى ${targetBalance} ${account.currency}`,
      });

      return updatedRecon;
    });
  }

  // =========================================================================
  // 5. SUPPLIER INVOICES (فواتير الموردين ومصانع الصين)
  // =========================================================================

  public static async listSupplierInvoices(filters?: {
    supplierId?: string;
    purchaseOrderId?: string;
    status?: string;
  }) {
    let query = db
      .select({
        id: supplierInvoices.id,
        invoiceNumber: supplierInvoices.invoiceNumber,
        supplierId: supplierInvoices.supplierId,
        supplierName: suppliers.name,
        supplierNameEn: suppliers.tradeNameEn,
        purchaseOrderId: supplierInvoices.purchaseOrderId,
        poCode: purchaseOrders.poCode,
        requestId: supplierInvoices.requestId,
        issueDate: supplierInvoices.issueDate,
        dueDate: supplierInvoices.dueDate,
        currency: supplierInvoices.currency,
        subtotal: supplierInvoices.subtotal,
        taxAmount: supplierInvoices.taxAmount,
        totalAmount: supplierInvoices.totalAmount,
        paidAmount: supplierInvoices.paidAmount,
        remainingAmount: supplierInvoices.remainingAmount,
        status: supplierInvoices.status,
        notes: supplierInvoices.notes,
        createdAt: supplierInvoices.createdAt,
      })
      .from(supplierInvoices)
      .leftJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
      .leftJoin(purchaseOrders, eq(supplierInvoices.purchaseOrderId, purchaseOrders.id))
      .orderBy(desc(supplierInvoices.createdAt))
      .$dynamic();

    if (filters?.supplierId) {
      query = query.where(eq(supplierInvoices.supplierId, filters.supplierId));
    }
    if (filters?.purchaseOrderId) {
      query = query.where(eq(supplierInvoices.purchaseOrderId, filters.purchaseOrderId));
    }
    if (filters?.status) {
      query = query.where(eq(supplierInvoices.status, filters.status));
    }

    return await query;
  }

  public static async getSupplierInvoiceById(id: string) {
    const [invoice] = await db
      .select({
        id: supplierInvoices.id,
        invoiceNumber: supplierInvoices.invoiceNumber,
        supplierId: supplierInvoices.supplierId,
        supplierName: suppliers.name,
        supplierNameEn: suppliers.tradeNameEn,
        purchaseOrderId: supplierInvoices.purchaseOrderId,
        poCode: purchaseOrders.poCode,
        requestId: supplierInvoices.requestId,
        issueDate: supplierInvoices.issueDate,
        dueDate: supplierInvoices.dueDate,
        currency: supplierInvoices.currency,
        subtotal: supplierInvoices.subtotal,
        taxAmount: supplierInvoices.taxAmount,
        totalAmount: supplierInvoices.totalAmount,
        paidAmount: supplierInvoices.paidAmount,
        remainingAmount: supplierInvoices.remainingAmount,
        status: supplierInvoices.status,
        notes: supplierInvoices.notes,
        createdAt: supplierInvoices.createdAt,
      })
      .from(supplierInvoices)
      .leftJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
      .leftJoin(purchaseOrders, eq(supplierInvoices.purchaseOrderId, purchaseOrders.id))
      .where(eq(supplierInvoices.id, id));

    if (!invoice) {
      throw new Error('فاتورة المورد غير موجودة');
    }

    // Linked payment vouchers
    const vouchers = await db
      .select()
      .from(paymentVouchers)
      .where(eq(paymentVouchers.supplierInvoiceId, id))
      .orderBy(desc(paymentVouchers.createdAt));

    return {
      ...invoice,
      paymentVouchers: vouchers,
    };
  }

  public static async createSupplierInvoice(
    data: {
      supplierId: string;
      purchaseOrderId?: string;
      requestId?: string;
      invoiceNumber?: string;
      issueDate?: string;
      dueDate?: string;
      currency?: string;
      subtotal: number;
      taxAmount?: number;
      totalAmount?: number;
      notes?: string;
    },
    actor: ActorInfo
  ) {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, data.supplierId));

    if (!supplier) {
      throw new Error('المورد المحدد غير موجود');
    }

    const subtotal = Number(data.subtotal);
    if (!subtotal || subtotal <= 0) {
      throw new Error('المبلغ الإجمالي للفاتورة يجب أن يكون أكبر من صفر');
    }

    const taxAmount = Number(data.taxAmount) || 0;
    const totalAmount = data.totalAmount ? Number(data.totalAmount) : subtotal + taxAmount;
    const currency = data.currency || supplier.defaultCurrency || 'USD';

    const invoiceNumber = data.invoiceNumber || (await SequenceService.getNextCode('SINV', 'SINV-2026-', 4));

    const [invoice] = await db
      .insert(supplierInvoices)
      .values({
        invoiceNumber,
        supplierId: supplier.id,
        purchaseOrderId: data.purchaseOrderId || null,
        requestId: data.requestId || null,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        currency,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        paidAmount: '0.00',
        remainingAmount: totalAmount.toFixed(2),
        status: 'approved',
        notes: data.notes || null,
        createdBy: actor.id,
      })
      .returning();

    await AuditService.log({
      actorName: actor.name,
      actorRole: actor.role || 'finance',
      entityType: 'supplier_invoice',
      entityId: invoice.id,
      action: 'create',
      afterState: { invoiceNumber, supplierId: supplier.id, totalAmount, currency },
      notes: `تسجيل فاتورة مورد معتمدة: ${invoiceNumber} بمبلغ ${totalAmount} ${currency}`,
    });

    return invoice;
  }

  // =========================================================================
  // 6. PAYMENT VOUCHERS (سندات الصرف مع الرقابة الثنائية الصارمة)
  // =========================================================================

  public static async listPaymentVouchers(filters?: {
    status?: string;
    supplierId?: string;
    treasuryAccountId?: string;
  }) {
    let query = db
      .select({
        id: paymentVouchers.id,
        voucherNumber: paymentVouchers.voucherNumber,
        treasuryAccountId: paymentVouchers.treasuryAccountId,
        treasuryName: treasuryAccounts.name,
        treasuryCurrency: treasuryAccounts.currency,
        supplierId: paymentVouchers.supplierId,
        supplierName: suppliers.name,
        supplierNameEn: suppliers.tradeNameEn,
        supplierInvoiceId: paymentVouchers.supplierInvoiceId,
        invoiceNumber: supplierInvoices.invoiceNumber,
        amount: paymentVouchers.amount,
        currency: paymentVouchers.currency,
        exchangeRate: paymentVouchers.exchangeRate,
        amountInTreasuryCurrency: paymentVouchers.amountInTreasuryCurrency,
        paymentMethod: paymentVouchers.paymentMethod,
        referenceDoc: paymentVouchers.referenceDoc,
        status: paymentVouchers.status,
        requestedBy: paymentVouchers.requestedBy,
        approvedBy: paymentVouchers.approvedBy,
        approvedAt: paymentVouchers.approvedAt,
        postedBy: paymentVouchers.postedBy,
        postedAt: paymentVouchers.postedAt,
        notes: paymentVouchers.notes,
        createdAt: paymentVouchers.createdAt,
      })
      .from(paymentVouchers)
      .leftJoin(treasuryAccounts, eq(paymentVouchers.treasuryAccountId, treasuryAccounts.id))
      .leftJoin(suppliers, eq(paymentVouchers.supplierId, suppliers.id))
      .leftJoin(supplierInvoices, eq(paymentVouchers.supplierInvoiceId, supplierInvoices.id))
      .orderBy(desc(paymentVouchers.createdAt))
      .$dynamic();

    if (filters?.status) {
      query = query.where(eq(paymentVouchers.status, filters.status));
    }
    if (filters?.supplierId) {
      query = query.where(eq(paymentVouchers.supplierId, filters.supplierId));
    }
    if (filters?.treasuryAccountId) {
      query = query.where(eq(paymentVouchers.treasuryAccountId, filters.treasuryAccountId));
    }

    return await query;
  }

  public static async getPaymentVoucherById(id: string) {
    const [voucher] = await db
      .select({
        id: paymentVouchers.id,
        voucherNumber: paymentVouchers.voucherNumber,
        treasuryAccountId: paymentVouchers.treasuryAccountId,
        treasuryName: treasuryAccounts.name,
        treasuryCurrency: treasuryAccounts.currency,
        supplierId: paymentVouchers.supplierId,
        supplierName: suppliers.name,
        supplierInvoiceId: paymentVouchers.supplierInvoiceId,
        invoiceNumber: supplierInvoices.invoiceNumber,
        amount: paymentVouchers.amount,
        currency: paymentVouchers.currency,
        exchangeRate: paymentVouchers.exchangeRate,
        amountInTreasuryCurrency: paymentVouchers.amountInTreasuryCurrency,
        paymentMethod: paymentVouchers.paymentMethod,
        referenceDoc: paymentVouchers.referenceDoc,
        status: paymentVouchers.status,
        requestedBy: paymentVouchers.requestedBy,
        approvedBy: paymentVouchers.approvedBy,
        approvedAt: paymentVouchers.approvedAt,
        postedBy: paymentVouchers.postedBy,
        postedAt: paymentVouchers.postedAt,
        notes: paymentVouchers.notes,
        createdAt: paymentVouchers.createdAt,
      })
      .from(paymentVouchers)
      .leftJoin(treasuryAccounts, eq(paymentVouchers.treasuryAccountId, treasuryAccounts.id))
      .leftJoin(suppliers, eq(paymentVouchers.supplierId, suppliers.id))
      .leftJoin(supplierInvoices, eq(paymentVouchers.supplierInvoiceId, supplierInvoices.id))
      .where(eq(paymentVouchers.id, id));

    if (!voucher) {
      throw new Error('سند الصرف غير موجود');
    }

    return voucher;
  }

  public static async createPaymentVoucher(
    data: {
      treasuryAccountId: string;
      supplierId: string;
      supplierInvoiceId?: string;
      amount: number;
      currency: string;
      exchangeRate?: number;
      paymentMethod?: 'cash' | 'bank_transfer' | 'cheque';
      referenceDoc?: string;
      notes?: string;
    },
    actor: ActorInfo
  ) {
    const [treasury] = await db
      .select()
      .from(treasuryAccounts)
      .where(eq(treasuryAccounts.id, data.treasuryAccountId));

    if (!treasury) {
      throw new Error('حساب الخزينة المحدد غير موجود');
    }
    if (treasury.status !== 'active') {
      throw new Error(`حساب الخزينة (${treasury.name}) ليس نشطاً`);
    }

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, data.supplierId));

    if (!supplier) {
      throw new Error('المورد المحدد غير موجود');
    }

    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
      throw new Error('مبلغ سند الصرف يجب أن يكون قيمة موجبة أكبر من صفر');
    }

    // Overpayment prevention against supplier invoice
    if (data.supplierInvoiceId) {
      const [invoice] = await db
        .select()
        .from(supplierInvoices)
        .where(eq(supplierInvoices.id, data.supplierInvoiceId));

      if (!invoice) {
        throw new Error('فاتورة المورد المرتبطة غير موجودة');
      }

      if (invoice.status === 'paid' || invoice.status === 'cancelled') {
        throw new Error(`لا يمكن إصدار سند صرف لفاتورة حالتها: ${invoice.status}`);
      }

      const remaining = Number(invoice.remainingAmount);
      if (amount > remaining) {
        throw new Error(
          `منع الصرف الزائد (Overpayment Guard): المبلغ المطلوب (${amount} ${data.currency}) يتجاوز المتبقي من الفاتورة (${remaining} ${invoice.currency})`
        );
      }
    }

    const exchangeRate = Number(data.exchangeRate) || 1.0;
    const amountInTreasury = Number((amount * exchangeRate).toFixed(2));

    const voucherNumber = await SequenceService.getNextCode('PAYMENT', 'PAY-2026-', 4);

    const [voucher] = await db
      .insert(paymentVouchers)
      .values({
        voucherNumber,
        treasuryAccountId: treasury.id,
        supplierId: supplier.id,
        supplierInvoiceId: data.supplierInvoiceId || null,
        amount: amount.toFixed(2),
        currency: data.currency.toUpperCase(),
        exchangeRate: exchangeRate.toFixed(6),
        amountInTreasuryCurrency: amountInTreasury.toFixed(2),
        paymentMethod: data.paymentMethod || 'bank_transfer',
        referenceDoc: data.referenceDoc || null,
        status: 'draft',
        requestedBy: actor.id,
        notes: data.notes || null,
      })
      .returning();

    await AuditService.log({
      actorName: actor.name,
      actorRole: actor.role || 'finance',
      entityType: 'payment_voucher',
      entityId: voucher.id,
      action: 'create',
      afterState: { voucherNumber, amount, currency: data.currency, supplierId: supplier.id },
      notes: `إنشاء مسودة سند صرف ${voucherNumber} بمبلغ ${amount} ${data.currency} بانتظار الاعتماد بالرقابة الثنائية`,
    });

    return voucher;
  }

  /**
   * STRICT DUAL-CONTROL: Approver CANNOT be the requester, even for super_admin!
   */
  public static async approvePaymentVoucher(id: string, actor: ActorInfo) {
    const [voucher] = await db
      .select()
      .from(paymentVouchers)
      .where(eq(paymentVouchers.id, id));

    if (!voucher) {
      throw new Error('سند الصرف غير موجود');
    }

    if (voucher.status !== 'draft') {
      throw new Error(`لا يمكن اعتماد سند صرف حالته الحالية: ${voucher.status}`);
    }

    // MANDATORY DUAL-CONTROL ENFORCEMENT
    if (voucher.requestedBy === actor.id) {
      throw new Error(
        'مخالفة مبدأ الرقابة الثنائية (Dual Control): لا يجوز لمُنشئ سند الصرف اعتماده بنفسه إطلاقاً، حتى لو كان مديراً عاماً (super_admin).'
      );
    }

    const [approved] = await db
      .update(paymentVouchers)
      .set({
        status: 'approved',
        approvedBy: actor.id,
        approvedAt: new Date(),
      })
      .where(eq(paymentVouchers.id, id))
      .returning();

    await AuditService.log({
      actorName: actor.name,
      actorRole: actor.role || 'manager',
      entityType: 'payment_voucher',
      entityId: id,
      action: 'approve',
      afterState: { voucherNumber: voucher.voucherNumber, approvedBy: actor.id },
      notes: `اعتماد سند الصرف ${voucher.voucherNumber} بنجاح وفق ضوابط الرقابة الثنائية`,
    });

    return approved;
  }

  /**
   * POST PAYMENT VOUCHER TO TREASURY LEDGER
   * Atomically debits treasury account, adds protected transaction record,
   * and updates supplier invoice paid & remaining amounts with concurrency locks.
   */
  public static async postPaymentVoucher(id: string, actor: ActorInfo) {
    return await db.transaction(async (tx) => {
      // 1. Lock voucher
      const [voucher] = await tx
        .select()
        .from(paymentVouchers)
        .where(eq(paymentVouchers.id, id))
        .for('update');

      if (!voucher) {
        throw new Error('سند الصرف غير موجود');
      }

      if (voucher.status !== 'approved') {
        throw new Error(`يلزم اعتماد سند الصرف أولاً قبل ترحيله. الحالة الحالية: ${voucher.status}`);
      }

      // 2. Lock treasury account
      const [treasury] = await tx
        .select()
        .from(treasuryAccounts)
        .where(eq(treasuryAccounts.id, voucher.treasuryAccountId))
        .for('update');

      if (!treasury) {
        throw new Error('حساب الخزينة غير موجود');
      }
      if (treasury.status !== 'active') {
        throw new Error(`حساب الخزينة (${treasury.name}) غير نشط حالياً`);
      }

      const amountToDeduct = Number(voucher.amountInTreasuryCurrency);
      const currentTreasuryBal = Number(treasury.balance);

      if (currentTreasuryBal < amountToDeduct) {
        throw new Error(
          `رصيد الخزينة غير كافٍ للصرف. الرصيد المتاح: ${currentTreasuryBal.toFixed(2)} ${treasury.currency}، المطلوب خصمه: ${amountToDeduct.toFixed(2)}`
        );
      }

      // 3. If linked to supplier invoice, lock and update invoice
      if (voucher.supplierInvoiceId) {
        const [invoice] = await tx
          .select()
          .from(supplierInvoices)
          .where(eq(supplierInvoices.id, voucher.supplierInvoiceId))
          .for('update');

        if (invoice) {
          const voucherAmount = Number(voucher.amount);
          const currentRemaining = Number(invoice.remainingAmount);

          if (voucherAmount > currentRemaining) {
            throw new Error(
              `تجاوز المبلغ المتبقي للفاتورة أثناء الترحيل. المتبقي: ${currentRemaining}، مبلغ السند: ${voucherAmount}`
            );
          }

          const newPaid = Number((Number(invoice.paidAmount) + voucherAmount).toFixed(2));
          const newRemaining = Number((currentRemaining - voucherAmount).toFixed(2));
          const newStatus = newRemaining <= 0 ? 'paid' : 'partially_paid';

          await tx
            .update(supplierInvoices)
            .set({
              paidAmount: newPaid.toFixed(2),
              remainingAmount: newRemaining.toFixed(2),
              status: newStatus,
              updatedAt: new Date(),
            })
            .where(eq(supplierInvoices.id, invoice.id));
        }
      }

      // 4. Update treasury balance
      const newTreasuryBalance = Number((currentTreasuryBal - amountToDeduct).toFixed(2));
      await tx
        .update(treasuryAccounts)
        .set({
          balance: newTreasuryBalance.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(treasuryAccounts.id, treasury.id));

      // 5. Insert protected transaction record
      const txCode = await SequenceService.getNextCode('TX', 'TX-2026-', 6, tx);
      await tx.insert(treasuryTransactions).values({
        transactionCode: txCode,
        accountId: treasury.id,
        transactionType: 'payment',
        amount: voucher.amount,
        currency: voucher.currency,
        exchangeRate: voucher.exchangeRate,
        amountInTreasuryCurrency: voucher.amountInTreasuryCurrency,
        runningBalance: newTreasuryBalance.toFixed(2),
        referenceType: 'payment_voucher',
        referenceId: voucher.id,
        description: `صرف سند مالي ${voucher.voucherNumber} للمورد (${voucher.referenceDoc || 'مشتريات'})`,
        actorId: actor.id,
      });

      // 6. Update voucher status to posted
      const [postedVoucher] = await tx
        .update(paymentVouchers)
        .set({
          status: 'posted',
          postedBy: actor.id,
          postedAt: new Date(),
        })
        .where(eq(paymentVouchers.id, voucher.id))
        .returning();

      // 7. Audit log
      await AuditService.log({
        actorName: actor.name,
        actorRole: actor.role || 'finance',
        entityType: 'payment_voucher',
        entityId: voucher.id,
        action: 'post',
        afterState: { voucherNumber: voucher.voucherNumber, amountDeducted: amountToDeduct, newTreasuryBalance },
        notes: `ترحيل سند الصرف ${voucher.voucherNumber} وخصم ${amountToDeduct} ${treasury.currency} من الخزينة ${treasury.accountCode}`,
      });

      return postedVoucher;
    });
  }

  // =========================================================================
  // 7. CUSTOMER INVOICES (فواتير العملاء والإيرادات)
  // =========================================================================

  public static async listCustomerInvoices(filters?: {
    customerId?: string;
    requestId?: string;
    status?: string;
  }) {
    let query = db
      .select({
        id: customerInvoices.id,
        invoiceNumber: customerInvoices.invoiceNumber,
        customerId: customerInvoices.customerId,
        customerName: customers.tradeName,
        customerCompany: customers.companyName,
        requestId: customerInvoices.requestId,
        requestTitle: requests.title,
        issueDate: customerInvoices.issueDate,
        dueDate: customerInvoices.dueDate,
        currency: customerInvoices.currency,
        subtotal: customerInvoices.subtotal,
        taxAmount: customerInvoices.taxAmount,
        totalAmount: customerInvoices.totalAmount,
        paidAmount: customerInvoices.paidAmount,
        remainingAmount: customerInvoices.remainingAmount,
        status: customerInvoices.status,
        paymentTerms: customerInvoices.paymentTerms,
        notes: customerInvoices.notes,
        createdAt: customerInvoices.createdAt,
      })
      .from(customerInvoices)
      .leftJoin(customers, eq(customerInvoices.customerId, customers.id))
      .leftJoin(requests, eq(customerInvoices.requestId, requests.id))
      .orderBy(desc(customerInvoices.createdAt))
      .$dynamic();

    if (filters?.customerId) {
      query = query.where(eq(customerInvoices.customerId, filters.customerId));
    }
    if (filters?.requestId) {
      query = query.where(eq(customerInvoices.requestId, filters.requestId));
    }
    if (filters?.status) {
      query = query.where(eq(customerInvoices.status, filters.status));
    }

    return await query;
  }

  public static async getCustomerInvoiceById(id: string) {
    const [invoice] = await db
      .select({
        id: customerInvoices.id,
        invoiceNumber: customerInvoices.invoiceNumber,
        customerId: customerInvoices.customerId,
        customerName: customers.tradeName,
        customerCompany: customers.companyName,
        requestId: customerInvoices.requestId,
        requestTitle: requests.title,
        issueDate: customerInvoices.issueDate,
        dueDate: customerInvoices.dueDate,
        currency: customerInvoices.currency,
        subtotal: customerInvoices.subtotal,
        taxAmount: customerInvoices.taxAmount,
        totalAmount: customerInvoices.totalAmount,
        paidAmount: customerInvoices.paidAmount,
        remainingAmount: customerInvoices.remainingAmount,
        status: customerInvoices.status,
        paymentTerms: customerInvoices.paymentTerms,
        notes: customerInvoices.notes,
        createdAt: customerInvoices.createdAt,
      })
      .from(customerInvoices)
      .leftJoin(customers, eq(customerInvoices.customerId, customers.id))
      .leftJoin(requests, eq(customerInvoices.requestId, requests.id))
      .where(eq(customerInvoices.id, id));

    if (!invoice) {
      throw new Error('فاتورة العميل غير موجودة');
    }

    const items = await db
      .select()
      .from(customerInvoiceItems)
      .where(eq(customerInvoiceItems.invoiceId, id));

    const receipts = await db
      .select()
      .from(receiptVouchers)
      .where(eq(receiptVouchers.customerInvoiceId, id))
      .orderBy(desc(receiptVouchers.createdAt));

    return {
      ...invoice,
      items,
      receipts,
    };
  }

  public static async createCustomerInvoice(
    data: {
      customerId: string;
      requestId?: string;
      issueDate?: string;
      dueDate?: string;
      currency?: string;
      taxAmount?: number;
      paymentTerms?: string;
      notes?: string;
      items: Array<{
        description: string;
        productId?: string;
        quantity: number;
        unitPrice: number;
      }>;
    },
    actor: ActorInfo
  ) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, data.customerId));

    if (!customer) {
      throw new Error('العميل المحدد غير موجود');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('يجب تضمين بند واحد على الأقل في الفاتورة');
    }

    let subtotal = 0;
    const processedItems = data.items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const total = Number((qty * price).toFixed(2));
      subtotal += total;
      return {
        description: item.description,
        productId: item.productId || null,
        quantity: qty.toFixed(2),
        unitPrice: price.toFixed(2),
        totalPrice: total.toFixed(2),
      };
    });

    const taxAmount = Number(data.taxAmount) || 0;
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));
    const currency = data.currency || customer.currency || 'USD';

    const invoiceNumber = await SequenceService.getNextCode('INVOICE', 'INV-2026-', 4);

    return await db.transaction(async (tx) => {
      const [invoice] = await tx
        .insert(customerInvoices)
        .values({
          invoiceNumber,
          customerId: customer.id,
          requestId: data.requestId || null,
          issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          currency,
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          paidAmount: '0.00',
          remainingAmount: totalAmount.toFixed(2),
          status: 'issued',
          paymentTerms: data.paymentTerms || null,
          notes: data.notes || null,
          createdBy: actor.id,
        })
        .returning();

      for (const item of processedItems) {
        await tx.insert(customerInvoiceItems).values({
          invoiceId: invoice.id,
          ...item,
        });
      }

      // If linked to central request, record in timeline
      if (data.requestId) {
        await tx.insert(requestTimeline).values({
          requestId: data.requestId,
          actorName: actor.name,
          actorRole: actor.role || 'finance',
          eventType: 'note_added',
          notes: `إصدار فاتورة مطالبة مالية للعميل (${invoiceNumber}) بمبلغ ${totalAmount} ${currency}`,
        });
      }

      await AuditService.log({
        actorName: actor.name,
        actorRole: actor.role || 'finance',
        entityType: 'customer_invoice',
        entityId: invoice.id,
        action: 'create',
        afterState: { invoiceNumber, totalAmount, currency, customerId: customer.id },
        notes: `إصدار فاتورة عميل جديدة ${invoiceNumber} بمبلغ ${totalAmount} ${currency}`,
      });

      return invoice;
    });
  }

  // =========================================================================
  // 8. RECEIPT VOUCHERS (سندات القبض والتحصيل)
  // =========================================================================

  public static async listReceiptVouchers(filters?: {
    customerId?: string;
    treasuryAccountId?: string;
    customerInvoiceId?: string;
  }) {
    let query = db
      .select({
        id: receiptVouchers.id,
        voucherNumber: receiptVouchers.voucherNumber,
        treasuryAccountId: receiptVouchers.treasuryAccountId,
        treasuryName: treasuryAccounts.name,
        treasuryCurrency: treasuryAccounts.currency,
        customerId: receiptVouchers.customerId,
        customerName: customers.tradeName,
        customerInvoiceId: receiptVouchers.customerInvoiceId,
        invoiceNumber: customerInvoices.invoiceNumber,
        amount: receiptVouchers.amount,
        currency: receiptVouchers.currency,
        exchangeRate: receiptVouchers.exchangeRate,
        amountInTreasuryCurrency: receiptVouchers.amountInTreasuryCurrency,
        paymentMethod: receiptVouchers.paymentMethod,
        referenceDoc: receiptVouchers.referenceDoc,
        status: receiptVouchers.status,
        receivedBy: receiptVouchers.receivedBy,
        postedBy: receiptVouchers.postedBy,
        postedAt: receiptVouchers.postedAt,
        notes: receiptVouchers.notes,
        createdAt: receiptVouchers.createdAt,
      })
      .from(receiptVouchers)
      .leftJoin(treasuryAccounts, eq(receiptVouchers.treasuryAccountId, treasuryAccounts.id))
      .leftJoin(customers, eq(receiptVouchers.customerId, customers.id))
      .leftJoin(customerInvoices, eq(receiptVouchers.customerInvoiceId, customerInvoices.id))
      .orderBy(desc(receiptVouchers.createdAt))
      .$dynamic();

    if (filters?.customerId) {
      query = query.where(eq(receiptVouchers.customerId, filters.customerId));
    }
    if (filters?.treasuryAccountId) {
      query = query.where(eq(receiptVouchers.treasuryAccountId, filters.treasuryAccountId));
    }
    if (filters?.customerInvoiceId) {
      query = query.where(eq(receiptVouchers.customerInvoiceId, filters.customerInvoiceId));
    }

    return await query;
  }

  public static async getReceiptVoucherById(id: string) {
    const [voucher] = await db
      .select({
        id: receiptVouchers.id,
        voucherNumber: receiptVouchers.voucherNumber,
        treasuryAccountId: receiptVouchers.treasuryAccountId,
        treasuryName: treasuryAccounts.name,
        treasuryCurrency: treasuryAccounts.currency,
        customerId: receiptVouchers.customerId,
        customerName: customers.tradeName,
        customerInvoiceId: receiptVouchers.customerInvoiceId,
        invoiceNumber: customerInvoices.invoiceNumber,
        amount: receiptVouchers.amount,
        currency: receiptVouchers.currency,
        exchangeRate: receiptVouchers.exchangeRate,
        amountInTreasuryCurrency: receiptVouchers.amountInTreasuryCurrency,
        paymentMethod: receiptVouchers.paymentMethod,
        referenceDoc: receiptVouchers.referenceDoc,
        status: receiptVouchers.status,
        receivedBy: receiptVouchers.receivedBy,
        postedBy: receiptVouchers.postedBy,
        postedAt: receiptVouchers.postedAt,
        notes: receiptVouchers.notes,
        createdAt: receiptVouchers.createdAt,
      })
      .from(receiptVouchers)
      .leftJoin(treasuryAccounts, eq(receiptVouchers.treasuryAccountId, treasuryAccounts.id))
      .leftJoin(customers, eq(receiptVouchers.customerId, customers.id))
      .leftJoin(customerInvoices, eq(receiptVouchers.customerInvoiceId, customerInvoices.id))
      .where(eq(receiptVouchers.id, id));

    if (!voucher) {
      throw new Error('سند القبض غير موجود');
    }

    return voucher;
  }

  public static async createReceiptVoucher(
    data: {
      treasuryAccountId: string;
      customerId: string;
      customerInvoiceId?: string;
      amount: number;
      currency: string;
      exchangeRate?: number;
      paymentMethod?: 'cash' | 'bank_transfer' | 'cheque';
      referenceDoc?: string;
      notes?: string;
    },
    actor: ActorInfo
  ) {
    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
      throw new Error('مبلغ التحصيل يجب أن يكون قيمة موجبة أكبر من صفر');
    }

    const exchangeRate = Number(data.exchangeRate) || 1.0;
    const amountInTreasury = Number((amount * exchangeRate).toFixed(2));

    return await db.transaction(async (tx) => {
      // 1. Lock treasury account
      const [treasury] = await tx
        .select()
        .from(treasuryAccounts)
        .where(eq(treasuryAccounts.id, data.treasuryAccountId))
        .for('update');

      if (!treasury) {
        throw new Error('حساب الخزينة غير موجود');
      }
      if (treasury.status !== 'active') {
        throw new Error(`حساب الخزينة (${treasury.name}) غير نشط حالياً`);
      }

      // 2. Lock customer
      const [customer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, data.customerId));

      if (!customer) {
        throw new Error('العميل المحدد غير موجود');
      }

      // 3. If linked to customer invoice, lock and check overpayment
      if (data.customerInvoiceId) {
        const [invoice] = await tx
          .select()
          .from(customerInvoices)
          .where(eq(customerInvoices.id, data.customerInvoiceId))
          .for('update');

        if (invoice) {
          const currentRemaining = Number(invoice.remainingAmount);
          if (amount > currentRemaining) {
            throw new Error(
              `مبلغ التحصيل (${amount} ${data.currency}) يتجاوز المبلغ المتبقي على الفاتورة (${currentRemaining} ${invoice.currency})`
            );
          }

          const newPaid = Number((Number(invoice.paidAmount) + amount).toFixed(2));
          const newRemaining = Number((currentRemaining - amount).toFixed(2));
          const newStatus = newRemaining <= 0 ? 'paid' : 'partially_paid';

          await tx
            .update(customerInvoices)
            .set({
              paidAmount: newPaid.toFixed(2),
              remainingAmount: newRemaining.toFixed(2),
              status: newStatus,
              updatedAt: new Date(),
            })
            .where(eq(customerInvoices.id, invoice.id));
        }
      }

      // 4. Update treasury balance atomically
      const currentTreasuryBal = Number(treasury.balance);
      const newTreasuryBal = Number((currentTreasuryBal + amountInTreasury).toFixed(2));

      await tx
        .update(treasuryAccounts)
        .set({
          balance: newTreasuryBal.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(treasuryAccounts.id, treasury.id));

      // 5. Generate voucher number and insert receipt
      const voucherNumber = await SequenceService.getNextCode('RECEIPT', 'REC-2026-', 4, tx);

      const [voucher] = await tx
        .insert(receiptVouchers)
        .values({
          voucherNumber,
          treasuryAccountId: treasury.id,
          customerId: customer.id,
          customerInvoiceId: data.customerInvoiceId || null,
          amount: amount.toFixed(2),
          currency: data.currency.toUpperCase(),
          exchangeRate: exchangeRate.toFixed(6),
          amountInTreasuryCurrency: amountInTreasury.toFixed(2),
          paymentMethod: data.paymentMethod || 'bank_transfer',
          referenceDoc: data.referenceDoc || null,
          status: 'posted',
          receivedBy: actor.id,
          postedBy: actor.id,
          postedAt: new Date(),
          notes: data.notes || null,
        })
        .returning();

      // 6. Insert protected treasury ledger entry
      const txCode = await SequenceService.getNextCode('TX', 'TX-2026-', 6, tx);
      await tx.insert(treasuryTransactions).values({
        transactionCode: txCode,
        accountId: treasury.id,
        transactionType: 'receipt',
        amount: amount.toFixed(2),
        currency: data.currency.toUpperCase(),
        exchangeRate: exchangeRate.toFixed(6),
        amountInTreasuryCurrency: amountInTreasury.toFixed(2),
        runningBalance: newTreasuryBal.toFixed(2),
        referenceType: 'receipt_voucher',
        referenceId: voucher.id,
        description: `تحصيل سند قبض ${voucherNumber} من العميل ${customer.tradeName} (${data.referenceDoc || 'دفعة تجارية'})`,
        actorId: actor.id,
      });

      // 7. Audit log
      await AuditService.log({
        actorName: actor.name,
        actorRole: actor.role || 'finance',
        entityType: 'receipt_voucher',
        entityId: voucher.id,
        action: 'create_and_post',
        afterState: { voucherNumber, amount, amountInTreasury, treasuryId: treasury.id },
        notes: `تحصيل وترحيل سند قبض ${voucherNumber} بمبلغ ${amount} ${data.currency} إلى خزينة ${treasury.name}`,
      });

      return voucher;
    });
  }

  // =========================================================================
  // 9. EXCHANGE RATES (أسعار الصرف التاريخية)
  // =========================================================================

  public static async listExchangeRates() {
    return await db
      .select()
      .from(exchangeRates)
      .orderBy(desc(exchangeRates.createdAt));
  }

  public static async setExchangeRate(
    data: {
      baseCurrency: string;
      targetCurrency: string;
      rate: number;
    },
    actor: ActorInfo
  ) {
    const rate = Number(data.rate);
    if (!rate || rate <= 0) {
      throw new Error('سعر الصرف يجب أن يكون قيمة موجبة أكبر من صفر');
    }

    const base = data.baseCurrency.toUpperCase();
    const target = data.targetCurrency.toUpperCase();

    const [rateRecord] = await db
      .insert(exchangeRates)
      .values({
        baseCurrency: base,
        targetCurrency: target,
        rate: rate.toFixed(6),
        effectiveDate: new Date(),
        createdBy: actor.id,
      })
      .returning();

    await AuditService.log({
      actorName: actor.name,
      actorRole: actor.role || 'finance',
      entityType: 'exchange_rate',
      entityId: rateRecord.id,
      action: 'update_rate',
      afterState: { base, target, rate },
      notes: `تحديث سعر صرف الزوج ${base}/${target} إلى ${rate}`,
    });

    return rateRecord;
  }

  // =========================================================================
  // 10. PRODUCT CATALOG & CATEGORIES (كتالوج المنتجات والسلع)
  // =========================================================================

  public static async listProductCategories() {
    return await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.status, 'active'))
      .orderBy(productCategories.nameAr);
  }

  public static async createProductCategory(
    data: {
      code?: string;
      nameAr: string;
      nameEn?: string;
      description?: string;
    },
    actor: ActorInfo
  ) {
    if (!data.nameAr) {
      throw new Error('اسم التصنيف بالعربية إلزامي');
    }

    const code = data.code || `CAT-${Date.now().toString(36).toUpperCase()}`;

    const [category] = await db
      .insert(productCategories)
      .values({
        code,
        nameAr: data.nameAr,
        nameEn: data.nameEn || null,
        description: data.description || null,
        status: 'active',
      })
      .returning();

    await AuditService.log({
      actorName: actor.name,
      actorRole: actor.role || 'procurement',
      entityType: 'product_category',
      entityId: category.id,
      action: 'create',
      afterState: { code, nameAr: data.nameAr },
      notes: `إضافة تصنيف منتجات جديد: ${data.nameAr}`,
    });

    return category;
  }

  public static async listProducts(filters?: {
    categoryId?: string;
    supplierId?: string;
    status?: string;
  }) {
    let query = db
      .select({
        id: products.id,
        sku: products.sku,
        nameAr: products.nameAr,
        nameEn: products.nameEn,
        categoryId: products.categoryId,
        categoryNameAr: productCategories.nameAr,
        description: products.description,
        unit: products.unit,
        defaultCurrency: products.defaultCurrency,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        supplierId: products.supplierId,
        supplierName: suppliers.name,
        minOrderQty: products.minOrderQty,
        status: products.status,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
      .orderBy(products.sku)
      .$dynamic();

    if (filters?.categoryId) {
      query = query.where(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.supplierId) {
      query = query.where(eq(products.supplierId, filters.supplierId));
    }
    if (filters?.status) {
      query = query.where(eq(products.status, filters.status));
    }

    return await query;
  }

  public static async getProductById(id: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      throw new Error('المنتج غير موجود');
    }

    return product;
  }

  public static async createProduct(
    data: {
      sku?: string;
      nameAr: string;
      nameEn?: string;
      categoryId?: string;
      description?: string;
      unit?: string;
      defaultCurrency?: string;
      costPrice: number;
      sellingPrice: number;
      supplierId?: string;
      minOrderQty?: number;
    },
    actor: ActorInfo
  ) {
    if (!data.nameAr) {
      throw new Error('اسم المنتج بالعربية إلزامي');
    }

    const sku = data.sku || (await SequenceService.getNextCode('PROD', 'PRD-', 4));
    const costPrice = Number(data.costPrice) || 0;
    const sellingPrice = Number(data.sellingPrice) || 0;

    let resolvedCatId: string | null = null;
    if (data.categoryId && data.categoryId.length === 36) {
      resolvedCatId = data.categoryId;
    } else if (data.categoryId) {
      const [c] = await db.select().from(productCategories).where(eq(productCategories.code, data.categoryId));
      if (c) resolvedCatId = c.id;
    }

    let resolvedSupId: string | null = null;
    if (data.supplierId && data.supplierId.length === 36) {
      resolvedSupId = data.supplierId;
    } else if (data.supplierId) {
      const [s] = await db.select().from(suppliers).where(eq(suppliers.supplierCode, data.supplierId));
      if (s) resolvedSupId = s.id;
    }

    const [product] = await db
      .insert(products)
      .values({
        sku,
        nameAr: data.nameAr,
        nameEn: data.nameEn || null,
        categoryId: resolvedCatId,
        description: data.description || null,
        unit: data.unit || 'pcs',
        defaultCurrency: (data.defaultCurrency || 'USD').toUpperCase(),
        costPrice: costPrice.toFixed(2),
        sellingPrice: sellingPrice.toFixed(2),
        supplierId: resolvedSupId,
        minOrderQty: Number(data.minOrderQty) || 1,
        status: 'active',
      })
      .returning();

    await AuditService.log({
      actorName: actor.name,
      actorRole: actor.role || 'procurement',
      entityType: 'product',
      entityId: product.id,
      action: 'create',
      afterState: { sku, nameAr: data.nameAr, costPrice, sellingPrice },
      notes: `إضافة منتج جديد لكتالوج البضائع: ${sku} - ${data.nameAr}`,
    });

    return product;
  }

  public static async updateProduct(
    id: string,
    data: {
      nameAr?: string;
      nameEn?: string;
      categoryId?: string;
      description?: string;
      unit?: string;
      defaultCurrency?: string;
      costPrice?: number;
      sellingPrice?: number;
      supplierId?: string;
      minOrderQty?: number;
      status?: 'active' | 'inactive';
    },
    actor: ActorInfo
  ) {
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!existing) {
      throw new Error('المنتج غير موجود');
    }

    const [updated] = await db
      .update(products)
      .set({
        nameAr: data.nameAr ?? existing.nameAr,
        nameEn: data.nameEn ?? existing.nameEn,
        categoryId: data.categoryId ?? existing.categoryId,
        description: data.description ?? existing.description,
        unit: data.unit ?? existing.unit,
        defaultCurrency: data.defaultCurrency ?? existing.defaultCurrency,
        costPrice: data.costPrice !== undefined ? Number(data.costPrice).toFixed(2) : existing.costPrice,
        sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice).toFixed(2) : existing.sellingPrice,
        supplierId: data.supplierId ?? existing.supplierId,
        minOrderQty: data.minOrderQty ?? existing.minOrderQty,
        status: data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    await AuditService.log({
      actorName: actor.name,
      actorRole: actor.role || 'procurement',
      entityType: 'product',
      entityId: id,
      action: 'update',
      afterState: data,
      notes: `تحديث بيانات المنتج ${existing.sku}`,
    });

    return updated;
  }
}
