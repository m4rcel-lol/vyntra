export function assetUrl(_request, publicId) {
    return `/api/files/public/${publicId}`;
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
//# sourceMappingURL=serialize.js.map