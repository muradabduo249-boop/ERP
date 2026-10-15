import { db } from '../../db/index.ts';
import {
  rfqs,
  supplierQuotes,
  purchaseOrders,
  requests,
  suppliers,
  requestTimeline,
  users,
} from '../../db/schema.ts';
import { eq, and, sql, desc } from 'drizzle-orm';
import { SequenceService } from './sequenceService.ts';
import { AuditService } from './auditService.ts';
import { NotificationService } from './notificationService.ts';

export interface CreateRfqInput {
  requestId: string;
  title: string;
  destinationPort?: string;
  invitedSupplierIds?: string[];
  items: Array<{
    id?: string;
    name: string;
    specifications: string;
    quantity: number;
    unit: string;
    targetPrice?: number;
  }>;
  notes?: string;
}

export interface AddSupplierQuoteInput {
  rfqId: string;
  supplierId: string;
  currency?: string;
  totalAmount: number;
  unitPrices?: Array<{ itemId: string; price: number }>;
  deliveryLeadDays?: number;
  warrantyMonths?: number;
  paymentTerms: string;
  notes?: string;
}

export interface CreatePurchaseOrderInput {
  requestId: string;
  supplierId: string;
  quoteId?: string;
  currency?: string;
  totalAmount: number;
  itemsSummary: string;
  paymentTerms: string;
  deliveryDate?: string | Date;
  status?: string;
}

export class ProcurementService {
  /**
   * 1. Create a Request for Quotation (RFQ)
   */
  public static async createRfq(
    input: CreateRfqInput,
    actor: { id: string; name: string; role?: string }
  ) {
    if (!input.requestId) {
      throw new Error('معرف الطلب المركزي (requestId) مطلوب لإنشاء استدراج العروض');
    }
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('عنوان استدراج العروض (title) مطلوب');
    }
    if (!input.items || input.items.length === 0) {
      throw new Error('يجب تحديد بند واحد على الأقل في استدراج العروض (items)');
    }

    // Verify Request exists
    const [req] = await db
      .select({ id: requests.id, requestCode: requests.requestCode })
      .from(requests)
      .where(eq(requests.id, input.requestId));

    if (!req) {
      throw new Error(`الطلب المركزي المحدد [${input.requestId}] غير موجود في المنظومة`);
    }

    // Format items with IDs
    const formattedItems = input.items.map((item, index) => ({
      id: item.id || `item-${index + 1}`,
      name: item.name.trim(),
      specifications: item.specifications?.trim() || '',
      quantity: Number(item.quantity) || 1,
      unit: item.unit?.trim() || 'وحدة',
      targetPrice: item.targetPrice ? Number(item.targetPrice) : undefined,
    }));

    return await db.transaction(async (tx) => {
      // Concurrency-safe RFQ Code
      const rfqCode = await SequenceService.getNextCode('RFQ', 'RFQ-2026-', 4, tx);

      const [newRfq] = await tx
        .insert(rfqs)
        .values({
          rfqCode,
          requestId: input.requestId,
          title: input.title.trim(),
          destinationPort: input.destinationPort?.trim() || 'ميناء بورتسودان الجنوبي',
          status: 'sent_to_suppliers',
          invitedSupplierIds: input.invitedSupplierIds || [],
          items: formattedItems,
          notes: input.notes?.trim() || null,
          createdBy: actor.id,
        })
        .returning();

      // Request timeline ledger event
      await tx.insert(requestTimeline).values({
        requestId: input.requestId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role || 'procurement_specialist',
        eventType: 'milestone',
        notes: `إصدار استدراج عروض أسعار دولي [${rfqCode}]: تم فتح مناقصة توريد للموردين والمصانع للطلب ${req.requestCode} بالعنوان: ${newRfq.title}`,
      });

      // Immutable audit log
      await AuditService.log(
        {
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role || 'procurement_specialist',
          action: 'create',
          entityType: 'request',
          entityId: newRfq.id,
          afterState: { rfqCode, requestId: input.requestId, title: newRfq.title },
          notes: `إصدار استدراج عروض أسعار دولي للمصانع [${rfqCode}] للطلب ${req.requestCode}`,
        },
        tx
      );

      return newRfq;
    });
  }

  /**
   * 2. Add Supplier Quote to an RFQ
   */
  public static async addSupplierQuote(
    input: AddSupplierQuoteInput,
    actor: { id: string; name: string; role?: string }
  ) {
    if (!input.rfqId) {
      throw new Error('معرف استدراج العروض (rfqId) مطلوب');
    }
    if (!input.supplierId) {
      throw new Error('معرف المورد / المصنع (supplierId) مطلوب');
    }
    if (typeof input.totalAmount !== 'number' || input.totalAmount <= 0) {
      throw new Error('إجمالي قيمة عرض السعر (totalAmount) يجب أن يكون أكبر من الصفر');
    }
    if (!input.paymentTerms || input.paymentTerms.trim().length === 0) {
      throw new Error('شروط الدفع والتسليم (paymentTerms) مطلوبة لعرض السعر');
    }

    // Verify RFQ exists
    const [rfq] = await db
      .select({ id: rfqs.id, rfqCode: rfqs.rfqCode, requestId: rfqs.requestId, status: rfqs.status })
      .from(rfqs)
      .where(eq(rfqs.id, input.rfqId));

    if (!rfq) {
      throw new Error(`استدراج العروض المحدد [${input.rfqId}] غير موجود`);
    }

    // Verify Supplier exists
    const [sup] = await db
      .select({ id: suppliers.id, name: suppliers.name, supplierCode: suppliers.supplierCode })
      .from(suppliers)
      .where(eq(suppliers.id, input.supplierId));

    if (!sup) {
      throw new Error(`المورد أو المصنع المحدد [${input.supplierId}] غير موجود في دليل الموردين`);
    }

    return await db.transaction(async (tx) => {
      const [newQuote] = await tx
        .insert(supplierQuotes)
        .values({
          rfqId: input.rfqId,
          supplierId: input.supplierId,
          currency: (input.currency || 'USD').toUpperCase(),
          totalAmount: Math.round(input.totalAmount),
          unitPrices: input.unitPrices || [],
          deliveryLeadDays: input.deliveryLeadDays || 15,
          warrantyMonths: input.warrantyMonths !== undefined ? input.warrantyMonths : 12,
          paymentTerms: input.paymentTerms.trim(),
          notes: input.notes?.trim() || null,
          isAwarded: false,
        })
        .returning();

      // Update RFQ status to quotes_received if currently sent_to_suppliers
      if (rfq.status === 'sent_to_suppliers' || rfq.status === 'draft') {
        await tx
          .update(rfqs)
          .set({ status: 'quotes_received', updatedAt: sql`NOW()` })
          .where(eq(rfqs.id, input.rfqId));
      }

      // Immutable audit log
      await AuditService.log(
        {
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role || 'procurement_specialist',
          action: 'create',
          entityType: 'supplier',
          entityId: newQuote.id,
          afterState: {
            rfqId: input.rfqId,
            supplierId: input.supplierId,
            totalAmount: newQuote.totalAmount,
            currency: newQuote.currency,
          },
          notes: `تسجيل عرض سعر من المصنع [${sup.name}] بقيمة ${newQuote.totalAmount} ${newQuote.currency} للمناقصة ${rfq.rfqCode}`,
        },
        tx
      );

      return newQuote;
    });
  }

  /**
   * 3. Award Quote and Automatically Generate Commercial Purchase Order (Atomic Transaction)
   */
  public static async awardQuote(
    quoteId: string,
    actor: { id: string; name: string; role?: string }
  ) {
    if (!quoteId) {
      throw new Error('معرف عرض السعر (quoteId) مطلوب للترسية');
    }

    return await db.transaction(async (tx) => {
      // 1. Fetch quote details with row lock
      const [quote] = await tx
        .select()
        .from(supplierQuotes)
        .where(eq(supplierQuotes.id, quoteId));

      if (!quote) {
        throw new Error(`عرض السعر المحدد [${quoteId}] غير موجود`);
      }

      if (quote.isAwarded) {
        throw new Error('هذا العرض تمت ترسيته مسبقاً بالفعل');
      }

      // 2. Fetch RFQ
      const [rfq] = await tx
        .select()
        .from(rfqs)
        .where(eq(rfqs.id, quote.rfqId));

      if (!rfq) {
        throw new Error(`استدراج العروض المرتبط [${quote.rfqId}] غير موجود`);
      }

      // 3. Fetch Supplier
      const [sup] = await tx
        .select({ id: suppliers.id, name: suppliers.name, supplierCode: suppliers.supplierCode })
        .from(suppliers)
        .where(eq(suppliers.id, quote.supplierId));

      // 4. Mark this quote as awarded, unmark others for same RFQ
      await tx
        .update(supplierQuotes)
        .set({ isAwarded: false, updatedAt: sql`NOW()` })
        .where(eq(supplierQuotes.rfqId, rfq.id));

      await tx
        .update(supplierQuotes)
        .set({ isAwarded: true, updatedAt: sql`NOW()` })
        .where(eq(supplierQuotes.id, quoteId));

      // 5. Update RFQ status to awarded
      await tx
        .update(rfqs)
        .set({ status: 'awarded', updatedAt: sql`NOW()` })
        .where(eq(rfqs.id, rfq.id));

      // 6. Generate official PO Code
      const poCode = await SequenceService.getNextCode('PO', 'PO-2026-', 4, tx);

      // Compute delivery date estimate
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + (quote.deliveryLeadDays || 20));

      const itemsSummary = `توريد وتصنيع بضاعة للمناقصة [${rfq.rfqCode}] - ${rfq.title}`;

      // 7. Insert official Purchase Order
      const [po] = await tx
        .insert(purchaseOrders)
        .values({
          poCode,
          requestId: rfq.requestId,
          supplierId: quote.supplierId,
          quoteId: quote.id,
          currency: quote.currency,
          totalAmount: quote.totalAmount,
          itemsSummary,
          status: 'approved',
          paymentTerms: quote.paymentTerms,
          deliveryDate,
          approvedBy: actor.id,
          approvedAt: sql`NOW()`,
          createdBy: actor.id,
        })
        .returning();

      // 8. Add event to request timeline
      await tx.insert(requestTimeline).values({
        requestId: rfq.requestId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role || 'procurement_specialist',
        eventType: 'milestone',
        notes: `ترسية مناقصة التوريد وإصدار أمر الشراء [${poCode}]: تم اعتماد وترسية العرض الفائز للمورد [${sup?.name || 'مورد معتمد'}] بمبلغ ${quote.totalAmount} ${quote.currency}`,
      });

      // 9. Immutable audit log
      await AuditService.log(
        {
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role || 'procurement_specialist',
          action: 'create',
          entityType: 'purchase_order',
          entityId: po.id,
          afterState: {
            poCode,
            quoteId: quote.id,
            rfqId: rfq.id,
            supplierId: quote.supplierId,
            totalAmount: po.totalAmount,
            currency: po.currency,
          },
          notes: `ترسية مناقصة [${rfq.rfqCode}] للمورد [${sup?.name}] وإصدار أمر الشراء التجاري [${poCode}]`,
        },
        tx
      );

      return { quote, rfq, po };
    });
  }

  /**
   * 4. Create Standalone Purchase Order (Direct PO without prior RFQ)
   */
  public static async createPurchaseOrder(
    input: CreatePurchaseOrderInput,
    actor: { id: string; name: string; role?: string }
  ) {
    if (!input.requestId) {
      throw new Error('معرف الطلب المركزي (requestId) مطلوب');
    }
    if (!input.supplierId) {
      throw new Error('معرف المورد / المصنع (supplierId) مطلوب');
    }
    if (typeof input.totalAmount !== 'number' || input.totalAmount <= 0) {
      throw new Error('إجمالي قيمة أمر الشراء (totalAmount) يجب أن يكون أكبر من الصفر');
    }
    if (!input.itemsSummary || input.itemsSummary.trim().length === 0) {
      throw new Error('ملخص البضاعة والمواصفات (itemsSummary) مطلوب');
    }

    // Verify Request exists
    const [req] = await db
      .select({ id: requests.id, requestCode: requests.requestCode })
      .from(requests)
      .where(eq(requests.id, input.requestId));

    if (!req) {
      throw new Error(`الطلب المركزي المحدد [${input.requestId}] غير موجود`);
    }

    // Verify Supplier exists
    const [sup] = await db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(eq(suppliers.id, input.supplierId));

    if (!sup) {
      throw new Error(`المورد المحدد [${input.supplierId}] غير موجود`);
    }

    return await db.transaction(async (tx) => {
      const poCode = await SequenceService.getNextCode('PO', 'PO-2026-', 4, tx);

      const [newPo] = await tx
        .insert(purchaseOrders)
        .values({
          poCode,
          requestId: input.requestId,
          supplierId: input.supplierId,
          quoteId: input.quoteId || null,
          currency: (input.currency || 'USD').toUpperCase(),
          totalAmount: Math.round(input.totalAmount),
          itemsSummary: input.itemsSummary.trim(),
          status: input.status || 'approved',
          paymentTerms: input.paymentTerms?.trim() || '30% مقدم، 70% عند الفحص والشحن',
          deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
          approvedBy: actor.id,
          approvedAt: sql`NOW()`,
          createdBy: actor.id,
        })
        .returning();

      // Request timeline
      await tx.insert(requestTimeline).values({
        requestId: input.requestId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role || 'procurement_specialist',
        eventType: 'milestone',
        notes: `إصدار أمر شراء تجاري مباشر [${poCode}]: تم إصدار أمر الشراء الرسمي للمورد [${sup.name}] بمبلغ ${newPo.totalAmount} ${newPo.currency}`,
      });

      // Immutable audit log
      await AuditService.log(
        {
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role || 'procurement_specialist',
          action: 'create',
          entityType: 'purchase_order',
          entityId: newPo.id,
          afterState: { poCode, totalAmount: newPo.totalAmount, currency: newPo.currency },
          notes: `إصدار أمر شراء تجاري [${poCode}] للمورد [${sup.name}] للطلب [${req.requestCode}]`,
        },
        tx
      );

      return newPo;
    });
  }

  /**
   * 5. Get RFQs with Quotes and Suppliers
   */
  public static async listRfqs(requestId?: string) {
    const conditions = [];
    if (requestId) {
      conditions.push(eq(rfqs.requestId, requestId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rfqList = await db
      .select({
        id: rfqs.id,
        rfqCode: rfqs.rfqCode,
        requestId: rfqs.requestId,
        title: rfqs.title,
        destinationPort: rfqs.destinationPort,
        status: rfqs.status,
        invitedSupplierIds: rfqs.invitedSupplierIds,
        items: rfqs.items,
        notes: rfqs.notes,
        createdAt: rfqs.createdAt,
        requestCode: requests.requestCode,
      })
      .from(rfqs)
      .leftJoin(requests, eq(rfqs.requestId, requests.id))
      .where(whereClause)
      .orderBy(desc(rfqs.createdAt));

    // Fetch quotes for all retrieved RFQs
    const quotesList = await db
      .select({
        id: supplierQuotes.id,
        rfqId: supplierQuotes.rfqId,
        supplierId: supplierQuotes.supplierId,
        supplierName: suppliers.name,
        supplierCode: suppliers.supplierCode,
        currency: supplierQuotes.currency,
        totalAmount: supplierQuotes.totalAmount,
        unitPrices: supplierQuotes.unitPrices,
        deliveryLeadDays: supplierQuotes.deliveryLeadDays,
        warrantyMonths: supplierQuotes.warrantyMonths,
        paymentTerms: supplierQuotes.paymentTerms,
        notes: supplierQuotes.notes,
        isAwarded: supplierQuotes.isAwarded,
        receivedAt: supplierQuotes.receivedAt,
      })
      .from(supplierQuotes)
      .leftJoin(suppliers, eq(supplierQuotes.supplierId, suppliers.id))
      .orderBy(desc(supplierQuotes.receivedAt));

    // Map quotes into each RFQ
    return rfqList.map((rfq) => ({
      ...rfq,
      quotes: quotesList.filter((q) => q.rfqId === rfq.id),
    }));
  }

  /**
   * 6. Get Purchase Orders with details
   */
  public static async listPurchaseOrders(options?: { requestId?: string; supplierId?: string }) {
    const conditions = [];
    if (options?.requestId) {
      conditions.push(eq(purchaseOrders.requestId, options.requestId));
    }
    if (options?.supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, options.supplierId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select({
        id: purchaseOrders.id,
        poCode: purchaseOrders.poCode,
        requestId: purchaseOrders.requestId,
        requestCode: requests.requestCode,
        supplierId: purchaseOrders.supplierId,
        supplierName: suppliers.name,
        supplierCode: suppliers.supplierCode,
        quoteId: purchaseOrders.quoteId,
        currency: purchaseOrders.currency,
        totalAmount: purchaseOrders.totalAmount,
        itemsSummary: purchaseOrders.itemsSummary,
        status: purchaseOrders.status,
        paymentTerms: purchaseOrders.paymentTerms,
        deliveryDate: purchaseOrders.deliveryDate,
        approvedAt: purchaseOrders.approvedAt,
        createdAt: purchaseOrders.createdAt,
      })
      .from(purchaseOrders)
      .leftJoin(requests, eq(purchaseOrders.requestId, requests.id))
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(whereClause)
      .orderBy(desc(purchaseOrders.createdAt));
  }
}
