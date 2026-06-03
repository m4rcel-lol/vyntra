import type { FastifyRequest } from "fastify";
export declare function getClientIp(request: FastifyRequest): string;
export declare function getCountryFromHeaders(request: FastifyRequest): string;
export declare function getReferrer(request: FastifyRequest): string;
export declare function parseUserAgent(request: FastifyRequest): {
    browser: string;
    device: string;
};
export declare function getVisitorHash(request: FastifyRequest): string;
