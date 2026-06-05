import { ZodError } from "zod";
export class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}
export function fail(statusCode, code, message) {
    throw new AppError(statusCode, code, message);
}
export function sendError(reply, error) {
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
        const firstIssue = error.issues[0];
        const field = firstIssue?.path?.join(".");
        const message = firstIssue
            ? `${field ? `${field}: ` : ""}${firstIssue.message}`
            : "Request validation failed";
        void reply.status(400).send({
            error: {
                code: "VALIDATION_ERROR",
                message,
                details: error.flatten()
            }
        });
        return;
    }
    const message = process.env.NODE_ENV === "production" ? "Unexpected server error" : error instanceof Error ? error.message : "Unknown error";
    void reply.status(500).send({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message
        }
    });
}
//# sourceMappingURL=errors.js.map