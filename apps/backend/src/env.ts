import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  PUBLIC_APP_NAME: z.string().default("Vyntra.bio"),
  PUBLIC_APP_URL: z.string().url().default("http://localhost:8080"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:8080"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  COOKIE_SECRET: z.string().min(32),
  SESSION_COOKIE_NAME: z.string().min(1).default("vyntra_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  TRUST_PROXY: z.coerce.boolean().default(true),
  STORAGE_DIR: z.string().min(1).default("/app/uploads"),
  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(100).default(30)
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";

export const allowedOrigins = env.FRONTEND_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
