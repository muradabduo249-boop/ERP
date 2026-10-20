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
    const normalizedSecret = cleanSecret.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

    // 1. Try finding by exact username
    let matchedUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, cleanIdentifier));

    let userRecord = matchedUsers[0];

    // 2. Try finding by exact email
    if (!userRecord) {
      const emailMatches = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanIdentifier));
      userRecord = emailMatches[0];
    }

    // 3. Try finding by phone number (normalized)
    if (!userRecord) {
      const cleanPhone = cleanIdentifier.replace(/[\s\-\+]/g, '');
      if (cleanPhone.length >= 6) {
        const allUsers = await db.select().from(users);
        const match = allUsers.find(
          (u) => u.phone && u.phone.replace(/[\s\-\+]/g, '') === cleanPhone
        );
        if (match) userRecord = match;
      }
    }

    // 4. Try finding by exact Arabic full name
    if (!userRecord) {
      const rawTrimmed = params.usernameOrEmail.trim();
      const nameMatches = await db.select().from(users).where(eq(users.name, rawTrimmed));
      if (nameMatches.length === 1) {
        userRecord = nameMatches[0];
      }
    }

    // 3. Fallback for Arabic role shortcuts only if exact match is not found
    if (!userRecord) {
      let targetUsername = '';
      if (
        cleanIdentifier === 'المدير' ||
        cleanIdentifier === 'المدير العام' ||
        cleanIdentifier === 'مدير' ||
        cleanIdentifier === 'admin' ||
        cleanIdentifier === 'ceo' ||
        cleanIdentifier === 'عبد الهادي' ||
        cleanIdentifier === 'عبدالهادي'
      ) {
        targetUsername = 'admin';
      } else if (cleanIdentifier === 'عمر' || cleanIdentifier === 'omar' || cleanIdentifier.includes('مكتب الصين')) {
        targetUsername = 'omar';
      } else if (cleanIdentifier === 'مقداد' || cleanIdentifier === 'miqdad' || cleanIdentifier.includes('تنسيق ميداني')) {
        targetUsername = 'miqdad';
      } else if (cleanIdentifier === 'أحمد' || cleanIdentifier === 'احمد' || cleanIdentifier === 'ahmed') {
        targetUsername = 'ahmed';
      } else if (cleanIdentifier === 'هشام' || cleanIdentifier === 'hisham' || cleanIdentifier.includes('توزيع')) {
        targetUsername = 'hisham';
      } else if (cleanIdentifier === 'راجي' || cleanIdentifier === 'raji' || cleanIdentifier.includes('مبيعات')) {
        targetUsername = 'raji';
      } else if (cleanIdentifier === 'تيسير' || cleanIdentifier === 'tayseer' || cleanIdentifier.includes('خدمة عملاء')) {
        targetUsername = 'tayseer';
      } else if (cleanIdentifier === 'تسابيح' || cleanIdentifier === 'tasabeeh' || cleanIdentifier.includes('مشتريات')) {
        targetUsername = 'tasabeeh';
      } else if (cleanIdentifier === 'الجمارك' || cleanIdentifier === 'جمارك' || cleanIdentifier === 'customs') {
        targetUsername = 'customs';
      } else if (cleanIdentifier === 'المالية' || cleanIdentifier === 'حسابات' || cleanIdentifier === 'finance') {
        targetUsername = 'finance';
      } else if (cleanIdentifier === 'المشتريات' || cleanIdentifier === 'توريد' || cleanIdentifier === 'procurement') {
        targetUsername = 'procurement';
      } else if (cleanIdentifier === 'العمليات' || cleanIdentifier === 'شحن' || cleanIdentifier === 'operations') {
        targetUsername = 'operations';
      }

      if (targetUsername) {
        const aliasMatches = await db.select().from(users).where(eq(users.username, targetUsername));
        if (aliasMatches.length > 0) {
          userRecord = aliasMatches[0];
        }
      }
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

    // Verify bcrypt hash (supports English and Arabic numerals)
    let isPasswordValid = await bcrypt.compare(cleanSecret, userRecord.passwordHash);
    if (!isPasswordValid && normalizedSecret !== cleanSecret) {
      isPasswordValid = await bcrypt.compare(normalizedSecret, userRecord.passwordHash);
    }
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

  /**
   * Update self profile (limited to non-sensitive personal info)
   */
  public static async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; email?: string }
  ): Promise<AuthenticatedUserPayload> {
    const matched = await db.select().from(users).where(eq(users.id, userId));
    if (matched.length === 0) {
      throw new Error('المستخدم غير موجود');
    }
    const current = matched[0];

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name && data.name.trim().length >= 2) {
      updates.name = data.name.trim();
    }
    if (data.phone !== undefined) {
      updates.phone = data.phone.trim() || null;
    }
    if (data.email && data.email.trim().toLowerCase() !== current.email) {
      const cleanEmail = data.email.trim().toLowerCase();
      const existingEmail = await db.select().from(users).where(eq(users.email, cleanEmail));
      if (existingEmail.length > 0 && existingEmail[0].id !== userId) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل من قبل موظف آخر');
      }
      updates.email = cleanEmail;
    }

    await db.update(users).set(updates).where(eq(users.id, userId));

    await AuditService.log({
      actorId: userId,
      actorName: current.name,
      actorRole: 'user',
      entityType: 'user',
      entityId: userId,
      action: 'profile_update',
      notes: `تحديث البيانات الشخصية للمستخدم [${current.username}]`,
    });

    return await this.getUserPayload(userId);
  }

  /**
   * Change own password with current password verification
   */
  public static async changePassword(
    userId: string,
    currentSecret: string,
    newSecret: string
  ): Promise<void> {
    const matched = await db.select().from(users).where(eq(users.id, userId));
    if (matched.length === 0) {
      throw new Error('المستخدم غير موجود');
    }
    const current = matched[0];

    if (!newSecret || newSecret.trim().length < 4) {
      throw new Error('كلمة المرور الجديدة يجب ألا تقل عن 4 خانات');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentSecret.trim(), current.passwordHash);
    if (!isValid) {
      throw new Error('كلمة المرور الحالية غير صحيحة');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newSecret.trim(), salt);

    await db
      .update(users)
      .set({
        passwordHash,
        failedLoginAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await AuditService.log({
      actorId: userId,
      actorName: current.name,
      actorRole: 'user',
      entityType: 'auth',
      entityId: userId,
      action: 'password_change',
      notes: `تغيير كلمة المرور للمستخدم [${current.username}] بنجاح`,
    });
  }
}
