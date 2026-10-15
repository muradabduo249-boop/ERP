import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { NotificationService } from '../services/notificationService.ts';

export const notificationRouter = Router();

// GET /api/notifications - User's notifications feed (Strict user isolation)
notificationRouter.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unreadOnly, limit = '50', offset = '0' } = req.query as Record<string, string>;

      const result = await NotificationService.getUserNotifications(req.user!.id, {
        unreadOnly: unreadOnly === 'true',
        limit: Number(limit),
        offset: Number(offset),
      });

      return res.json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'حدث خطأ أثناء جلب الإشعارات' },
      });
    }
  }
);

// GET /api/notifications/unread-count - Quick unread badge counter
notificationRouter.get(
  '/unread-count',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const count = await NotificationService.getUnreadCount(req.user!.id);
      return res.json({
        success: true,
        unreadCount: count,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// PATCH /api/notifications/:id/read - Mark single notification as read
notificationRouter.patch(
  '/:id/read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await NotificationService.markAsRead(req.params.id, req.user!.id);
      return res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// POST /api/notifications/mark-all-read - Mark all notifications as read for current user
notificationRouter.post(
  '/mark-all-read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updatedCount = await NotificationService.markAllAsRead(req.user!.id);
      return res.json({
        success: true,
        updatedCount,
        message: 'تم تحديد جميع الإشعارات كمقروءة',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);
