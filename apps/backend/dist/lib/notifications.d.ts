import type { FastifyInstance } from "fastify";
export declare function createNotification(app: FastifyInstance, params: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    url?: string;
    imageUrl?: string;
}): Promise<{
    type: string;
    id: string;
    createdAt: Date;
    userId: string;
    body: string;
    title: string;
    url: string;
    imageUrl: string;
    readAt: Date | null;
    clearedAt: Date | null;
}>;
