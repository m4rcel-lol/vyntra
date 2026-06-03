import type { FastifyReply } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  public constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function fail(statusCode: number, code: string, message: string): never {
  throw new AppError(statusCode, code, message);
}

export function sendError(reply: FastifyReply, error: unknown): void {
  if (error instanceof AppError) {
    void reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    void reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.flatten()
      }
    });
    return;
  }

  const message =
    process.env.NODE_ENV === "production" ? "Unexpected server error" : error instanceof Error ? error.message : "Unknown error";
  void reply.status(500).send({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message
    }
  });
}
