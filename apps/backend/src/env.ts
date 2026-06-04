import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

loadDotEnv();

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return value;
}, z.boolean());

const optionalBooleanFromEnv = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return value;
}, z.boolean().optional());

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
  SESSION_COOKIE_SECURE: optionalBooleanFromEnv,
  TRUST_PROXY: booleanFromEnv.default(true),
  STORAGE_DIR: z.string().min(1).default("/app/uploads"),
  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(100).default(30)
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";

export const secureCookies = env.SESSION_COOKIE_SECURE ?? isProduction;

export const allowedOrigins = env.FRONTEND_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function loadDotEnv(): void {
  const candidates = [
    process.env.VYNTRA_ENV_FILE,
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env")
  ].filter(Boolean) as string[];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
      if (!match) continue;
      const key = match[1];
      const rawValue = match[2] ?? "";
      if (!key) continue;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue
        .replace(/^(['"])(.*)\1$/, "$2")
        .replace(/\\n/g, "\n");
    }
    return;
  }
}
