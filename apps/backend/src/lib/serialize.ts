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

export function requestOrigin(request: FastifyRequest): string {
  const proto = firstHeader(request.headers["x-forwarded-proto"]) ?? request.protocol;
  const host = firstHeader(request.headers["x-forwarded-host"]) ?? request.headers.host ?? "localhost";
  return `${proto}://${host}`;
}

export function assetUrl(request: FastifyRequest, publicId: string): string {
  return `${requestOrigin(request)}/api/files/public/${publicId}`;
}

export function serializeAsset(request: FastifyRequest, asset: FileAsset | null | undefined): PublicAsset | null {
  if (!asset || asset.deletedAt) return null;
  return {
    id: asset.id,
    publicId: asset.publicId,
    url: assetUrl(request, asset.publicId),
    mimeType: asset.mimeType,
    kind: asset.kind,
    originalName: asset.originalName,
    sizeBytes: asset.sizeBytes
  };
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
