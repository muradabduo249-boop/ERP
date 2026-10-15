import { Request, Response, NextFunction } from 'express';

/**
 * Production Security Headers
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

/**
 * Centralized Error Handler (Never leaks internal stack traces or secrets)
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error [Unhandled]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.expose || statusCode < 500 ? err.message : 'حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
    },
  });
};

/**
 * IP-based Rate Limiter for Authentication and Sensitive Endpoints
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

export const authRateLimiter = (maxRequests: number = 10, windowMs: number = 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'تم تجاوز الحد الأقصى للمحاولات. يرجى الانتظار لمدة دقيقة واحدة قبل المحاولة مجدداً',
        },
      });
    }

    record.count++;
    next();
  };
};
