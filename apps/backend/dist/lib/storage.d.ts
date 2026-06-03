import { type ReadStream } from "node:fs";
type CompressedUpload = {
    body: Buffer;
    mimeType: string;
    safeName: string;
    extension: string;
    checksum: string;
};
export declare function ensureStorageDir(): Promise<void>;
export declare function safeFilename(name: string): string;
export declare function detectUploadMime(buffer: Buffer): Promise<string>;
export declare function assertAllowedMime(kind: string, mimeType: string): void;
export declare function assertAllowedSize(sizeBytes: number): void;
export declare function assertCompressedSize(sizeBytes: number): void;
export declare function compressUpload(params: {
    kind: string;
    originalName: string;
    mimeType: string;
    body: Buffer;
}): Promise<CompressedUpload>;
export declare function writeObject(params: {
    objectKey: string;
    body: Buffer;
}): Promise<void>;
export declare function deleteObject(objectKey: string): Promise<void>;
export declare function getObjectStream(objectKey: string): Promise<{
    body: ReadStream;
    contentLength?: number;
}>;
export {};
