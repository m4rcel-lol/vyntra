import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient, UserRole } from "@prisma/client";
import type { Redis } from "ioredis";
import type { AuthUser } from "../types.js";
export declare function createSession(params: {
    prisma: PrismaClient;
    redis: Redis;
    reply: FastifyReply;
    request: FastifyRequest;
    userId: string;
}): Promise<{
    csrfToken: string;
}>;
export declare function clearSessionCookie(reply: FastifyReply): void;
export declare function hydrateAuth(request: FastifyRequest): Promise<void>;
export declare function requireUser(request: FastifyRequest): AuthUser;
export declare function requireRole(request: FastifyRequest, roles: UserRole[]): AuthUser;
export declare function assertCsrf(request: FastifyRequest): void;
export declare function revokeSession(params: {
    prisma: PrismaClient;
    redis: Redis;
    request: FastifyRequest;
}): Promise<void>;
