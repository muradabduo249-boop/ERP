import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../../db/index.ts';
import { departments, roles, permissions, users, auditLogs, authSessions } from '../../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requireRole, requirePermission } from '../middleware/rbac.ts';
import { SequenceService } from '../services/sequenceService.ts';
import { AuditService } from '../services/auditService.ts';

export const foundationRouter = Router();

// GET /api/departments - List all active departments
foundationRouter.get('/departments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allDepts = await db.select().from(departments).where(eq(departments.active, true));
    return res.json({ success: true, data: allDepts });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/roles - List all roles
foundationRouter.get('/roles', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allRoles = await db.select().from(roles);
    return res.json({ success: true, data: allRoles });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/permissions - List all permissions
foundationRouter.get('/permissions', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allPerms = await db.select().from(permissions);
    return res.json({ success: true, data: allPerms });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/users - List users with safe metadata (requires settings:manage or super_admin)
foundationRouter.get('/users', authenticate, requirePermission('settings:manage'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      phone: users.phone,
      departmentId: users.departmentId,
      roleId: users.roleId,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      allowedModules: users.allowedModules,
      createdAt: users.createdAt,
    }).from(users);

    return res.json({ success: true, data: allUsers });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

const createUserSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب ألا يقل عن 3 أحرف'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  password: z.string().min(4, 'كلمة المرور يجب ألا تقل عن 4 خانات'),
  name: z.string().min(2, 'الاسم مطلوب'),
  phone: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  roleId: z.string().uuid().optional(),
  allowedModules: z.array(z.string()).optional(),
});

// POST /api/users - Create user (strictly restricted to super_admin)
foundationRouter.post('/users', authenticate, requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = createUserSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Validation error' },
      });
    }

    const { username, email, password, name, phone, departmentId, roleId, allowedModules } = parse.data;

    // Check duplicate username or email
    const existing = await db.select().from(users).where(eq(users.username, username.trim().toLowerCase()));
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_USERNAME', message: 'اسم المستخدم مسجل مسبقاً' },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [created] = await db.insert(users).values({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name.trim(),
      phone: phone || null,
      departmentId: departmentId || null,
      roleId: roleId || null,
      allowedModules: allowedModules || ['dashboard', 'requests_backbone'],
      status: 'active',
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      status: users.status,
    });

    await AuditService.log({
      actorId: req.user?.id,
      actorName: req.user?.name || 'المدير العام',
      actorRole: req.user?.role?.code || 'super_admin',
      entityType: 'user',
      entityId: created.id,
      action: 'create',
      notes: `إنشاء حساب موظف جديد: [${created.name}] باسم مستخدم [${created.username}]`,
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PATCH /api/users/:id/status - Toggle user active/inactive
foundationRouter.patch('/users/:id/status', authenticate, requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (status !== 'active' && status !== 'inactive' && status !== 'suspended') {
      return res.status(400).json({ success: false, error: { message: 'حالة الحساب غير صالحة' } });
    }

    const userId = req.params.id;
    const target = await db.select().from(users).where(eq(users.id, userId));
    if (target.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'المستخدم غير موجود' } });
    }

    await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId));

    if (status !== 'active') {
      await db.delete(authSessions).where(eq(authSessions.userId, userId));
    }

    await AuditService.log({
      actorId: req.user?.id,
      actorName: req.user?.name || 'المدير العام',
      actorRole: req.user?.role?.code || 'super_admin',
      entityType: 'user',
      entityId: userId,
      action: 'status_change',
      notes: `تغيير حالة المستخدم [${target[0].name}] إلى [${status}]`,
    });

    return res.json({ success: true, message: `تم تحديث حالة المستخدم إلى ${status}` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/audit-logs - Append-only server-side audit logs (requires audit:view)
foundationRouter.get('/audit-logs', authenticate, requirePermission('audit:view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
    return res.json({ success: true, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/sequences/next - Concurrency-safe sequence generation
foundationRouter.post('/sequences/next', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sequenceKey, prefix, padding } = req.body;
    if (!sequenceKey) {
      return res.status(400).json({ success: false, error: { message: 'مفتاح التسلسل مطلوب' } });
    }

    const nextCode = await SequenceService.getNextCode(sequenceKey, prefix, padding);
    return res.json({ success: true, data: { code: nextCode } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});
