import { createHash } from "node:crypto";
import { createReadStream, type ReadStream } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { env } from "../env.js";
import { fail } from "./errors.js";

const commonAudioMimes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/vnd.wave",
  "audio/x-wav",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/flac",
  "audio/x-flac",
  "audio/aiff",
  "audio/x-aiff"
] as const;

const allowedMimeByKind: Record<string, readonly string[]> = {
  AVATAR: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  BANNER: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  BACKGROUND_IMAGE: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  BACKGROUND_VIDEO: ["video/mp4", "video/webm"],
  AUDIO: commonAudioMimes,
  CURSOR: ["image/png", "image/gif", "image/vnd.microsoft.icon", "image/x-icon"],
  BADGE_ICON: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  TEMPLATE_PREVIEW: ["image/jpeg", "image/png", "image/webp"],
  CUSTOM_ICON: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  METADATA_IMAGE: ["image/jpeg", "image/png", "image/webp"],
  MUSIC_COVER: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  OTHER: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", ...commonAudioMimes]
};

const imageMaxPixelsByKind: Record<string, number> = {
  AVATAR: 512,
  BADGE_ICON: 256,
  CUSTOM_ICON: 256,
  CURSOR: 128,
  TEMPLATE_PREVIEW: 1280,
  METADATA_IMAGE: 1200,
  MUSIC_COVER: 800,
  BANNER: 1920,
  BACKGROUND_IMAGE: 1920,
  OTHER: 1600
};

type CompressedUpload = {
  body: Buffer;
  mimeType: string;
  safeName: string;
  extension: string;
  checksum: string;
  metadata?: Record<string, unknown>;
  sidecars?: CompressedSidecar[];
};

export type CompressedSidecar = {
  kind: "MUSIC_COVER";
  body: Buffer;
  mimeType: string;
  safeName: string;
  extension: string;
  checksum: string;
  metadata?: Record<string, unknown>;
};

export async function ensureStorageDir(): Promise<void> {
  await mkdir(env.STORAGE_DIR, { recursive: true });
}

export function safeFilename(name: string): string {
  const clean = name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return clean || "upload.bin";
}

export async function detectUploadMime(buffer: Buffer, originalName = ""): Promise<string> {
  const detected = await fileTypeFromBuffer(buffer);
  if (looksLikeCursorFile(buffer, originalName)) {
    return "image/vnd.microsoft.icon";
  }
  if (!detected?.mime) {
    fail(400, "UNKNOWN_FILE_TYPE", "Could not verify the uploaded file type");
  }
  return detected.mime;
}

export function assertAllowedMime(kind: string, mimeType: string): void {
  const allowed = allowedMimeByKind[kind] ?? allowedMimeByKind.OTHER ?? [];
  if ((kind === "AUDIO" || kind === "OTHER") && mimeType.startsWith("audio/")) {
    return;
  }
  if (!allowed.includes(mimeType)) {
    fail(400, "UNSUPPORTED_FILE_TYPE", `File type ${mimeType} is not allowed for ${kind}`);
  }
}

export function assertAllowedSize(sizeBytes: number): void {
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    fail(413, "UPLOAD_TOO_LARGE", `Uploads are limited to ${env.MAX_UPLOAD_MB} MB before compression`);
  }
}

export function assertCompressedSize(sizeBytes: number): void {
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    fail(413, "COMPRESSED_UPLOAD_TOO_LARGE", `Compressed uploads must be ${env.MAX_UPLOAD_MB} MB or smaller`);
  }
}

export async function compressUpload(params: {
  kind: string;
  originalName: string;
  mimeType: string;
  body: Buffer;
}): Promise<CompressedUpload> {
  if (params.kind === "CURSOR") {
    return preserveCursorUpload(params);
  }
  if (params.mimeType.startsWith("image/")) {
    return compressImage(params);
  }
  if (params.mimeType.startsWith("video/")) {
    return compressVideo(params);
  }
  if (params.mimeType.startsWith("audio/")) {
    return compressAudio(params);
  }
  fail(400, "UNSUPPORTED_FILE_TYPE", "Unsupported file type");
}

function preserveCursorUpload(params: {
  originalName: string;
  mimeType: string;
  body: Buffer;
}): CompressedUpload {
  const extension = extensionForMime(params.mimeType);
  if (extension === "cur" && path.extname(params.originalName).toLowerCase() !== ".cur") {
    fail(400, "UNSUPPORTED_CURSOR_TYPE", "Custom cursor icon files must use the .cur extension");
  }
  if (!["png", "gif", "cur"].includes(extension)) {
    fail(400, "UNSUPPORTED_CURSOR_TYPE", "Custom cursors must be .cur, .gif, or .png files");
  }
  return compressedResult({
    body: params.body,
    mimeType: params.mimeType === "image/x-icon" ? "image/vnd.microsoft.icon" : params.mimeType,
    originalName: params.originalName,
    extension
  });
}

function looksLikeCursorFile(buffer: Buffer, originalName: string): boolean {
  const extension = path.extname(originalName).toLowerCase();
  if (extension !== ".cur") return false;
  if (buffer.length < 6) return false;
  return buffer.readUInt16LE(0) === 0 && buffer.readUInt16LE(2) === 2 && buffer.readUInt16LE(4) > 0;
}

export async function writeObject(params: {
  objectKey: string;
  body: Buffer;
}): Promise<void> {
  const objectPath = resolveObjectPath(params.objectKey);
  await mkdir(path.dirname(objectPath), { recursive: true });
  await writeFile(objectPath, params.body, { flag: "wx" });
}

export async function deleteObject(objectKey: string): Promise<void> {
  await rm(resolveObjectPath(objectKey), { force: true });
}

export async function getObjectStream(objectKey: string): Promise<{
  body: ReadStream;
  contentLength?: number;
}> {
  const objectPath = resolveObjectPath(objectKey);
  const fileStat = await stat(objectPath).catch(() => null);
  if (!fileStat?.isFile()) {
    fail(404, "FILE_NOT_FOUND", "File object could not be read");
  }
  return {
    body: createReadStream(objectPath),
    contentLength: fileStat.size
  };
}

function resolveObjectPath(objectKey: string): string {
  const root = path.resolve(env.STORAGE_DIR);
  const resolved = path.resolve(root, objectKey);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    fail(400, "INVALID_OBJECT_KEY", "Invalid storage object key");
  }
  return resolved;
}

async function compressImage(params: {
  kind: string;
  originalName: string;
  mimeType: string;
  body: Buffer;
}): Promise<CompressedUpload> {
  try {
    const max = imageMaxPixelsByKind[params.kind] ?? imageMaxPixelsByKind.OTHER ?? 1600;
    const animated = params.mimeType === "image/gif";
    const pipeline = sharp(params.body, { animated, limitInputPixels: 12000 * 12000 })
      .rotate()
      .resize({
        width: max,
        height: max,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: animated ? 68 : 78,
        effort: 5,
        smartSubsample: true
      });

    let compressed = await pipeline.toBuffer();
    if (compressed.length > params.body.length) {
      compressed = await sharp(params.body, { animated, limitInputPixels: 12000 * 12000 })
        .rotate()
        .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
        .webp({ quality: animated ? 56 : 62, effort: 6, smartSubsample: true })
        .toBuffer();
    }

    return compressedResult({
      body: compressed,
      mimeType: "image/webp",
      originalName: params.originalName,
      extension: "webp"
    });
  } catch (error: unknown) {
    fail(
      400,
      "IMAGE_COMPRESSION_FAILED",
      error instanceof Error
        ? `Uploaded image could not be processed: ${error.message}`
        : "Uploaded image could not be processed"
    );
  }
}

async function compressVideo(params: {
  kind: string;
  originalName: string;
  mimeType: string;
  body: Buffer;
}): Promise<CompressedUpload> {
  const input = await writeTemp(params.body, extensionForMime(params.mimeType));
  const output = `${input}.compressed.mp4`;
  try {
    await runFfmpeg([
      "-y",
      "-i",
      input,
      "-vf",
      "scale='min(1280,iw)':-2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-map_metadata",
      "-1",
      output
    ]);
    return compressedResult({
      body: await readFile(output),
      mimeType: "video/mp4",
      originalName: params.originalName,
      extension: "mp4"
    });
  } finally {
    await rm(path.dirname(input), { force: true, recursive: true });
  }
}

async function compressAudio(params: {
  kind: string;
  originalName: string;
  mimeType: string;
  body: Buffer;
}): Promise<CompressedUpload> {
  const input = await writeTemp(params.body, extensionForMime(params.mimeType));
  const output = `${input}.compressed.mp3`;
  try {
    const metadata = await readAudioMetadata(input, params.originalName);
    const cover = await extractAudioCover(input, params.originalName);
    await runFfmpeg([
      "-y",
      "-i",
      input,
      "-vn",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "128k",
      "-map_metadata",
      "-1",
      output
    ]);
    return {
      ...compressedResult({
        body: await readFile(output),
        mimeType: "audio/mpeg",
        originalName: params.originalName,
        extension: "mp3"
      }),
      metadata,
      sidecars: cover ? [cover] : []
    };
  } finally {
    await rm(path.dirname(input), { force: true, recursive: true });
  }
}

async function readAudioMetadata(input: string, originalName: string): Promise<Record<string, unknown>> {
  const probe = await runFfprobe(input).catch(() => null);
  const format = asRecord(probe?.format);
  const streams = Array.isArray(probe?.streams) ? probe.streams : [];
  const tags = {
    ...collectAudioStreamTags(streams),
    ...normalizeTagObject(asRecord(format.tags))
  };
  const duration = Number(format.duration);
  const title = cleanText(
    tagValue(tags, ["title", "track", "tracktitle"]) || titleFromFilename(originalName),
    120
  );
  const artist = cleanText(
    tagValue(tags, ["artist", "album_artist", "albumartist", "author", "composer", "performer"]),
    120
  );
  const album = cleanText(tagValue(tags, ["album"]), 120);
  return removeEmpty({
    title,
    artist,
    album,
    durationSeconds: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : undefined
  });
}

async function extractAudioCover(input: string, originalName: string): Promise<CompressedSidecar | null> {
  const output = path.join(path.dirname(input), "cover.png");
  const extracted = await tryRunFfmpeg([
    "-y",
    "-i",
    input,
    "-map",
    "0:v:0",
    "-frames:v",
    "1",
    "-update",
    "1",
    output
  ]);
  if (!extracted) return null;

  const rawCover = await readFile(output).catch(() => null);
  if (!rawCover?.length) return null;
  try {
    const body = await sharp(rawCover, { limitInputPixels: 12000 * 12000 })
      .rotate()
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78, effort: 5, smartSubsample: true })
      .toBuffer();
    const result = compressedResult({
      body,
      mimeType: "image/webp",
      originalName: `${titleFromFilename(originalName)}-cover.png`,
      extension: "webp"
    });
    return {
      kind: "MUSIC_COVER",
      ...result,
      metadata: { source: "audio-embedded-cover" }
    };
  } catch {
    return null;
  }
}

function compressedResult(params: {
  body: Buffer;
  mimeType: string;
  originalName: string;
  extension: string;
}): CompressedUpload {
  if (params.body.length === 0) {
    fail(400, "COMPRESSION_FAILED", "Uploaded file could not be compressed");
  }
  const baseName = safeFilename(params.originalName).replace(/\.[^.]+$/, "");
  const safeName = `${baseName || "upload"}.${params.extension}`;
  return {
    body: params.body,
    mimeType: params.mimeType,
    safeName,
    extension: params.extension,
    checksum: createHash("sha256").update(params.body).digest("hex")
  };
}

async function writeTemp(buffer: Buffer, extension: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "vyntra-upload-"));
  const filePath = path.join(dir, `input.${extension}`);
  await writeFile(filePath, buffer, { flag: "wx" });
  return filePath;
}

async function runFfmpeg(args: string[]): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
        if (stderr.length > 4000) stderr = stderr.slice(-4000);
      });
      child.on("error", () => {
        reject(new Error("ffmpeg is required for audio and video compression"));
      });
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg compression failed: ${stderr || `exit ${code}`}`));
      });
    });
  } catch (error: unknown) {
    fail(500, "MEDIA_COMPRESSION_FAILED", error instanceof Error ? error.message : "Media compression failed");
  }
}

async function tryRunFfmpeg(args: string[]): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "ignore"] });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

async function runFfprobe(input: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      input
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
      if (stdout.length > 500_000) stdout = stdout.slice(-500_000);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
      if (stderr.length > 4000) stderr = stderr.slice(-4000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `ffprobe exited with ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout || "{}"));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function titleFromFilename(name: string): string {
  return safeFilename(path.basename(name)).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Untitled track";
}

function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function tagValue(tags: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = tags[key.toLowerCase()];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function normalizeTagObject(tags: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(tags).map(([key, value]) => [key.toLowerCase(), value]));
}

function collectAudioStreamTags(streams: unknown[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const stream of streams) {
    const record = asRecord(stream);
    if (record.codec_type !== "audio") continue;
    Object.assign(result, normalizeTagObject(asRecord(record.tags)));
  }
  return result;
}

function removeEmpty(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== ""));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function extensionForMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/vnd.microsoft.icon": "cur",
    "image/x-icon": "cur",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/vnd.wave": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/aac": "aac",
    "audio/flac": "flac",
    "audio/x-flac": "flac",
    "audio/aiff": "aiff",
    "audio/x-aiff": "aiff"
  };
  return map[mimeType] ?? "bin";
}
