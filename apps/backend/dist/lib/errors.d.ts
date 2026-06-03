import type { FastifyReply } from "fastify";
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    constructor(statusCode: number, code: string, message: string);
}
export declare function fail(statusCode: number, code: string, message: string): never;
export declare function sendError(reply: FastifyReply, error: unknown): void;
