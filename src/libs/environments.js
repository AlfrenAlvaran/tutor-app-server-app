import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),

  MONGOOSE: z.string().min(1, "MONGOOSE connection string is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET should be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().min(1, "JWT_EXPIRES_IN is required"),
  JWT_COOKIE_EXPIRES_DAYS: z.coerce.number().int().positive(),

  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  MAIL_FROM: z.string().min(1),
  MAIL_TO: z.string().email(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),

  DEDUPE_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  PROGRAMS_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),

  ATTENDANCE_QR_SECRET: z
    .string()
    .min(32, "ATTENDANCE_QR_SECRET should be at least 32 characters"),
  TUTOR_AUTH_SECRET: z
    .string()
    .min(32, "TUTOR_AUTH_SECRET should be at least 32 characters"),
  STUDENT_AUTH_SECRET: z
    .string()
    .min(32, "STUDENT_AUTH_SECRET should be at least 32 characters"),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

export const ENV = {
  port: raw.PORT,
  mongoose: raw.MONGOOSE,
  secret: raw.JWT_SECRET,
  jwt_expires_in: raw.JWT_EXPIRES_IN,
  jwt_cookie_expires_days: raw.JWT_COOKIE_EXPIRES_DAYS,
  nodeEnv: raw.NODE_ENV,
  frontend: raw.CLIENT_URL,
  smtpHost: raw.SMTP_HOST,
  smtpPort: raw.SMTP_PORT,
  // Gmail: 465 = implicit TLS (secure: true), 587 = STARTTLS (secure: false)
  smtpSecure: raw.SMTP_PORT === 465,
  smtpUser: raw.SMTP_USER,
  smtpPassword: raw.SMTP_PASSWORD,
  mailFrom: raw.MAIL_FROM,
  mailTo: raw.MAIL_TO,
  rateLimitWindowMs: raw.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: raw.RATE_LIMIT_MAX,
  dedupeTtlSeconds: raw.DEDUPE_TTL_SECONDS,
  programsCacheTtlSeconds: raw.PROGRAMS_CACHE_TTL_SECONDS,
  attendanceQrSecret: raw.ATTENDANCE_QR_SECRET,
  tutorAuthSecret: raw.TUTOR_AUTH_SECRET,
  studentAuthSecret: raw.STUDENT_AUTH_SECRET,

  cloudinaryCloudName: raw.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: raw.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: raw.CLOUDINARY_API_SECRET,
};

export const corsOrigins = raw.CORS_ORIGIN.split(",").map((o) => o.trim());