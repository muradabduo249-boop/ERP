import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { authRateLimiter } from '../middleware/security.ts';

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().optional(),
  loginId: z.string().optional(),
  password: z.string().optional(),
  pin: z.string().optional(),
}).refine(data => !!(data.username || data.loginId), {
  message: 'اسم المستخدم أو المعرف مطلوب',
  path: ['username'],
}).refine(data => !!(data.password || data.pin), {
  message: 'رمز PIN أو كلمة المرور مطلوبة',
  path: ['password'],
});

// POST /api/auth/login
authRouter.post('/login', authRateLimiter(15, 60000), async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.issues[0]?.message || 'بيانات الدخول غير مكتملة',
        },
      });
    }

    const username = (parseResult.data.username || parseResult.data.loginId)!.trim();
    const password = (parseResult.data.password || parseResult.data.pin)!.trim();
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    const result = await AuthService.login({
      usernameOrEmail: username,
      pinOrPassword: password,
      ipAddress,
      userAgent,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: error.message || 'فشل التحقق من بيانات الدخول',
      },
    });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

    await AuthService.logout(token, req.user?.id, req.user?.name);

    return res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'حدث خطأ أثناء تسجيل الخروج',
      },
    });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: req.user,
  });
});
