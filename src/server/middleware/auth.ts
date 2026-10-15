import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthenticatedUserPayload } from '../services/authService.ts';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'يجب تسجيل الدخول للوصول إلى هذه الخدمة',
      },
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'رمز الجلسة غير صالح',
      },
    });
  }

  try {
    const user = await AuthService.validateSession(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'انتهت صلاحية جلسة العمل، يرجى تسجيل الدخول مجدداً',
        },
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'فشل التحقق من هوية المستخدم',
      },
    });
  }
};

export const requireAuth = authenticate;

