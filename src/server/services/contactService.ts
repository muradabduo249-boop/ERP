import { db } from '../../db/index.ts';
import { contacts } from '../../db/schema.ts';
import { eq, and, desc, asc } from 'drizzle-orm';
import { SequenceService } from './sequenceService.ts';
import { AuditService } from './auditService.ts';

export interface CreateContactInput {
  entityType: 'customer' | 'supplier';
  customerId?: string;
  supplierId?: string;
  name: string;
  nameEn?: string;
  jobTitle?: string;
  department?: string;
  phone: string;
  mobile?: string;
  whatsapp?: string;
  wechat?: string;
  email?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {}

export class ContactService {
  /**
   * List contacts for a customer or supplier
   */
  static async listContacts(entityType: 'customer' | 'supplier', entityId: string) {
    if (entityType === 'customer') {
      return await db
        .select()
        .from(contacts)
        .where(eq(contacts.customerId, entityId))
        .orderBy(desc(contacts.isPrimary), asc(contacts.createdAt));
    } else {
      return await db
        .select()
        .from(contacts)
        .where(eq(contacts.supplierId, entityId))
        .orderBy(desc(contacts.isPrimary), asc(contacts.createdAt));
    }
  }

  /**
   * Get single contact by ID
   */
  static async getContactById(id: string) {
    const [c] = await db.select().from(contacts).where(eq(contacts.id, id));
    return c || null;
  }

  /**
   * Create contact
   */
  static async createContact(
    input: CreateContactInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    if (!input.name || !input.name.trim()) {
      throw new Error('اسم جهة الاتصال مطلوب');
    }
    if (!input.phone || !input.phone.trim()) {
      throw new Error('رقم هاتف جهة الاتصال مطلوب');
    }
    if (input.entityType === 'customer' && !input.customerId) {
      throw new Error('معرّف العميل مطلوب');
    }
    if (input.entityType === 'supplier' && !input.supplierId) {
      throw new Error('معرّف المورد مطلوب');
    }

    const contactCode = await SequenceService.getNextSequence('CONTACT');

    return await db.transaction(async (tx) => {
      // If marked primary, unset other primaries for this entity
      if (input.isPrimary) {
        if (input.entityType === 'customer') {
          await tx
            .update(contacts)
            .set({ isPrimary: false })
            .where(eq(contacts.customerId, input.customerId!));
        } else {
          await tx
            .update(contacts)
            .set({ isPrimary: false })
            .where(eq(contacts.supplierId, input.supplierId!));
        }
      }

      const [created] = await tx
        .insert(contacts)
        .values({
          contactCode,
          entityType: input.entityType,
          customerId: input.customerId || null,
          supplierId: input.supplierId || null,
          name: input.name.trim(),
          nameEn: input.nameEn?.trim() || null,
          jobTitle: input.jobTitle?.trim() || null,
          department: input.department?.trim() || 'management',
          phone: input.phone.trim(),
          mobile: input.mobile?.trim() || null,
          whatsapp: input.whatsapp?.trim() || null,
          wechat: input.wechat?.trim() || null,
          email: input.email?.trim() || null,
          isPrimary: input.isPrimary ?? false,
          active: true,
          notes: input.notes?.trim() || null,
        })
        .returning();

      await AuditService.recordLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: 'contact',
        entityId: created.id,
        action: 'create',
        afterState: created,
        notes: `تمت إضافة جهة اتصال [${created.name} - ${created.phone}] إلى ${input.entityType} بواسطة ${actor.name}`,
        ipAddress,
        userAgent,
      });

      return created;
    });
  }

  /**
   * Update contact
   */
  static async updateContact(
    id: string,
    input: UpdateContactInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [existing] = await db.select().from(contacts).where(eq(contacts.id, id));
    if (!existing) {
      throw new Error('جهة الاتصال غير موجودة');
    }

    return await db.transaction(async (tx) => {
      if (input.isPrimary && !existing.isPrimary) {
        if (existing.entityType === 'customer' && existing.customerId) {
          await tx
            .update(contacts)
            .set({ isPrimary: false })
            .where(eq(contacts.customerId, existing.customerId));
        } else if (existing.entityType === 'supplier' && existing.supplierId) {
          await tx
            .update(contacts)
            .set({ isPrimary: false })
            .where(eq(contacts.supplierId, existing.supplierId));
        }
      }

      const [updated] = await tx
        .update(contacts)
        .set({
          name: input.name ? input.name.trim() : existing.name,
          nameEn: input.nameEn !== undefined ? input.nameEn : existing.nameEn,
          jobTitle: input.jobTitle !== undefined ? input.jobTitle : existing.jobTitle,
          department: input.department !== undefined ? input.department : existing.department,
          phone: input.phone ? input.phone.trim() : existing.phone,
          mobile: input.mobile !== undefined ? input.mobile : existing.mobile,
          whatsapp: input.whatsapp !== undefined ? input.whatsapp : existing.whatsapp,
          wechat: input.wechat !== undefined ? input.wechat : existing.wechat,
          email: input.email !== undefined ? input.email : existing.email,
          isPrimary: input.isPrimary !== undefined ? input.isPrimary : existing.isPrimary,
          notes: input.notes !== undefined ? input.notes : existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, id))
        .returning();

      await AuditService.recordLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: 'contact',
        entityId: id,
        action: 'update',
        beforeState: existing,
        afterState: updated,
        notes: `تم تعديل جهة الاتصال [${updated.name}] بواسطة ${actor.name}`,
        ipAddress,
        userAgent,
      });

      return updated;
    });
  }

  /**
   * Delete contact
   */
  static async deleteContact(
    id: string,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [existing] = await db.select().from(contacts).where(eq(contacts.id, id));
    if (!existing) {
      throw new Error('جهة الاتصال غير موجودة');
    }

    await db.delete(contacts).where(eq(contacts.id, id));

    await AuditService.recordLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'contact',
      entityId: id,
      action: 'delete',
      beforeState: existing,
      notes: `تم حذف جهة الاتصال [${existing.name}] بواسطة ${actor.name}`,
      ipAddress,
      userAgent,
    });

    return { success: true };
  }

  /**
   * Set a contact as primary
   */
  static async setPrimaryContact(
    id: string,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [existing] = await db.select().from(contacts).where(eq(contacts.id, id));
    if (!existing) {
      throw new Error('جهة الاتصال غير موجودة');
    }

    return await db.transaction(async (tx) => {
      if (existing.entityType === 'customer' && existing.customerId) {
        await tx
          .update(contacts)
          .set({ isPrimary: false })
          .where(eq(contacts.customerId, existing.customerId));
      } else if (existing.entityType === 'supplier' && existing.supplierId) {
        await tx
          .update(contacts)
          .set({ isPrimary: false })
          .where(eq(contacts.supplierId, existing.supplierId));
      }

      const [updated] = await tx
        .update(contacts)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(contacts.id, id))
        .returning();

      await AuditService.recordLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: 'contact',
        entityId: id,
        action: 'set_primary',
        notes: `تم تعيين [${updated.name}] كجهة اتصال رئيسية بواسطة ${actor.name}`,
        ipAddress,
        userAgent,
      });

      return updated;
    });
  }
}
