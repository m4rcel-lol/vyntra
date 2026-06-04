export function requestOrigin(request) {
    const proto = firstHeader(request.headers["x-forwarded-proto"]) ?? request.protocol;
    const host = firstHeader(request.headers["x-forwarded-host"]) ?? request.headers.host ?? "localhost";
    return `${proto}://${host}`;
}
export function assetUrl(request, publicId) {
    return `${requestOrigin(request)}/api/files/public/${publicId}`;
}
export function serializeAsset(request, asset) {
    if (!asset || asset.deletedAt)
        return null;
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
function serializeAssetMetadata(request, metadata) {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
        return {};
    const result = { ...metadata };
    if (result.cover && typeof result.cover === "object" && !Array.isArray(result.cover)) {
        const cover = { ...result.cover };
        if (typeof cover.publicId === "string") {
            cover.url = assetUrl(request, cover.publicId);
        }
        result.cover = cover;
    }
    return result;
}
function firstHeader(value) {
    if (Array.isArray(value))
        return value[0];
    return value;
}
//# sourceMappingURL=serialize.js.map