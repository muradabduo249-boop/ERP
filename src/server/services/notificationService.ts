import { db } from '../../db/index.ts';
import { notifications } from '../../db/schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: 'assignment' | 'status_change' | 'approval' | 'task_deadline' | 'system';
  entityType: 'request' | 'task';
  entityId: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create an in-app notification for a user
   */
  public static async createNotification(
    input: CreateNotificationInput,
    txOrDb: any = db
  ) {
    if (!input.userId) {
      throw new Error('معرف المستخدم المستلم مطلوب');
    }
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('عنوان الإشعار مطلوب');
    }
    if (!input.message || input.message.trim().length === 0) {
      throw new Error('نص الإشعار مطلوب');
    }

    try {
      const [created] = await txOrDb
        .insert(notifications)
        .values({
          userId: input.userId,
          title: input.title.trim(),
          message: input.message.trim(),
          type: input.type,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata || {},
          isRead: false,
        })
        .returning();

      if (created) {
        (created as any).isDuplicate = false;
      }
      return created;
    } catch (err: any) {
      if (err.code === '23505' && input.type === 'task_deadline') {
        const [existing] = await txOrDb
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.entityType, input.entityType),
              eq(notifications.entityId, input.entityId),
              eq(notifications.type, 'task_deadline'),
              sql`metadata->>'windowKey' = ${input.metadata?.windowKey || ''}`
            )
          )
          .limit(1);
        if (existing) {
          (existing as any).isDuplicate = true;
        }
        return existing || null;
      }
      throw err;
    }
  }

  /**
   * Get paginated notifications for the authenticated user (strict user isolation)
   */
  public static async getUserNotifications(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
  ) {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;
    const conditions = [eq(notifications.userId, userId)];

    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const whereClause = and(...conditions);

    const rows = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const [unreadCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return {
      notifications: rows,
      unreadCount: unreadCountResult?.count || 0,
    };
  }

  /**
   * Get unread notification count for authenticated user
   */
  public static async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return result?.count || 0;
  }

  /**
   * Mark single notification as read (strictly ensuring recipient owns it)
   */
  public static async markAsRead(notificationId: string, userId: string) {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId));

    if (!existing) {
      throw new Error('الإشعار غير موجود');
    }

    if (existing.userId !== userId) {
      throw new Error('غير مصرح لك بتعديل إشعار مستخدم آخر');
    }

    if (existing.isRead) {
      return existing;
    }

    const [updated] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning();

    return updated;
  }

  /**
   * Mark all notifications as read for authenticated user
   */
  public static async markAllAsRead(userId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .returning({ id: notifications.id });

    return result.length;
  }
}
