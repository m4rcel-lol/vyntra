import type { PrismaClient, UserRole } from "@prisma/client";
import type { Redis } from "ioredis";
import type { Server as SocketServer } from "socket.io";

export type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
  isBanned: boolean;
  profileId: string | null;
};

export type AuthSession = {
  id: string;
  csrfToken: string;
  expiresAt: string;
};

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    io: SocketServer;
  }

  interface FastifyRequest {
    currentUser?: AuthUser;
    currentSession?: AuthSession;
  }
}
