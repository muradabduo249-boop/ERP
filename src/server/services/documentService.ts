import { db } from '../../db/index.ts';
import { partyDocuments } from '../../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { AuditService } from './auditService.ts';

export interface CreatePartyDocumentInput {
  entityType: 'customer' | 'supplier' | 'request';
  customerId?: string;
  supplierId?: string;
  requestId?: string;
  title: string;
  documentType: string;
  documentNumber?: string;
  expiryDate?: Date;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  notes?: string;
}

export class DocumentService {
  /**
   * List documents for entity
   */
  static async listDocuments(entityType: 'customer' | 'supplier' | 'request', entityId: string) {
    if (entityType === 'customer') {
      return await db
        .select()
        .from(partyDocuments)
        .where(eq(partyDocuments.customerId, entityId))
        .orderBy(desc(partyDocuments.createdAt));
    } else if (entityType === 'supplier') {
      return await db
        .select()
        .from(partyDocuments)
        .where(eq(partyDocuments.supplierId, entityId))
        .orderBy(desc(partyDocuments.createdAt));
    } else {
      return await db
        .select()
        .from(partyDocuments)
        .where(eq(partyDocuments.requestId, entityId))
        .orderBy(desc(partyDocuments.createdAt));
    }
  }

  /**
   * Add a new party document
   */
  static async addDocument(
    input: CreatePartyDocumentInput,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    if (!input.title || !input.title.trim()) {
      throw new Error('عنوان الوثيقة مطلوب');
    }
    if (!input.documentType) {
      throw new Error('نوع الوثيقة مطلوب');
    }

    const [created] = await db
      .insert(partyDocuments)
      .values({
        entityType: input.entityType,
        customerId: input.customerId || null,
        supplierId: input.supplierId || null,
        requestId: input.requestId || null,
        title: input.title.trim(),
        documentType: input.documentType,
        documentNumber: input.documentNumber?.trim() || null,
        expiryDate: input.expiryDate || null,
        fileUrl: input.fileUrl || null,
        fileName: input.fileName || null,
        fileSize: input.fileSize || null,
        uploadedBy: actor.id,
        notes: input.notes?.trim() || null,
      })
      .returning();

    await AuditService.recordLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'party_document',
      entityId: created.id,
      action: 'create',
      afterState: created,
      notes: `تمت إضافة مستند [${created.title}] لـ ${input.entityType} بواسطة ${actor.name}`,
      ipAddress,
      userAgent,
    });

    return created;
  }

  /**
   * Delete party document
   */
  static async deleteDocument(
    id: string,
    actor: { id: string; name: string; role: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const [existing] = await db.select().from(partyDocuments).where(eq(partyDocuments.id, id));
    if (!existing) {
      throw new Error('المستند غير موجود');
    }

    await db.delete(partyDocuments).where(eq(partyDocuments.id, id));

    await AuditService.recordLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: 'party_document',
      entityId: id,
      action: 'delete',
      beforeState: existing,
      notes: `تم حذف المستند [${existing.title}] بواسطة ${actor.name}`,
      ipAddress,
      userAgent,
    });

    return { success: true };
  }
}
