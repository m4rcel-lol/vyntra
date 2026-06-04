import type { FastifyInstance } from "fastify";
import { FileAssetKind, Prisma, type FileAsset } from "@prisma/client";
import { nanoid } from "nanoid";
import { z } from "zod";
import { requireUser } from "../lib/auth.js";
import { fail } from "../lib/errors.js";
import { getCountryFromHeaders, getReferrer, getVisitorHash, parseUserAgent } from "../lib/http.js";
import { assetUrl, serializeAsset } from "../lib/serialize.js";
import {
  assertAllowedMime,
  assertAllowedSize,
  assertCompressedSize,
  compressUpload,
  deleteObject,
  detectUploadMime,
  getObjectStream,
  writeObject
} from "../lib/storage.js";

const uploadQuerySchema = z.object({
  kind: z.nativeEnum(FileAssetKind).default("OTHER")
});

type PreparedSidecar = {
  kind: "MUSIC_COVER";
  body: Buffer;
  mimeType: string;
  safeName: string;
  checksum: string;
  metadata?: Record<string, unknown>;
  objectKey: string;
};

export async function registerFileRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/files", async (request) => {
    const user = requireUser(request);
    const files = await app.prisma.fileAsset.findMany({
      where: { ownerUserId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" }
    });
    return { files: files.map((file) => serializeAsset(request, file)) };
  });

  app.post("/api/files/upload", async (request) => {
    const user = requireUser(request);
    const query = uploadQuerySchema.parse(request.query);
    const file = await request.file();
    if (!file) fail(400, "NO_FILE", "No file was uploaded");

    const buffer = await file.toBuffer();
    assertAllowedSize(buffer.byteLength);
    const verifiedMime = await detectUploadMime(buffer);
    assertAllowedMime(query.kind, verifiedMime);
    const compressed = await compressUpload({
      kind: query.kind,
      originalName: file.filename,
      mimeType: verifiedMime,
      body: buffer
    });
    assertCompressedSize(compressed.body.byteLength);

    const objectKey = `users/${user.id}/${query.kind.toLowerCase()}/${Date.now()}-${nanoid(12)}-${compressed.safeName}`;
    const writtenObjectKeys = [objectKey];
    await writeObject({ objectKey, body: compressed.body });
    try {
      const sidecars: PreparedSidecar[] = [];
      for (const sidecar of compressed.sidecars ?? []) {
        const sidecarObjectKey = `users/${user.id}/${sidecar.kind.toLowerCase()}/${Date.now()}-${nanoid(12)}-${sidecar.safeName}`;
        await writeObject({ objectKey: sidecarObjectKey, body: sidecar.body });
        writtenObjectKeys.push(sidecarObjectKey);
        sidecars.push({ ...sidecar, objectKey: sidecarObjectKey });
      }

      const asset = await app.prisma.$transaction(async (tx) => {
        const sidecarAssets: FileAsset[] = [];
        for (const sidecar of sidecars) {
          sidecarAssets.push(await tx.fileAsset.create({
            data: {
              ownerUserId: user.id,
              profileId: user.profileId,
              kind: sidecar.kind,
              storageDriver: "local",
              objectKey: sidecar.objectKey,
              originalName: sidecar.safeName.slice(0, 200),
              safeName: sidecar.safeName,
              mimeType: sidecar.mimeType,
              sizeBytes: sidecar.body.byteLength,
              checksum: sidecar.checksum,
              metadata: (sidecar.metadata ?? {}) as Prisma.InputJsonValue
            }
          }));
        }

        const coverAsset = sidecarAssets.find((asset) => asset.kind === "MUSIC_COVER") ?? null;
        return tx.fileAsset.create({
          data: {
            ownerUserId: user.id,
            profileId: user.profileId,
            kind: query.kind,
            storageDriver: "local",
            objectKey,
            originalName: file.filename.slice(0, 200),
            safeName: compressed.safeName,
            mimeType: compressed.mimeType,
            sizeBytes: compressed.body.byteLength,
            checksum: compressed.checksum,
            metadata: buildUploadMetadata(compressed.metadata, coverAsset) as Prisma.InputJsonValue
          }
        });
      });
      return { file: serializeAsset(request, asset) };
    } catch (error) {
      await Promise.all(writtenObjectKeys.map((key) => deleteObject(key)));
      throw error;
    }
  });

  app.get("/api/files/:id/url", async (request) => {
    const user = requireUser(request);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const file = await app.prisma.fileAsset.findFirst({
      where: { id: params.id, ownerUserId: user.id, deletedAt: null }
    });
    if (!file) fail(404, "FILE_NOT_FOUND", "File was not found");
    return {
      url: assetUrl(request, file.publicId),
      proxyUrl: assetUrl(request, file.publicId)
    };
  });

  app.delete("/api/files/:id", async (request) => {
    const user = requireUser(request);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const file = await app.prisma.fileAsset.findFirst({
      where: { id: params.id, ownerUserId: user.id, deletedAt: null }
    });
    if (!file) fail(404, "FILE_NOT_FOUND", "File was not found");
    await app.prisma.$transaction([
      app.prisma.fileAsset.update({
        where: { id: file.id },
        data: { deletedAt: new Date(), isPublic: false }
      })
    ]);
    await deleteObject(file.objectKey);
    return { ok: true };
  });

  app.get("/api/files/public/:publicId", async (request, reply) => {
    const params = z.object({ publicId: z.string().uuid() }).parse(request.params);
    const file = await app.prisma.fileAsset.findUnique({ where: { publicId: params.publicId } });
    if (!file || file.deletedAt || !file.isPublic) fail(404, "FILE_NOT_FOUND", "File was not found");

    const object = await getObjectStream(file.objectKey);
    const { browser, device } = parseUserAgent(request);
    await app.prisma.analyticsEvent.create({
      data: {
        userId: file.ownerUserId,
        profileId: file.profileId,
        type: "FILE_VIEW",
        path: request.url,
        referrer: getReferrer(request),
        visitorHash: getVisitorHash(request),
        country: getCountryFromHeaders(request),
        browser,
        device,
        metadata: { fileId: file.id, kind: file.kind }
      }
    });

    reply.header("Content-Type", file.mimeType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    if (object.contentLength) reply.header("Content-Length", object.contentLength);
    return reply.send(object.body);
  });
}

function buildUploadMetadata(metadata: Record<string, unknown> | undefined, coverAsset: FileAsset | null): Record<string, unknown> {
  return removeEmpty({
    ...(metadata ?? {}),
    cover: coverAsset
      ? {
          fileId: coverAsset.id,
          publicId: coverAsset.publicId,
          mimeType: coverAsset.mimeType,
          originalName: coverAsset.originalName,
          sizeBytes: coverAsset.sizeBytes
        }
      : undefined
  });
}

function removeEmpty(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== ""));
}
