import type { Redis } from "ioredis";
import { fail } from "./errors.js";

export async function assertRateLimit(
  redis: Redis,
  key: string,
  max: number,
  windowSeconds: number
): Promise<void> {
  const redisKey = `ratelimit:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  if (count > max) {
    fail(429, "RATE_LIMITED", "Too many requests. Try again later.");
  }
}
