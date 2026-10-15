import { db } from '../../db/index.ts';
import { businessSequences } from '../../db/schema.ts';
import { eq, sql } from 'drizzle-orm';

export class SequenceService {
  /**
   * Generates next concurrency-safe sequence code using PostgreSQL row-level locking (FOR UPDATE)
   * Ensures zero duplicates even with hundreds of simultaneous concurrent requests across multiple instances.
   */
  public static async getNextCode(
    sequenceKey: string,
    defaultPrefix: string = 'SH-',
    defaultPadding: number = 4,
    txOrDb: any = db
  ): Promise<string> {
    const run = async (tx: any) => {
      // 1. Ensure the sequence row exists safely under extreme concurrency
      await tx.execute(
        sql`INSERT INTO business_sequences (sequence_key, prefix, current_value, padding, description)
            VALUES (${sequenceKey}, ${defaultPrefix}, ${1000}, ${defaultPadding}, ${`Auto-initialized sequence for ${sequenceKey}`})
            ON CONFLICT (sequence_key) DO NOTHING`
      );

      // 2. Atomically lock, increment, and return the new counter value
      const result = await tx.execute(
        sql`UPDATE business_sequences
            SET current_value = current_value + 1,
                updated_at = NOW()
            WHERE sequence_key = ${sequenceKey}
            RETURNING prefix, current_value, padding`
      );

      const row = result.rows[0] as any;
      const prefix = row?.prefix || defaultPrefix;
      const padding = Number(row?.padding) || defaultPadding;
      const nextValue = Number(row?.current_value) || 1001;

      // Format with padding (e.g., "SH-C-1001", "REQ-2026-000101")
      const formattedNum = String(nextValue).padStart(padding, '0');
      return `${prefix}${formattedNum}`;
    };

    if (txOrDb && txOrDb !== db) {
      return await run(txOrDb);
    }
    return await db.transaction(async (tx) => run(tx));
  }

  public static async getNextSequence(
    sequenceKey: string,
    defaultPrefix: string = 'SH-',
    defaultPadding: number = 4
  ): Promise<string> {
    return SequenceService.getNextCode(sequenceKey, defaultPrefix, defaultPadding);
  }
}
