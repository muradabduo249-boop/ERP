import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../../db/index.ts';
import { users, authSessions, roles, departments, rolePermissions, permissions } from '../../db/schema.ts';
import { eq, and, gt } from 'drizzle-orm';
import { AuditService } from './auditService.ts';
import { config } from '../config.ts';

export interface LoginParams {
  usernameOrEmail: string;
  pinOrPassword: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthenticatedUserPayload {
  id: string;
  username: string;
  email: string;
  name: string;
  phone: string | null;
  status: string;
  department: {
    id: string;
    code: string;
    nameAr: string;
  } | null;
  role: {
    id: string;
    code: string;
    nameAr: string;
  } | null;
  permissions: string[];
  allowedModules: string[];
}

export class AuthService {
  /**
   * Secure server-side credential verification with bcrypt and session creation
   */
  public static async login(params: LoginParams): Promise<{
    user: AuthenticatedUserPayload;
    token: string;
    expiresAt: Date;
  }> {
    const cleanIdentifier = params.usernameOrEmail.trim().toLowerCase();
    const cleanSecret = params.pinOrPassword.trim();

    // Map common Arabic titles to seed usernames for seamless entry
    let targetUsername = cleanIdentifier;
    if (cleanIdentifier.includes('مدير') || cleanIdentifier.includes('admin') || cleanIdentifier === 'ceo') {
      targetUsername = 'admin';
    } else if (cleanIdentifier.includes('جمرك') || cleanIdentifier.includes('جمارك') || cleanIdentifier === 'customs') {
      targetUsername = 'customs';
    } else if (cleanIdentifier.includes('مال') || cleanIdentifier.includes('حساب') || cleanIdentifier === 'finance') {
      targetUsername = 'finance';
    } else if (cleanIdentifier.includes('مشتر') || cleanIdentifier.includes('توريد') || cleanIdentifier === 'procurement') {
      targetUsername = 'procurement';
    } else if (cleanIdentifier.includes('عمليات') || cleanIdentifier.includes('شحن') || cleanIdentifier === 'operations') {
      targetUsername = 'operations';
    }

    // Find user by username or email
    const matchedUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, targetUsername));

    let userRecord = matchedUsers[0];
    if (!userRecord) {
      const emailMatches = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanIdentifier));
      userRecord = emailMatches[0];
    }

    if (!userRecord) {
      // Record failed login audit
      await AuditService.log({
        actorName: 'مستخدم مجهول',
        actorRole: 'unknown',
        entityType: 'auth',
        entityId: cleanIdentifier,
        action: 'failed_login',
        notes: `محاولة تسجيل دخول فاشلة: اسم مستخدم غير مسجل [${cleanIdentifier}]`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Check account status
    if (userRecord.status !== 'active') {
      await AuditService.log({
        actorId: userRecord.id,
        actorName: userRecord.name,
        actorRole: 'user',
        entityType: 'auth',
        entityId: userRecord.id,
        action: 'failed_login',
        notes: `محاولة دخول لحساب غير نشط أو معطل: [${userRecord.username}] - الحالة [${userRecord.status}]`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
      throw new Error('تم تعطيل هذا الحساب. يرجى التواصل مع المدير العام');
    }

    // Check brute-force lockout
    if (userRecord.failedLoginAttempts >= config.maxLoginAttempts) {
      throw new Error('تم قفل الحساب مؤقتاً لتجاوز الحد المسموح لمحاولات الدخول الخاطئة');
    }

    // Verify bcrypt hash
    const isPasswordValid = await bcrypt.compare(cleanSecret, userRecord.passwordHash);
    if (!isPasswordValid) {
      // Increment failed attempts
      await db
        .update(users)
        .set({
          failedLoginAttempts: userRecord.failedLoginAttempts + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRecord.id));

      await AuditService.log({
        actorId: userRecord.id,
        actorName: userRecord.name,
        actorRole: 'user',
        entityType: 'auth',
        entityId: userRecord.id,
        action: 'failed_login',
        notes: `محاولة تسجيل دخول بكلمة مرور خاطئة للمستخدم: [${userRecord.username}]`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });

      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Reset failed attempts & update last login
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRecord.id));

    // Generate cryptographically secure session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.sessionExpiryHours * 60 * 60 * 1000);

    await db.insert(authSessions).values({
      userId: userRecord.id,
      token,
      expiresAt,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    });

    // Fetch user details with department, role, and permissions
    const userPayload = await this.getUserPayload(userRecord.id);

    // Audit successful login
    await AuditService.log({
      actorId: userRecord.id,
      actorName: userRecord.name,
      actorRole: userPayload.role?.code || 'user',
      entityType: 'auth',
      entityId: userRecord.id,
      action: 'login',
      notes: `تسجيل دخول ناجح للمستخدم [${userRecord.name}] بقسم [${userPayload.department?.nameAr || 'غير محدد'}]`,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return {
      user: userPayload,
      token,
      expiresAt,
    };
  }

  /**
   * Logs out and invalidates session token in database
   */
  public static async logout(token: string, actorId?: string, actorName?: string) {
    if (!token) return;

    await db.delete(authSessions).where(eq(authSessions.token, token));

    if (actorId && actorName) {
      await AuditService.log({
        actorId,
        actorName,
        actorRole: 'user',
        entityType: 'auth',
        entityId: actorId,
        action: 'logout',
        notes: `تسجيل خروج آمن للمستخدم [${actorName}] وإلغاء الجلسة`,
      });
    }
  }

  /**
   * Validates a session token and returns full user payload
   */
  public static async validateSession(token: string): Promise<AuthenticatedUserPayload | null> {
    if (!token) return null;

    const matchedSessions = await db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.token, token),
          gt(authSessions.expiresAt, new Date())
        )
      );

    if (matchedSessions.length === 0) return null;

    const session = matchedSessions[0];
    const user = await this.getUserPayload(session.userId);
    if (!user || user.status !== 'active') return null;

    return user;
  }

  /**
   * Assembles user payload without sensitive fields
   */
  public static async getUserPayload(userId: string): Promise<AuthenticatedUserPayload> {
    const matchedUsers = await db.select().from(users).where(eq(users.id, userId));
    if (matchedUsers.length === 0) {
      throw new Error('المستخدم غير موجود');
    }
    const u = matchedUsers[0];

    // Department
    let deptInfo: AuthenticatedUserPayload['department'] = null;
    if (u.departmentId) {
      const depts = await db.select().from(departments).where(eq(departments.id, u.departmentId));
      if (depts.length > 0) {
        deptInfo = {
          id: depts[0].id,
          code: depts[0].code,
          nameAr: depts[0].nameAr,
        };
      }
    }

    // Role & Permissions
    let roleInfo: AuthenticatedUserPayload['role'] = null;
    let userPermissions: string[] = [];

    if (u.roleId) {
      const r = await db.select().from(roles).where(eq(roles.id, u.roleId));
      if (r.length > 0) {
        roleInfo = {
          id: r[0].id,
          code: r[0].code,
          nameAr: r[0].nameAr,
        };

        const perms = await db
          .select({ permissionCode: rolePermissions.permissionCode })
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, r[0].id));

        userPermissions = perms.map((p) => p.permissionCode);
      }
    }

    return {
      id: u.id,
      username: u.username,
      email: u.email,
      name: u.name,
      phone: u.phone,
      status: u.status,
      department: deptInfo,
      role: roleInfo,
      permissions: userPermissions,
      allowedModules: (u.allowedModules as string[]) || [],
    };
  }
}
