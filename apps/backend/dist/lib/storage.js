import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { env } from "../env.js";
import { fail } from "./errors.js";
const allowedMimeByKind = {
    AVATAR: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    BANNER: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    BACKGROUND_IMAGE: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    BACKGROUND_VIDEO: ["video/mp4", "video/webm"],
    AUDIO: ["audio/mpeg", "audio/ogg", "audio/wav", "audio/vnd.wave", "audio/webm"],
    CURSOR: ["image/png", "image/webp", "image/gif"],
    BADGE_ICON: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    TEMPLATE_PREVIEW: ["image/jpeg", "image/png", "image/webp"],
    CUSTOM_ICON: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    METADATA_IMAGE: ["image/jpeg", "image/png", "image/webp"],
    OTHER: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "audio/mpeg", "audio/ogg", "audio/vnd.wave"]
};
const imageMaxPixelsByKind = {
    AVATAR: 512,
    BADGE_ICON: 256,
    CUSTOM_ICON: 256,
    CURSOR: 128,
    TEMPLATE_PREVIEW: 1280,
    METADATA_IMAGE: 1200,
    BANNER: 1920,
    BACKGROUND_IMAGE: 1920,
    OTHER: 1600
};
export async function ensureStorageDir() {
    await mkdir(env.STORAGE_DIR, { recursive: true });
}
export function safeFilename(name) {
    const clean = name
        .normalize("NFKD")
        .replace(/[^\w.\-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 120);
    return clean || "upload.bin";
}
export async function detectUploadMime(buffer) {
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected?.mime) {
        fail(400, "UNKNOWN_FILE_TYPE", "Could not verify the uploaded file type");
    }
    return detected.mime;
}
export function assertAllowedMime(kind, mimeType) {
    const allowed = allowedMimeByKind[kind] ?? allowedMimeByKind.OTHER ?? [];
    if (!allowed.includes(mimeType)) {
        fail(400, "UNSUPPORTED_FILE_TYPE", `File type ${mimeType} is not allowed for ${kind}`);
    }
}
export function assertAllowedSize(sizeBytes) {
    const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
    if (sizeBytes > maxBytes) {
        fail(413, "UPLOAD_TOO_LARGE", `Uploads are limited to ${env.MAX_UPLOAD_MB} MB before compression`);
    }
}
export function assertCompressedSize(sizeBytes) {
    const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
    if (sizeBytes > maxBytes) {
        fail(413, "COMPRESSED_UPLOAD_TOO_LARGE", `Compressed uploads must be ${env.MAX_UPLOAD_MB} MB or smaller`);
    }
}
export async function compressUpload(params) {
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
export async function writeObject(params) {
    const objectPath = resolveObjectPath(params.objectKey);
    await mkdir(path.dirname(objectPath), { recursive: true });
    await writeFile(objectPath, params.body, { flag: "wx" });
}
export async function deleteObject(objectKey) {
    await rm(resolveObjectPath(objectKey), { force: true });
}
export async function getObjectStream(objectKey) {
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
function resolveObjectPath(objectKey) {
    const root = path.resolve(env.STORAGE_DIR);
    const resolved = path.resolve(root, objectKey);
    if (!resolved.startsWith(`${root}${path.sep}`)) {
        fail(400, "INVALID_OBJECT_KEY", "Invalid storage object key");
    }
    return resolved;
}
async function compressImage(params) {
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
}
async function compressVideo(params) {
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
    }
    finally {
        await rm(path.dirname(input), { force: true, recursive: true });
    }
}
async function compressAudio(params) {
    const input = await writeTemp(params.body, extensionForMime(params.mimeType));
    const output = `${input}.compressed.mp3`;
    try {
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
        return compressedResult({
            body: await readFile(output),
            mimeType: "audio/mpeg",
            originalName: params.originalName,
            extension: "mp3"
        });
    }
    finally {
        await rm(path.dirname(input), { force: true, recursive: true });
    }
}
function compressedResult(params) {
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
async function writeTemp(buffer, extension) {
    const dir = await mkdtemp(path.join(tmpdir(), "vyntra-upload-"));
    const filePath = path.join(dir, `input.${extension}`);
    await writeFile(filePath, buffer, { flag: "wx" });
    return filePath;
}
async function runFfmpeg(args) {
    try {
        await new Promise((resolve, reject) => {
            const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
            let stderr = "";
            child.stderr.on("data", (chunk) => {
                stderr += chunk.toString("utf8");
                if (stderr.length > 4000)
                    stderr = stderr.slice(-4000);
            });
            child.on("error", () => {
                reject(new Error("ffmpeg is required for audio and video compression"));
            });
            child.on("close", (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`ffmpeg compression failed: ${stderr || `exit ${code}`}`));
            });
        });
    }
    catch (error) {
        fail(500, "MEDIA_COMPRESSION_FAILED", error instanceof Error ? error.message : "Media compression failed");
    }
}
function extensionForMime(mimeType) {
    const map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "audio/mpeg": "mp3",
        "audio/ogg": "ogg",
        "audio/wav": "wav",
        "audio/vnd.wave": "wav",
        "audio/webm": "webm"
    };
    return map[mimeType] ?? "bin";
}
//# sourceMappingURL=storage.js.map