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

export function assetUrl(_request: FastifyRequest, publicId: string): string {
  return `/api/files/public/${publicId}`;
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
    sizeBytes: asset.sizeBytes,
    metadata: serializeAssetMetadata(request, asset.metadata)
  };
}

function serializeAssetMetadata(request: FastifyRequest, metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const result = { ...(metadata as Record<string, unknown>) };
  if (result.cover && typeof result.cover === "object" && !Array.isArray(result.cover)) {
    const cover = { ...(result.cover as Record<string, unknown>) };
    if (typeof cover.publicId === "string") {
      cover.url = assetUrl(request, cover.publicId);
    }
    result.cover = cover;
  }
  return result;
}
