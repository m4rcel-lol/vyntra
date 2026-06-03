import type { FastifyRequest } from "fastify";
import type { FileAsset } from "@prisma/client";
export type PublicAsset = {
    id: string;
    publicId: string;
    url: string;
    mimeType: string;
    kind: string;
    originalName: string;
    sizeBytes: number;
};
export declare function requestOrigin(request: FastifyRequest): string;
export declare function assetUrl(request: FastifyRequest, publicId: string): string;
export declare function serializeAsset(request: FastifyRequest, asset: FileAsset | null | undefined): PublicAsset | null;
