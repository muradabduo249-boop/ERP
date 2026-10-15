import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requirePermission } from '../middleware/rbac.ts';
import { TaskService } from '../services/taskService.ts';

export const taskRouter = Router();

const createTaskSchema = z.object({
  requestId: z.string().uuid('معرف الطلب غير صالح'),
  title: z.string().min(2, 'عنوان المهمة مطلوب'),
  departmentId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

const reassignTaskSchema = z.object({
  assignedUserId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
});

// GET /api/tasks - Global task listing with filtering, multi-queue, search, and pagination
taskRouter.get(
  '/',
  authenticate,
  requirePermission('requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        page = '1',
        limit = '25',
        search = '',
        queue = 'all',
        status = 'all',
        priority = 'all',
        departmentId = 'all',
        assignedUserId = 'all',
        requestId,
        isOverdue,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as Record<string, string>;

      const result = await TaskService.listTasks({
        page: Number(page),
        limit: Number(limit),
        search,
        queue: queue as any,
        status,
        priority,
        departmentId,
        assignedUserId,
        requestId,
        isOverdue,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        currentUserId: req.user!.id,
        currentUserDeptId: req.user!.department?.id,
      });

      return res.json({
        success: true,
        data: result.tasks,
        pagination: result.pagination,
        counts: result.counts,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'حدث خطأ أثناء جلب قائمة المهام' },
      });
    }
  }
);

// GET /api/tasks/my-tasks - Shorthand queue for authenticated user
taskRouter.get(
  '/my-tasks',
  authenticate,
  requirePermission('requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await TaskService.listTasks({
        queue: 'my_tasks',
        currentUserId: req.user!.id,
        currentUserDeptId: req.user!.department?.id,
        limit: 100,
      });

      return res.json({
        success: true,
        data: result.tasks,
        pagination: result.pagination,
        counts: result.counts,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// GET /api/tasks/department - Shorthand queue for user's department
taskRouter.get(
  '/department',
  authenticate,
  requirePermission('requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await TaskService.listTasks({
        queue: 'department',
        currentUserId: req.user!.id,
        currentUserDeptId: req.user!.department?.id,
        limit: 100,
      });

      return res.json({
        success: true,
        data: result.tasks,
        pagination: result.pagination,
        counts: result.counts,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// POST /api/tasks/check-deadlines - Trigger proactive deadline notification scan
taskRouter.post(
  '/check-deadlines',
  authenticate,
  requirePermission('requests:assign'),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const scanResult = await TaskService.checkUpcomingDeadlines();
      return res.json({ success: true, data: scanResult });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// GET /api/tasks/:id - Get single task by ID
taskRouter.get(
  '/:id',
  authenticate,
  requirePermission('requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const task = await TaskService.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: { message: 'المهمة غير موجودة في النظام' },
        });
      }

      return res.json({ success: true, data: task });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// POST /api/tasks - Create task linked to request
taskRouter.post(
  '/',
  authenticate,
  requirePermission('requests:edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = createTaskSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parse.error.issues[0]?.message || 'بيانات المهمة غير صالحة',
          },
        });
      }

      const task = await TaskService.createTask(
        parse.data,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.status(201).json({
        success: true,
        data: task,
        message: 'تم إنشاء المهمة بنجاح',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// PATCH /api/tasks/:id/status - Update task status
taskRouter.patch(
  '/:id/status',
  authenticate,
  requirePermission('requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = updateTaskStatusSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { message: 'حالة المهمة غير صالحة' },
        });
      }

      const updated = await TaskService.updateTaskStatus(
        req.params.id,
        parse.data.status,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({
        success: true,
        data: updated,
        message: 'تم تحديث حالة المهمة بنجاح',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// PATCH /api/tasks/:id/assign - Reassign task
taskRouter.patch(
  '/:id/assign',
  authenticate,
  requirePermission('requests:edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = reassignTaskSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { message: 'بيانات إعادة الإسناد غير صالحة' },
        });
      }

      const updated = await TaskService.reassignTask(
        req.params.id,
        {
          assignedUserId: parse.data.assignedUserId || undefined,
          departmentId: parse.data.departmentId || undefined,
          notes: parse.data.notes,
        },
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({
        success: true,
        data: updated,
        message: 'تمت إعادة إسناد المهمة بنجاح',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);
