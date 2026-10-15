import { db } from '../../db/index.ts';
import { customers, contacts, partyDocuments, users } from '../../db/schema.ts';
import { eq, or, ilike, and, sql, desc, asc, not } from 'drizzle-orm';
import { SequenceService } from './sequenceService.ts';
import { AuditService } from './auditService.ts';

export interface CustomerFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerType?: string;
  city?: string;
  sortBy?: 'createdAt' | 'companyName' | 'customerCode';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCustomerInput {
  companyName: string;
  tradeName?: string;
  customerType?: string;
  status?: string;
  phone: string;
  secondaryPhone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  commercialRegister?: string;
  nationalIdOrPassport?: string;
  country?: string;
  city?: string;
  address?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  creditLimit?: number;
  currency?: string;
  assignedSalesRepId?: string;
  notes?: string;
  // Optional primary contact person
  primaryContactName?: string;
  primaryContactJobTitle?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  primaryContactWechat?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export class CustomerService {
  /**
   * Search and check duplicates before creation
   */
  static async checkDuplicate(params: {
    phone?: string;
    companyName?: string;
    taxNumber?: string;
    commercialRegister?: string;
    excludeId?: string;
  }) {
    const conditions = [];

    if (params.phone && params.phone.trim().length > 3) {
      conditions.push(eq(customers.primaryPhone, params.phone.trim()));
      conditions.push(eq(customers.whatsapp, params.phone.trim()));
    }
    if (params.companyName && params.companyName.trim().length > 2) {
      conditions.push(ilike(customers.companyName, `%${params.companyName.trim()}%`));
    }
    if (params.taxNumber && params.taxNumber.trim().length > 3) {
      conditions.push(eq(customers.taxNumber, params.taxNumber.trim()));
    }
    if (params.commercialRegister && params.commercialRegister.trim().length > 3) {
      conditions.push(eq(customers.commercialRegister, params.commercialRegister.trim()));
    }

    if (conditions.length === 0) {
      return { hasDuplicate: false, matches: [] };
    }

    let query = db.select().from(customers).where(or(...conditions));
    let matches = await query;

    if (params.excludeId) {
      matches = matches.filter((c) => c.id !== params.excludeId);
    }

    return {
      hasDuplicate: matches.length > 0,
      matches,
    };
  }

  /**
   * List customers with pagination, search, and filtering
   */
  static async listCustomers(params: CustomerFilterParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const whereClauses = [];

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      whereClauses.push(
        or(
          ilike(customers.customerCode, q),
          ilike(customers.companyName, q),
          ilike(customers.primaryPhone, q),
          ilike(customers.whatsapp, q),
          ilike(customers.email, q),
          ilike(customers.taxNumber, q),
          ilike(customers.commercialRegister, q)
        )
      );
    }

    if (params.status && params.status !== 'all') {
      whereClauses.push(eq(customers.status, params.status));
    }

    if (params.customerType && params.customerType !== 'all') {
      whereClauses.push(eq(customers.customerType, params.customerType));
    }

    if (params.city && params.city !== 'all') {
      whereClauses.push(eq(customers.city, params.city));
    }

    const whereCondition = whereClauses.length > 0 ? and(...whereClauses) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(whereCondition);
    const total = countResult?.count || 0;

    // Get paginated rows
    const rows = await db
      .select()
      .from(customers)
      .where(whereCondition)
      .orderBy(params.sortOrder === 'asc' ? asc(customers.createdAt) : desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      customers: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single customer with contacts and documents
   */
  static async getCustomerById(id: string) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    if (!customer) {
      return null;
    }

    const customerContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.customerId, id))
      .orderBy(desc(contacts.isPrimary), asc(contacts.createdAt));

    const documents = await db
      .select()
      .from(partyDocuments)
      .where(eq(partyDocuments.customerId, id))
      .orderBy(desc(partyDocuments.createdAt));

    let salesRep = null;
    if (customer.assignedSalesRepId) {
      const [u] = await db
        .select({ id: users.id, name: users.name, phone: users.phone, email: users.email })
        .from(users)
        .where(eq(users.id, customer.assignedSalesRepId));
      salesRep = u || null;
    }

    return {
      ...customer,
      contacts: customerContacts,
      documents,
      salesRep,
    };
  }

  /**
   * Create a new customer with concurrency-safe sequence generation
   */
  static async createCustomer(
    input: CreateCustomerInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Check duplicate phone or company name
    const dupCheck = await this.checkDuplicate({
      phone: input.phone,
      companyName: input.companyName,
      taxNumber: input.taxNumber,
      commercialRegister: input.commercialRegister,
    });

    if (dupCheck.hasDuplicate) {
      const match = dupCheck.matches[0];
      throw new Error(
        `العميل مسجل مسبقاً بنفس رقم الهاتف أو السجل أو الاسم: [${match.customerCode} - ${match.companyName}]`
      );
    }

    // 2. Generate concurrency-safe business code e.g. SH-C-1001
    const customerCode = await SequenceService.getNextSequence('CUSTOMER');

    // 3. Create customer and primary contact inside database transaction
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(customers)
        .values({
          customerCode,
          companyName: input.companyName.trim(),
          tradeName: input.tradeName?.trim() || null,
          customerType: input.customerType || 'commercial',
          status: input.status || 'active',
          primaryPhone: input.phone.trim(),
          secondaryPhone: input.secondaryPhone?.trim() || null,
          whatsapp: input.whatsapp?.trim() || input.phone.trim(),
          email: input.email?.trim() || null,
          website: input.website?.trim() || null,
          taxNumber: input.taxNumber?.trim() || null,
          commercialRegister: input.commercialRegister?.trim() || null,
          nationalIdOrPassport: input.nationalIdOrPassport?.trim() || null,
          country: input.country || 'السودان',
          city: input.city || 'بورتسودان',
          address: input.address?.trim() || null,
          deliveryAddress: input.deliveryAddress?.trim() || null,
          paymentTerms: input.paymentTerms?.trim() || null,
          creditLimit: input.creditLimit || 0,
          currency: input.currency || 'USD',
          assignedSalesRepId: input.assignedSalesRepId || null,
          notes: input.notes?.trim() || null,
        })
        .returning();

      // If contact person details provided, create primary contact
      if (input.primaryContactName && input.primaryContactName.trim()) {
        const contactCode = await SequenceService.getNextSequence('CONTACT');
        await tx.insert(contacts).values({
          contactCode,
          entityType: 'customer',
          customerId: created.id,
          name: input.primaryContactName.trim(),
          jobTitle: input.primaryContactJobTitle?.trim() || 'المسؤول المعتمد',
          department: 'management',
          phone: input.primaryContactPhone?.trim() || input.phone.trim(),
          email: input.primaryContactEmail?.trim() || input.email?.trim() || null,
          wechat: input.primaryContactWechat?.trim() || null,
          isPrimary: true,
          active: true,
        });
      }

      // 4. Record Server-Side Audit Log
      await AuditService.recordLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: 'customer',
        entityId: created.id,
        action: 'create',
        afterState: created,
        notes: `تم تسجيل العميل الجديد [${created.customerCode} - ${created.companyName}] بواسطة ${actor.name}`,
        ipAddress,
        userAgent,
      });

      return created;
    });
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(
    id: string,
    input: UpdateCustomerInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [existing] = await db.select().from(customers).where(eq(customers.id, id));
    if (!existing) {
      throw new Error('العميل غير موجود في قاعدة البيانات');
    }

    // Check duplicate if phone or CR changed
    if (
      (input.phone && input.phone !== existing.primaryPhone) ||
      (input.commercialRegister && input.commercialRegister !== existing.commercialRegister)
    ) {
      const dupCheck = await this.checkDuplicate({
        phone: input.phone,
        commercialRegister: input.commercialRegister,
        excludeId: id,
      });
      if (dupCheck.hasDuplicate) {
        throw new Error('رقم الهاتف أو السجل التجاري مسجل مسبقاً لعميل آخر');
      }
    }

    const [updated] = await db
      .update(customers)
      .set({
        companyName: input.companyName ? input.companyName.trim() : existing.companyName,
        tradeName: input.tradeName !== undefined ? input.tradeName : existing.tradeName,
        customerType: input.customerType || existing.customerType,
        status: input.status || existing.status,
        primaryPhone: input.phone ? input.phone.trim() : existing.primaryPhone,
        secondaryPhone: input.secondaryPhone !== undefined ? input.secondaryPhone : existing.secondaryPhone,
        whatsapp: input.whatsapp !== undefined ? input.whatsapp : existing.whatsapp,
        email: input.email !== undefined ? input.email : existing.email,
        website: input.website !== undefined ? input.website : existing.website,
        taxNumber: input.taxNumber !== undefined ? input.taxNumber : existing.taxNumber,
        commercialRegister: input.commercialRegister !== undefined ? input.commercialRegister : existing.commercialRegister,
        nationalIdOrPassport: input.nationalIdOrPassport !== undefined ? input.nationalIdOrPassport : existing.nationalIdOrPassport,
        country: input.country || existing.country,
        city: input.city || existing.city,
        address: input.address !== undefined ? input.address : existing.address,
        deliveryAddress: input.deliveryAddress !== undefined ? input.deliveryAddress : existing.deliveryAddress,
        paymentTerms: input.paymentTerms !== undefined ? input.paymentTerms : existing.paymentTerms,
        creditLimit: input.creditLimit !== undefined ? input.creditLimit : existing.creditLimit,
        currency: input.currency || existing.currency,
        assignedSalesRepId: input.assignedSalesRepId !== undefined ? input.assignedSalesRepId : existing.assignedSalesRepId,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    await AuditService.recordLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'customer',
      entityId: id,
      action: 'update',
      beforeState: existing,
      afterState: updated,
      notes: `تم تعديل بيانات العميل [${updated.customerCode} - ${updated.companyName}] بواسطة ${actor.name}`,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  /**
   * Delete or archive customer
   */
  static async deleteCustomer(
    id: string,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [existing] = await db.select().from(customers).where(eq(customers.id, id));
    if (!existing) {
      throw new Error('العميل غير موجود');
    }

    // Set status to inactive
    const [updated] = await db
      .update(customers)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();

    await AuditService.recordLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'customer',
      entityId: id,
      action: 'delete',
      beforeState: existing,
      afterState: updated,
      notes: `تم تعطيل/أرشفة حساب العميل [${existing.customerCode}] بواسطة ${actor.name}`,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  /**
   * Export all active customers for Excel/CSV
   */
  static async exportCustomers() {
    return await db.select().from(customers).orderBy(asc(customers.customerCode));
  }
}
