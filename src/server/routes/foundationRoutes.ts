import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db, isDbConfigured } from '../../db/index.ts';
import { departments, roles, permissions, users, auditLogs, authSessions } from '../../db/schema.ts';
import { eq, desc, and, ne } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requireRole, requirePermission } from '../middleware/rbac.ts';
import { SequenceService } from '../services/sequenceService.ts';
import { AuditService } from '../services/auditService.ts';
import { SEED_DEPARTMENTS, SEED_ROLES, SEED_PERMISSIONS, INITIAL_USERS } from '../../lib/constants.ts';

export const foundationRouter = Router();

export const normalizeRoleCode = (code?: string): string => {
  if (!code) return 'operations_officer';
  const c = code.toLowerCase().trim();
  if (c === 'admin' || c === 'super_admin' || c === 'ceo') return 'super_admin';
  if (c === 'manager' || c === 'department_manager') return 'department_manager';
  if (c.includes('procure') || c === 'china_manager') return 'procurement_specialist';
  if (c.includes('finance') || c.includes('account')) return 'finance_accountant';
  if (c.includes('customs') || c.includes('operation') || c.includes('delivery') || c.includes('field')) return 'operations_officer';
  if (c.includes('sales') || c.includes('crm') || c.includes('cx')) return 'sales_crm_officer';
  if (c === 'creative_media' || c.includes('design')) return 'creative_media';
  if (c === 'viewer' || c.includes('view') || c.includes('audit')) return 'viewer';
  return c;
};

export const normalizeDeptCode = (code?: string): string => {
  if (!code) return 'OPERATIONS';
  const c = code.toUpperCase().trim();
  if (c.includes('MGMT') || c.includes('MANAGEMENT')) return 'MANAGEMENT';
  if (c.includes('PROC') || c.includes('SOURCING')) return 'PROCUREMENT';
  if (c.includes('FIN') || c.includes('TREASURY')) return 'FINANCE';
  if (c.includes('OPS') || c.includes('LOGISTICS') || c.includes('FIELD') || c.includes('DELIVERY')) return 'OPERATIONS';
  if (c.includes('CUST') || c.includes('PORT')) return 'CUSTOMS';
  if (c.includes('SALES') || c.includes('CRM') || c.includes('CX')) return 'SALES_CRM';
  if (c.includes('IT')) return 'IT_ADMIN';
  if (c.includes('CREATIVE') || c.includes('MARKETING')) return 'MARKETING_CREATIVE';
  return c;
};

// GET /api/departments - List all active departments
foundationRouter.get('/departments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isDbConfigured()) {
      return res.json({ success: true, data: SEED_DEPARTMENTS });
    }
    const allDepts = await db.select().from(departments).where(eq(departments.active, true));
    return res.json({ success: true, data: allDepts });
  } catch {
    return res.json({ success: true, data: SEED_DEPARTMENTS });
  }
});

// GET /api/roles - List all roles
foundationRouter.get('/roles', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isDbConfigured()) {
      return res.json({ success: true, data: SEED_ROLES });
    }
    const allRoles = await db.select().from(roles);
    return res.json({ success: true, data: allRoles });
  } catch {
    return res.json({ success: true, data: SEED_ROLES });
  }
});

// GET /api/permissions - List all permissions
foundationRouter.get('/permissions', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isDbConfigured()) {
      return res.json({ success: true, data: SEED_PERMISSIONS });
    }
    const allPerms = await db.select().from(permissions);
    return res.json({ success: true, data: allPerms });
  } catch {
    return res.json({ success: true, data: SEED_PERMISSIONS });
  }
});

// GET /api/users - List users with role & department metadata
foundationRouter.get('/users', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role?.code === 'super_admin' || req.user?.role?.code === 'admin';
    const isManager = req.user?.role?.code === 'department_manager';
    const hasManage = req.user?.permissions?.includes('settings:manage');

    if (!isSuperAdmin && !isManager && !hasManage) {
      return res.status(403).json({
        success: false,
        error: { message: 'غير مصرح لك باستعراض سجل الموظفين' },
      });
    }

    if (!isDbConfigured()) {
      return res.json({ success: true, data: INITIAL_USERS });
    }

    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        phone: users.phone,
        departmentId: users.departmentId,
        departmentCode: departments.code,
        departmentNameAr: departments.nameAr,
        roleId: users.roleId,
        roleCode: roles.code,
        roleNameAr: roles.nameAr,
        status: users.status,
        lastLoginAt: users.lastLoginAt,
        allowedModules: users.allowedModules,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(roles, eq(users.roleId, roles.id));

    return res.json({ success: true, data: allUsers });
  } catch {
    return res.json({ success: true, data: INITIAL_USERS });
  }
});

const createUserSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب ألا يقل عن 3 أحرف'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').optional().or(z.literal('')),
  password: z.string().min(3, 'كلمة المرور أو رمز PIN يجب ألا تقل عن 3 خانات').optional(),
  pin: z.string().optional(),
  name: z.string().min(2, 'الاسم مطلوب'),
  phone: z.string().optional(),
  departmentId: z.string().optional().nullable(),
  departmentCode: z.string().optional(),
  roleId: z.string().optional().nullable(),
  roleCode: z.string().optional(),
  allowedModules: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

// POST /api/users - Create user (restricted to super_admin or users with settings:manage)
foundationRouter.post('/users', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role?.code === 'super_admin' || req.user?.role?.code === 'admin';
    const hasManage = req.user?.permissions?.includes('settings:manage');

    if (!isSuperAdmin && !hasManage) {
      return res.status(403).json({
        success: false,
        error: { message: 'غير مصرح لك بإنشاء حسابات موظفين' },
      });
    }

    const parse = createUserSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Validation error' },
      });
    }

    const {
      username,
      email,
      password,
      pin,
      name,
      phone,
      departmentId,
      departmentCode,
      roleId,
      roleCode,
      allowedModules,
      status = 'active',
    } = parse.data;

    const cleanUsername = username.trim().toLowerCase();
    const cleanSecret = (password || pin || '1234').trim();

    // Check duplicate username
    const existing = await db.select().from(users).where(eq(users.username, cleanUsername));
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_USERNAME', message: 'اسم المستخدم مسجل مسبقاً لموظف آخر' },
      });
    }

    // Resolve Department ID if code was passed or invalid UUID
    let resolvedDeptId: string | null = null;
    if (departmentId && departmentId.length === 36) {
      resolvedDeptId = departmentId;
    }
    if (!resolvedDeptId) {
      const targetDeptCode = normalizeDeptCode(departmentCode);
      const d = await db.select().from(departments).where(eq(departments.code, targetDeptCode));
      if (d.length > 0) {
        resolvedDeptId = d[0].id;
      } else {
        const fallbackDept = await db.select().from(departments).limit(1);
        if (fallbackDept.length > 0) resolvedDeptId = fallbackDept[0].id;
      }
    }

    // Resolve Role ID if code was passed or invalid UUID
    let resolvedRoleId: string | null = null;
    if (roleId && roleId.length === 36) {
      resolvedRoleId = roleId;
    }
    if (!resolvedRoleId) {
      const targetRoleCode = normalizeRoleCode(roleCode);
      const r = await db.select().from(roles).where(eq(roles.code, targetRoleCode));
      if (r.length > 0) {
        resolvedRoleId = r[0].id;
      } else {
        const fallbackRole = await db.select().from(roles).where(eq(roles.code, 'operations_officer'));
        if (fallbackRole.length > 0) {
          resolvedRoleId = fallbackRole[0].id;
        } else {
          const anyRole = await db.select().from(roles).limit(1);
          if (anyRole.length > 0) resolvedRoleId = anyRole[0].id;
        }
      }
    }

    // Creative media and designers are strictly stripped of operational permissions
    let finalAllowedModules = allowedModules || ['dashboard', 'requests_backbone'];
    if (roleCode === 'creative_media' || departmentCode === 'MARKETING_CREATIVE') {
      finalAllowedModules = [];
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanSecret, salt);

    const cleanEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@sahla.sd`;

    const [created] = await db
      .insert(users)
      .values({
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        departmentId: resolvedDeptId,
        roleId: resolvedRoleId,
        allowedModules: finalAllowedModules,
        status,
      })
      .returning();

    await AuditService.log({
      actorId: req.user?.id,
      actorName: req.user?.name || 'المدير العام',
      actorRole: req.user?.role?.code || 'super_admin',
      entityType: 'user',
      entityId: created.id,
      action: 'create',
      notes: `إنشاء حساب موظف جديد: [${created.name}] باسم مستخدم [${created.username}]`,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: created.id,
        username: created.username,
        email: created.email,
        name: created.name,
        phone: created.phone,
        departmentId: created.departmentId,
        roleId: created.roleId,
        status: created.status,
        allowedModules: created.allowedModules,
      },
      message: 'تم إنشاء حساب الموظف بنجاح وتفعيل بيانات الدخول',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

const updateUserSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب ألا يقل عن 3 أحرف').optional(),
  name: z.string().min(2, 'الاسم مطلوب').optional(),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  password: z.string().min(3).optional().or(z.literal('')),
  pin: z.string().optional().or(z.literal('')),
  departmentId: z.string().optional().nullable(),
  departmentCode: z.string().optional(),
  roleId: z.string().optional().nullable(),
  roleCode: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  allowedModules: z.array(z.string()).optional(),
});

// PUT /api/users/:id - Update user details, role, department, status, or password
foundationRouter.put('/users/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role?.code === 'super_admin' || req.user?.role?.code === 'admin';
    const hasManage = req.user?.permissions?.includes('settings:manage');

    if (!isSuperAdmin && !hasManage) {
      return res.status(403).json({
        success: false,
        error: { message: 'غير مصرح لك بتعديل بيانات الموظفين' },
      });
    }

    const userId = req.params.id;
    let target = await db.select().from(users).where(eq(users.id, userId));
    if (target.length === 0) {
      target = await db.select().from(users).where(eq(users.username, userId.toLowerCase().trim()));
    }
    if (target.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'الموظف غير موجود' } });
    }
    const realUserId = target[0].id;

    const parse = updateUserSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Validation error' },
      });
    }

    const {
      username,
      name,
      email,
      phone,
      password,
      pin,
      departmentId,
      departmentCode,
      roleId,
      roleCode,
      status,
      allowedModules,
    } = parse.data;

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    // Handle username update with collision check
    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername !== target[0].username) {
        const existing = await db
          .select()
          .from(users)
          .where(and(eq(users.username, cleanUsername), ne(users.id, realUserId)));
        if (existing.length > 0) {
          return res.status(400).json({
            success: false,
            error: { code: 'DUPLICATE_USERNAME', message: 'اسم المستخدم مسجل مسبقاً لموظف آخر' },
          });
        }
        updates.username = cleanUsername;
      }
    }

    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
    if (email !== undefined) {
      updates.email = email ? email.trim().toLowerCase() : `${(updates.username || target[0].username)}@sahla.sd`;
    }
    if (status) {
      updates.status = status;
      // If reactivated by admin, unlock account by clearing failed login attempts
      if (status === 'active') {
        updates.failedLoginAttempts = 0;
      }
    }

    if (departmentId && departmentId.length === 36) {
      updates.departmentId = departmentId;
    } else if (departmentCode) {
      const targetDeptCode = normalizeDeptCode(departmentCode);
      const d = await db.select().from(departments).where(eq(departments.code, targetDeptCode));
      if (d.length > 0) updates.departmentId = d[0].id;
    }

    if (roleId && roleId.length === 36) {
      updates.roleId = roleId;
    } else if (roleCode) {
      const targetRoleCode = normalizeRoleCode(roleCode);
      const r = await db.select().from(roles).where(eq(roles.code, targetRoleCode));
      if (r.length > 0) updates.roleId = r[0].id;
    }

    if (allowedModules) {
      if (roleCode === 'creative_media' || departmentCode === 'MARKETING_CREATIVE') {
        updates.allowedModules = [];
      } else {
        updates.allowedModules = allowedModules;
      }
    }

    // If new password/PIN is provided, hash it with bcrypt
    const newSecret = (password || pin)?.trim();
    if (newSecret && newSecret.length >= 3) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(newSecret, salt);
      updates.failedLoginAttempts = 0;
    }

    const [updated] = await db.update(users).set(updates).where(eq(users.id, realUserId)).returning();

    // If deactivated, invalidate all sessions immediately
    if (status && status !== 'active') {
      await db.delete(authSessions).where(eq(authSessions.userId, realUserId));
    }

    await AuditService.log({
      actorId: req.user?.id,
      actorName: req.user?.name || 'المدير العام',
      actorRole: req.user?.role?.code || 'super_admin',
      entityType: 'user',
      entityId: realUserId,
      action: 'update',
      notes: `تحديث بيانات الموظف [${updated.name}]`,
    });

    return res.json({
      success: true,
      data: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        departmentId: updated.departmentId,
        roleId: updated.roleId,
        status: updated.status,
        allowedModules: updated.allowedModules,
      },
      message: 'تم تحديث بيانات الموظف بنجاح',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// DELETE /api/users/:id - Delete or deactivate user
foundationRouter.delete('/users/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role?.code === 'super_admin' || req.user?.role?.code === 'admin';
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, error: { message: 'حذف الموظفين يقتصر على المدير العام فقط' } });
    }

    const userId = req.params.id;
    if (userId === req.user?.id) {
      return res.status(400).json({ success: false, error: { message: 'لا يمكنك حذف حسابك الشخصي النشط حالياً' } });
    }

    const target = await db.select().from(users).where(eq(users.id, userId));
    if (target.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'الموظف غير موجود' } });
    }

    // Invalidate all active sessions for this user
    await db.delete(authSessions).where(eq(authSessions.userId, userId));

    try {
      // Try hard delete if no relational records exist
      await db.delete(users).where(eq(users.id, userId));
    } catch {
      // If referenced by audit logs or requests, deactivate account permanently
      await db.update(users).set({ status: 'inactive', updatedAt: new Date() }).where(eq(users.id, userId));
    }

    await AuditService.log({
      actorId: req.user?.id,
      actorName: req.user?.name || 'المدير العام',
      actorRole: req.user?.role?.code || 'super_admin',
      entityType: 'user',
      entityId: userId,
      action: 'delete',
      notes: `حذف / تعطيل حساب الموظف [${target[0].name}] نهائياً من النظام`,
    });

    return res.json({ success: true, message: `تم حذف أو تعطيل حساب الموظف [${target[0].name}] بنجاح` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PATCH /api/users/:id/status - Toggle user active/inactive
foundationRouter.patch('/users/:id/status', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role?.code === 'super_admin' || req.user?.role?.code === 'admin';
    const hasManage = req.user?.permissions?.includes('settings:manage');

    if (!isSuperAdmin && !hasManage) {
      return res.status(403).json({ success: false, error: { message: 'غير مصرح لك بتغيير حالة الحسابات' } });
    }

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
