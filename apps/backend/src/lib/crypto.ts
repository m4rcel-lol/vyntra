import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import argon2 from "argon2";
import { nanoid } from "nanoid";
import { env } from "../env.js";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashIp(ip: string): string {
  return sha256(`${env.COOKIE_SECRET}:ip:${ip}`);
}

export function hashVisitor(seed: string): string {
  return sha256(`${env.COOKIE_SECRET}:visitor:${seed}`);
}

export function createSessionToken(): string {
  return `${nanoid(32)}.${randomBytes(32).toString("base64url")}`;
}

export function createCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
