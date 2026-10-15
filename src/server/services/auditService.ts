import { db } from '../../db/index.ts';
import { auditLogs } from '../../db/schema.ts';
import { SequenceService } from './sequenceService.ts';

export interface RecordAuditParams {
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  notes?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  /**
   * Appends an immutable, server-side audit entry with a unique sequence code.
   */
  public static async log(params: RecordAuditParams, txOrDb: any = db) {
    try {
      const auditCode = await SequenceService.getNextCode('AUDIT', 'AUD-', 6, txOrDb);

      const [record] = await txOrDb
        .insert(auditLogs)
        .values({
          auditCode,
          actorId: params.actorId || null,
          actorName: params.actorName,
          actorRole: params.actorRole,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          beforeState: params.beforeState || null,
          afterState: params.afterState || null,
          notes: params.notes || null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        })
        .returning();

      return record;
    } catch (error) {
      console.error('Failed to write audit log entry:', error);
      if (txOrDb && txOrDb !== db) {
        throw error; // Rethrow to guarantee transaction rollback
      }
      return null;
    }
  }

  public static async recordLog(params: RecordAuditParams, txOrDb: any = db) {
    return AuditService.log(params, txOrDb);
  }
}
