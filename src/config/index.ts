import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(5500),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(1, 'REFRESH_TOKEN_SECRET is required'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('1d'),
  REMEMBER_ME_EXPIRES_IN: z.string().default('30d'),
  RESET_PASS_TOKEN: z.string().min(1, 'RESET_PASS_TOKEN is required'),
  RESET_PASS_TOKEN_EXPIRES_IN: z.string().default('10m'),
  RESET_PASS_LINK: z
    .string()
    .default('http://localhost:5500/reset-password'),
  EMAIL: z.string().email().optional(),
  APP_PASS: z.string().optional(),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000,http://localhost:3001'),
  SESSION_CLEANUP_CRON: z.string().default('0 3 * * *'),
  SESSION_CLEANUP_RETENTION_DAYS: z.coerce.number().default(30),
  SUPER_ADMIN_EMAIL: z.string().email().default('admin@gmail.com'),
  SUPER_ADMIN_PASSWORD: z.string().min(8).default('12345678'),
  SUPER_ADMIN_FIRST_NAME: z.string().default('Mr. Super'),
  SUPER_ADMIN_LAST_NAME: z.string().default('Admin'),
  SUPER_ADMIN_USERNAME: z.string().default('admin'),
  SUPER_ADMIN_PHONE: z.string().default('0112345678'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    'Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors
  );
  process.exit(1);
}

const env = parsedEnv.data;

export default {
  env: env.NODE_ENV,
  port: env.PORT,
  bcrypt_salt_rounds: env.BCRYPT_SALT_ROUNDS,
  jwt: {
    jwt_secret: env.JWT_SECRET,
    expires_in: env.EXPIRES_IN,
    refresh_token_secret: env.REFRESH_TOKEN_SECRET,
    refresh_token_expires_in: env.REFRESH_TOKEN_EXPIRES_IN,
    remember_me_expires_in: env.REMEMBER_ME_EXPIRES_IN,
    reset_pass_secret: env.RESET_PASS_TOKEN,
    reset_pass_token_expires_in: env.RESET_PASS_TOKEN_EXPIRES_IN,
  },
  cron: {
    session_cleanup_schedule: env.SESSION_CLEANUP_CRON,
    session_cleanup_retention_days: env.SESSION_CLEANUP_RETENTION_DAYS,
  },
  reset_pass_link: env.RESET_PASS_LINK,
  emailSender: {
    email: env.EMAIL,
    app_pass: env.APP_PASS,
  },
  corsOrigins: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  superAdmin: {
    email: env.SUPER_ADMIN_EMAIL,
    password: env.SUPER_ADMIN_PASSWORD,
    firstName: env.SUPER_ADMIN_FIRST_NAME,
    lastName: env.SUPER_ADMIN_LAST_NAME,
    username: env.SUPER_ADMIN_USERNAME,
    phone: env.SUPER_ADMIN_PHONE,
  },
};
