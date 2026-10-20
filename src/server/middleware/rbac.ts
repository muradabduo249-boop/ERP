import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.ts';

/**
 * Ensures user has at least one of the specified roles (e.g. super_admin, department_manager)
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'غير مصرح: يلزم تسجيل الدخول' },
      });
    }

    const userRole = req.user.role?.code;
    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'لا توجد رتبة وظيفية معينة لهذا المستخدم' },
      });
    }

    // super_admin has master bypass
    if (userRole === 'super_admin' || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'ليس لديك الصلاحية الوظيفية المطلوبة لتنفيذ هذا الإجراء',
      },
    });
  };
};

/**
 * Ensures user has at least one of the specified granular permission codes (e.g. 'requests:approve', 'finance:receipts')
 */
export const requirePermission = (...permissionCodes: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'غير مصرح: يلزم تسجيل الدخول' },
      });
    }

    // Explicit operational block for creative / social media roles
    if (req.user.role?.code === 'creative_media' || req.user.department?.code === 'MARKETING_CREATIVE') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'حساب المصمم / السوشال ميديا غير مصرح له بتنفيذ أي عمليات تشغيلية في النظام (مستبعد تشغيلياً)',
        },
      });
    }

    // super_admin has all permissions
    if (req.user.role?.code === 'super_admin') {
      return next();
    }

    const hasPerm = permissionCodes.some((code) => req.user!.permissions.includes(code));
    if (hasPerm) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `يتطلب هذا الإجراء إحدى الصلاحيات: [${permissionCodes.join(', ')}] غير الممنوحة لحسابك`,
      },
    });
  };
};

/**
 * Ensures user belongs to a specific department or is super_admin
 */
export const requireDepartment = (...deptCodes: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'غير مصرح: يلزم تسجيل الدخول' },
      });
    }

    if (req.user.role?.code === 'super_admin') {
      return next();
    }

    const userDept = req.user.department?.code;
    if (userDept && deptCodes.includes(userDept)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'هذا الإجراء مقيد بنطاق عمل أقسام أخرى',
      },
    });
  };
};
