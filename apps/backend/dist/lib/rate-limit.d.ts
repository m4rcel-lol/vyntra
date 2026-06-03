import type { Redis } from "ioredis";
export declare function assertRateLimit(redis: Redis, key: string, max: number, windowSeconds: number): Promise<void>;
