import { db } from '../../db/index.ts';
import { suppliers, contacts, partyDocuments } from '../../db/schema.ts';
import { eq, or, ilike, and, sql, desc, asc } from 'drizzle-orm';
import { SequenceService } from './sequenceService.ts';
import { AuditService } from './auditService.ts';

export interface SupplierFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  city?: string;
  supplierType?: string;
  status?: string;
  tier?: string;
  rating?: number;
  sortBy?: 'createdAt' | 'name' | 'supplierCode' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSupplierInput {
  name: string; // Company / Factory Name
  tradeNameEn?: string;
  supplierType?: string; // manufacturer, trading_company, shipping_line, customs_broker, inland_transporter, warehouse, inspection_agency, packaging, other
  status?: string; // active, pending_approval, verified, suspended, blacklisted, inactive
  country?: string;
  city: string;
  address?: string;
  phone: string;
  secondaryPhone?: string;
  whatsapp?: string;
  wechat?: string; // Essential for Chinese suppliers
  email?: string;
  website?: string;
  taxNumber?: string;
  businessLicense?: string;
  categories?: string[];
  paymentTerms?: string;
  defaultCurrency?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIbanSwift?: string;
  bankBranch?: string;
  rating?: number;
  tier?: string;
  leadTimeDays?: number;
  notes?: string;
  complianceNotes?: string;
  // Optional primary contact person
  primaryContactName?: string;
  primaryContactJobTitle?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  primaryContactWechat?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {}

export class SupplierService {
  /**
   * Duplicate check by name, phone, or business license
   */
  static async checkDuplicate(params: {
    phone?: string;
    name?: string;
    businessLicense?: string;
    excludeId?: string;
  }) {
    const conditions = [];

    if (params.phone && params.phone.trim().length > 3) {
      conditions.push(eq(suppliers.phone, params.phone.trim()));
      conditions.push(eq(suppliers.whatsapp, params.phone.trim()));
    }
    if (params.name && params.name.trim().length > 2) {
      conditions.push(ilike(suppliers.name, `%${params.name.trim()}%`));
    }
    if (params.businessLicense && params.businessLicense.trim().length > 3) {
      conditions.push(eq(suppliers.businessLicense, params.businessLicense.trim()));
    }

    if (conditions.length === 0) {
      return { hasDuplicate: false, matches: [] };
    }

    let matches = await db.select().from(suppliers).where(or(...conditions));

    if (params.excludeId) {
      matches = matches.filter((s) => s.id !== params.excludeId);
    }

    return {
      hasDuplicate: matches.length > 0,
      matches,
    };
  }

  /**
   * List suppliers with pagination, high-speed multi-criteria filter
   * Scalable for hundreds and thousands of international vendors
   */
  static async listSuppliers(params: SupplierFilterParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(250, Math.max(1, Number(params.limit) || 25));
    const offset = (page - 1) * limit;

    const whereClauses = [];

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      whereClauses.push(
        or(
          ilike(suppliers.supplierCode, q),
          ilike(suppliers.name, q),
          ilike(suppliers.tradeNameEn, q),
          ilike(suppliers.phone, q),
          ilike(suppliers.whatsapp, q),
          ilike(suppliers.wechat, q),
          ilike(suppliers.email, q),
          ilike(suppliers.city, q),
          ilike(suppliers.businessLicense, q)
        )
      );
    }

    if (params.country && params.country !== 'all') {
      whereClauses.push(eq(suppliers.country, params.country));
    }

    if (params.city && params.city !== 'all') {
      whereClauses.push(eq(suppliers.city, params.city));
    }

    if (params.supplierType && params.supplierType !== 'all') {
      whereClauses.push(eq(suppliers.supplierType, params.supplierType));
    }

    if (params.status && params.status !== 'all') {
      whereClauses.push(eq(suppliers.status, params.status));
    }

    if (params.tier && params.tier !== 'all') {
      whereClauses.push(eq(suppliers.tier, params.tier));
    }

    if (params.rating && Number(params.rating) > 0) {
      whereClauses.push(eq(suppliers.rating, Number(params.rating)));
    }

    const whereCondition = whereClauses.length > 0 ? and(...whereClauses) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(suppliers)
      .where(whereCondition);
    const total = countResult?.count || 0;

    // Get paginated suppliers
    const rows = await db
      .select()
      .from(suppliers)
      .where(whereCondition)
      .orderBy(params.sortOrder === 'asc' ? asc(suppliers.createdAt) : desc(suppliers.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      suppliers: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single supplier with contacts and documents
   */
  static async getSupplierById(id: string) {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    if (!supplier) {
      return null;
    }

    const supplierContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.supplierId, id))
      .orderBy(desc(contacts.isPrimary), asc(contacts.createdAt));

    const documents = await db
      .select()
      .from(partyDocuments)
      .where(eq(partyDocuments.supplierId, id))
      .orderBy(desc(partyDocuments.createdAt));

    return {
      ...supplier,
      contacts: supplierContacts,
      documents,
    };
  }

  /**
   * Create supplier with concurrency-safe code generation e.g. SH-SUP-1001
   */
  static async createSupplier(
    input: CreateSupplierInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    // Check duplicates
    const dupCheck = await this.checkDuplicate({
      phone: input.phone,
      name: input.name,
      businessLicense: input.businessLicense,
    });

    if (dupCheck.hasDuplicate) {
      const match = dupCheck.matches[0];
      throw new Error(
        `المورد مسجل مسبقاً بنفس رقم الهاتف أو الاسم: [${match.supplierCode} - ${match.name}]`
      );
    }

    // Generate concurrency-safe business code
    const supplierCode = await SequenceService.getNextSequence('SUPPLIER');

    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(suppliers)
        .values({
          supplierCode,
          name: input.name.trim(),
          tradeNameEn: input.tradeNameEn?.trim() || null,
          supplierType: input.supplierType || 'manufacturer',
          status: input.status || 'active',
          country: input.country || 'الصين',
          city: input.city.trim(),
          address: input.address?.trim() || null,
          phone: input.phone.trim(),
          secondaryPhone: input.secondaryPhone?.trim() || null,
          whatsapp: input.whatsapp?.trim() || null,
          wechat: input.wechat?.trim() || null,
          email: input.email?.trim() || null,
          website: input.website?.trim() || null,
          taxNumber: input.taxNumber?.trim() || null,
          businessLicense: input.businessLicense?.trim() || null,
          categories: input.categories || [],
          paymentTerms: input.paymentTerms?.trim() || 'T/T 30% Deposit / 70% Before Shipment',
          defaultCurrency: input.defaultCurrency || 'USD',
          bankName: input.bankName?.trim() || null,
          bankAccountName: input.bankAccountName?.trim() || null,
          bankAccountNumber: input.bankAccountNumber?.trim() || null,
          bankIbanSwift: input.bankIbanSwift?.trim() || null,
          bankBranch: input.bankBranch?.trim() || null,
          rating: input.rating !== undefined ? input.rating : 5,
          tier: input.tier || 'B',
          leadTimeDays: input.leadTimeDays !== undefined ? input.leadTimeDays : 15,
          notes: input.notes?.trim() || null,
          complianceNotes: input.complianceNotes?.trim() || null,
        })
        .returning();

      // If contact person provided, create primary contact
      if (input.primaryContactName && input.primaryContactName.trim()) {
        const contactCode = await SequenceService.getNextSequence('CONTACT');
        await tx.insert(contacts).values({
          contactCode,
          entityType: 'supplier',
          supplierId: created.id,
          name: input.primaryContactName.trim(),
          jobTitle: input.primaryContactJobTitle?.trim() || 'مدير المبيعات والتصدير',
          department: 'sales',
          phone: input.primaryContactPhone?.trim() || input.phone.trim(),
          email: input.primaryContactEmail?.trim() || input.email?.trim() || null,
          wechat: input.primaryContactWechat?.trim() || input.wechat?.trim() || null,
          isPrimary: true,
          active: true,
        });
      }

      await AuditService.recordLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: 'supplier',
        entityId: created.id,
        action: 'create',
        afterState: created,
        notes: `تم تسجيل المورد/المصنع الجديد [${created.supplierCode} - ${created.name}] بواسطة ${actor.name}`,
        ipAddress,
        userAgent,
      });

      return created;
    });
  }

  /**
   * Update supplier
   */
  static async updateSupplier(
    id: string,
    input: UpdateSupplierInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [existing] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    if (!existing) {
      throw new Error('المورد غير موجود');
    }

    if (input.phone && input.phone !== existing.phone) {
      const dupCheck = await this.checkDuplicate({
        phone: input.phone,
        excludeId: id,
      });
      if (dupCheck.hasDuplicate) {
        throw new Error('رقم الهاتف مسجل مسبقاً لمورد آخر');
      }
    }

    const [updated] = await db
      .update(suppliers)
      .set({
        name: input.name ? input.name.trim() : existing.name,
        tradeNameEn: input.tradeNameEn !== undefined ? input.tradeNameEn : existing.tradeNameEn,
        supplierType: input.supplierType || existing.supplierType,
        status: input.status || existing.status,
        country: input.country || existing.country,
        city: input.city ? input.city.trim() : existing.city,
        address: input.address !== undefined ? input.address : existing.address,
        phone: input.phone ? input.phone.trim() : existing.phone,
        secondaryPhone: input.secondaryPhone !== undefined ? input.secondaryPhone : existing.secondaryPhone,
        whatsapp: input.whatsapp !== undefined ? input.whatsapp : existing.whatsapp,
        wechat: input.wechat !== undefined ? input.wechat : existing.wechat,
        email: input.email !== undefined ? input.email : existing.email,
        website: input.website !== undefined ? input.website : existing.website,
        taxNumber: input.taxNumber !== undefined ? input.taxNumber : existing.taxNumber,
        businessLicense: input.businessLicense !== undefined ? input.businessLicense : existing.businessLicense,
        categories: input.categories !== undefined ? input.categories : existing.categories,
        paymentTerms: input.paymentTerms !== undefined ? input.paymentTerms : existing.paymentTerms,
        defaultCurrency: input.defaultCurrency || existing.defaultCurrency,
        bankName: input.bankName !== undefined ? input.bankName : existing.bankName,
        bankAccountName: input.bankAccountName !== undefined ? input.bankAccountName : existing.bankAccountName,
        bankAccountNumber: input.bankAccountNumber !== undefined ? input.bankAccountNumber : existing.bankAccountNumber,
        bankIbanSwift: input.bankIbanSwift !== undefined ? input.bankIbanSwift : existing.bankIbanSwift,
        bankBranch: input.bankBranch !== undefined ? input.bankBranch : existing.bankBranch,
        rating: input.rating !== undefined ? input.rating : existing.rating,
        tier: input.tier || existing.tier,
        leadTimeDays: input.leadTimeDays !== undefined ? input.leadTimeDays : existing.leadTimeDays,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        complianceNotes: input.complianceNotes !== undefined ? input.complianceNotes : existing.complianceNotes,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning();

    await AuditService.recordLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'supplier',
      entityId: id,
      action: 'update',
      beforeState: existing,
      afterState: updated,
      notes: `تم تعديل بيانات المورد [${updated.supplierCode} - ${updated.name}] بواسطة ${actor.name}`,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  /**
   * Delete or archive supplier
   */
  static async deleteSupplier(
    id: string,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [existing] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    if (!existing) {
      throw new Error('المورد غير موجود');
    }

    const [updated] = await db
      .update(suppliers)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();

    await AuditService.recordLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'supplier',
      entityId: id,
      action: 'delete',
      beforeState: existing,
      afterState: updated,
      notes: `تم تعطيل/أرشفة سجل المورد [${existing.supplierCode}] بواسطة ${actor.name}`,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  /**
   * Bulk import suppliers (Supports importing 200+ vendors in a batch)
   */
  static async bulkImportSuppliers(
    records: CreateSupplierInput[],
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('قائمة الموردين للاستيراد فارغة');
    }

    const imported = [];
    const errors: { index: number; name: string; reason: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const item = records[i];
      if (!item.name || !item.name.trim() || !item.phone || !item.phone.trim()) {
        errors.push({ index: i, name: item.name || '', reason: 'الاسم ورقم الهاتف حقول إلزامية' });
        continue;
      }

      try {
        const created = await this.createSupplier(item, actor, ipAddress, userAgent);
        imported.push(created);
      } catch (err: any) {
        errors.push({ index: i, name: item.name, reason: err.message });
      }
    }

    await AuditService.recordLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'supplier',
      entityId: 'bulk-import',
      action: 'bulk_import',
      afterState: { totalSubmitted: records.length, successCount: imported.length, errorCount: errors.length },
      notes: `تم استيراد ${imported.length} مورد بنجاح من أصل ${records.length} سجل`,
      ipAddress,
      userAgent,
    });

    return {
      total: records.length,
      importedCount: imported.length,
      failedCount: errors.length,
      errors,
      imported,
    };
  }

  /**
   * Export suppliers for CSV/Excel
   */
  static async exportSuppliers() {
    return await db.select().from(suppliers).orderBy(asc(suppliers.supplierCode));
  }
}
