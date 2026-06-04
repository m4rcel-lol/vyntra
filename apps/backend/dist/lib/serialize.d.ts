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
    metadata: Record<string, unknown>;
};
export declare function assetUrl(_request: FastifyRequest, publicId: string): string;
export declare function serializeAsset(request: FastifyRequest, asset: FileAsset | null | undefined): PublicAsset | null;
