import { fail } from "./errors.js";
export async function assertRateLimit(redis, key, max, windowSeconds) {
    const redisKey = `ratelimit:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
        await redis.expire(redisKey, windowSeconds);
    }
    if (count > max) {
        fail(429, "RATE_LIMITED", "Too many requests. Try again later.");
    }
}
//# sourceMappingURL=rate-limit.js.map