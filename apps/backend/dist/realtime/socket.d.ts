import type { PrismaClient } from "@prisma/client";
import type { Server as SocketServer } from "socket.io";
export declare function registerRealtime(io: SocketServer, prisma: PrismaClient): void;
