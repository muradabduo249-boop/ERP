import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requirePermission } from '../middleware/rbac.ts';
import { RequestService } from '../services/requestService.ts';

export const requestRouter = Router();

const createRequestSchema = z.object({
  customerId: z.string().uuid('معرف العميل غير صالح'),
  title: z.string().min(2, 'عنوان أو وصف الطلب مطلوب'),
  requestType: z.string().min(2, 'نوع الطلب مطلوب'),
  departmentId: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedUserId: z.string().uuid().optional(),
  originCountry: z.string().optional(),
  destinationCountry: z.string().optional(),
  destinationCity: z.string().optional(),
  estimatedBudget: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

const transitionStatusSchema = z.object({
  targetStatus: z.enum([
    'new',
    'assigned',
    'ready_for_processing',
    'in_progress',
    'on_hold',
    'completed',
    'cancelled',
  ]),
  notes: z.string().optional(),
});

const assignRequestSchema = z.object({
  assignedUserId: z.string().uuid('معرف الموظف غير صالح'),
  departmentId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const approvalDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'changes_requested']),
  notes: z.string().optional(),
});

const timelineNoteSchema = z.object({
  notes: z.string().min(1, 'نص الملاحظة مطلوب'),
});

const createTaskSchema = z.object({
  title: z.string().min(2, 'عنوان المهمة مطلوب'),
  departmentId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/requests - List requests with filtering, queues, search, and pagination
requestRouter.get(
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
        customerId = 'all',
        requestType = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as Record<string, string>;

      const result = await RequestService.listRequests({
        page: Number(page),
        limit: Number(limit),
        search,
        queue: queue as any,
        status,
        priority,
        departmentId,
        customerId,
        requestType,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        currentUserId: req.user!.id,
        currentUserDeptId: req.user!.department?.id,
      });

      return res.json({
        success: true,
        data: result.requests,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// GET /api/requests/:id - Single request with full timeline, tasks, and documents
requestRouter.get(
  '/:id',
  authenticate,
  requirePermission('requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const request = await RequestService.getRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'الطلب غير موجود في النظام' },
        });
      }

      return res.json({ success: true, data: request });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// POST /api/requests - Create request
requestRouter.post(
  '/',
  authenticate,
  requirePermission('requests:create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = createRequestSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parse.error.issues[0]?.message || 'بيانات الطلب غير صالحة',
          },
        });
      }

      const created = await RequestService.createRequest(
        parse.data,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// PATCH /api/requests/:id/status - State machine status transition
requestRouter.patch(
  '/:id/status',
  authenticate,
  requirePermission('requests:edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = transitionStatusSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parse.error.issues[0]?.message || 'حالة الطلب غير صالحة',
          },
        });
      }

      const updated = await RequestService.transitionStatus(
        req.params.id,
        parse.data,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// POST /api/requests/:id/assign - Assign to employee / department
requestRouter.post(
  '/:id/assign',
  authenticate,
  requirePermission('requests:assign', 'requests:edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = assignRequestSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parse.error.issues[0]?.message || 'بيانات الإسناد غير صالحة',
          },
        });
      }

      const updated = await RequestService.assignRequest(
        req.params.id,
        parse.data,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({ success: true, data: updated, message: 'تم إسناد الطلب بنجاح' });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// POST /api/requests/:id/approve - Approval decision
requestRouter.post(
  '/:id/approve',
  authenticate,
  requirePermission('requests:approve'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = approvalDecisionSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parse.error.issues[0]?.message || 'بيانات الاعتماد غير صالحة',
          },
        });
      }

      const updated = await RequestService.submitApprovalDecision(
        req.params.id,
        parse.data,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({ success: true, data: updated, message: 'تم تسجيل قرار الاعتماد بنجاح' });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// POST /api/requests/:id/timeline - Add timeline note
requestRouter.post(
  '/:id/timeline',
  authenticate,
  requirePermission('requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = timelineNoteSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { message: 'نص الملاحظة مطلوب' },
        });
      }

      const event = await RequestService.addTimelineNote(
        req.params.id,
        parse.data.notes,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        }
      );

      return res.status(201).json({ success: true, data: event });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// POST /api/requests/:id/tasks - Create task
requestRouter.post(
  '/:id/tasks',
  authenticate,
  requirePermission('requests:edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = createTaskSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { message: parse.error.issues[0]?.message || 'بيانات المهمة غير صالحة' },
        });
      }

      const task = await RequestService.createTask(
        req.params.id,
        {
          ...parse.data,
          dueDate: parse.data.dueDate ? new Date(parse.data.dueDate) : undefined,
        },
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        }
      );

      return res.status(201).json({ success: true, data: task });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);

// PATCH /api/requests/tasks/:taskId - Update task status
requestRouter.patch(
  '/tasks/:taskId',
  authenticate,
  requirePermission('requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status } = req.body;
      if (!status || !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: { message: 'حالة المهمة غير صالحة' },
        });
      }

      const updated = await RequestService.updateTaskStatus(
        req.params.taskId,
        status,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        }
      );

      return res.json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
);
