import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') !== 'production',
  sessionSecret: process.env.SESSION_SECRET || 'sahla_erp_secure_production_secret_key_2026',
  sessionExpiryHours: 24 * 7, // 7 days
  maxLoginAttempts: 5,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
