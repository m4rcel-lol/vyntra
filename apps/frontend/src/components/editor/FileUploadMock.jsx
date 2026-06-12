import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Music2, Upload, Link2, Loader2, X, Move } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { filesService } from '@/services/files.service';
import { cn } from '@/lib/utils';

const CROP_CONFIGS = {
  AVATAR: {
    title: 'Position avatar',
    description: 'Crop your profile picture to a clean square before it is compressed and saved.',
    outputWidth: 768,
    outputHeight: 768,
    zoomMax: 4,
  },
  BANNER: {
    title: 'Position banner',
    description: 'Crop your banner to a wide frame so it looks correct on profile cards and previews.',
    outputWidth: 1600,
    outputHeight: 600,
    zoomMax: 3,
  },
};

const DEFAULT_CROP = { zoom: 1, x: 0, y: 0 };

export const FileUploadMock = ({ value, onChange, label = 'Image', kind, aspect = 'aspect-video', allowUrl = false }) => {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [cropDraft, setCropDraft] = useState(null);
  const [crop, setCrop] = useState(DEFAULT_CROP);
  const uploadKind = kind || '';
  const hasExplicitKind = Boolean(uploadKind);
  const isVideo = hasExplicitKind ? uploadKind === 'BACKGROUND_VIDEO' : label.toLowerCase().includes('video');
  const isAudio = hasExplicitKind ? uploadKind === 'AUDIO' : label.toLowerCase().includes('audio') || label.toLowerCase().includes('music');
  const isCursor = hasExplicitKind ? uploadKind === 'CURSOR' : label.toLowerCase().includes('cursor');
  const accept = isVideo
    ? 'video/mp4,video/webm'
    : isAudio
      ? 'audio/*'
      : isCursor
        ? '.cur,image/png,image/gif'
        : 'image/jpeg,image/png,image/webp,image/gif';

  useEffect(() => {
    const objectUrl = cropDraft?.url;
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cropDraft?.url]);

  const uploadFile = async (file) => {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const res = await filesService.uploadAssetFile(file, label, uploadKind);
      onChange(res.url, res);
      toast.success(`${label} uploaded and compressed`);
      return true;
    } catch (e) {
      const message = e.message || `Could not upload ${label.toLowerCase()}`;
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    const cropConfig = CROP_CONFIGS[uploadKind];
    const isStaticImage = file.type.startsWith('image/') && file.type !== 'image/gif';

    if (cropConfig && isStaticImage) {
      setError('');
      setCrop(DEFAULT_CROP);
      setCropDraft({
        file,
        url: URL.createObjectURL(file),
        config: cropConfig,
      });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (cropConfig && file.type === 'image/gif') {
      toast.info(`${label} GIF uploaded without cropping so animation is preserved.`);
    }
    await uploadFile(file);
  };

  const applyCrop = async () => {
    if (!cropDraft) return;
    setError('');
    setLoading(true);
    try {
      const croppedFile = await cropImageToFile(cropDraft.file, cropDraft.url, cropDraft.config, crop);
      setLoading(false);
      const uploaded = await uploadFile(croppedFile);
      if (uploaded) setCropDraft(null);
    } catch (e) {
      const message = e.message || `Could not crop ${label.toLowerCase()}`;
      setLoading(false);
      setError(message);
      toast.error(message);
    }
  };

  const clearValue = () => {
    setError('');
    setUrl('');
    onChange('', null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const useRemoteUrl = () => {
    const nextUrl = url.trim();
    if (!nextUrl) return;
    setError('');
    onChange(nextUrl, null);
    setUrl('');
  };

  return (
    <div className="space-y-2">
      <div
        className={cn('relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-secondary/30', aspect)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (!loading) handleFile(e.dataTransfer.files?.[0]); }}
      >
        {value ? (
          <>
            {isVideo ? (
              <video src={value} className="h-full w-full object-cover" muted loop playsInline controls={false} />
            ) : isAudio ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/30 p-4 text-center text-muted-foreground">
                <Music2 className="h-7 w-7" />
                <span className="text-sm font-medium text-foreground">Audio uploaded</span>
                <span className="text-xs">Compressed local file</span>
              </div>
            ) : (
              <img
                src={value}
                alt={label}
                className="h-full w-full object-cover"
                onError={() => setError(`${label} preview failed to load. Save and reload, or upload the file again.`)}
              />
            )}
            <button type="button" onClick={clearValue} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground" aria-label="Remove">
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button type="button" disabled={loading} onClick={() => inputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 text-muted-foreground disabled:cursor-wait disabled:opacity-70">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            <span className="text-sm">Drop or click to upload {label.toLowerCase()}</span>
            <span className="inline-flex items-center gap-1 text-xs"><ImageIcon className="h-3 w-3" /> Compressed upload · local storage</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {allowUrl && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={`Paste a ${isVideo ? 'video' : isAudio ? 'media' : 'image'} URL`} className="pl-9" />
          </div>
          <Button type="button" variant="outline" onClick={useRemoteUrl} className="sm:w-auto">Use URL</Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <Dialog open={!!cropDraft} onOpenChange={(open) => { if (!open && !loading) setCropDraft(null); }}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto border-white/10 bg-zinc-950 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{cropDraft?.config.title || `Position ${label.toLowerCase()}`}</DialogTitle>
            <DialogDescription>{cropDraft?.config.description}</DialogDescription>
          </DialogHeader>

          {cropDraft && (
            <div className="space-y-5">
              <CropPreview draft={cropDraft} crop={crop} />

              <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <CropSlider
                  label={`Zoom · ${crop.zoom.toFixed(2)}x`}
                  value={crop.zoom}
                  min={1}
                  max={cropDraft.config.zoomMax}
                  step={0.01}
                  onChange={(zoom) => setCrop((current) => ({ ...current, zoom }))}
                />
                <CropSlider
                  label={`Horizontal · ${Math.round(crop.x)}%`}
                  value={crop.x}
                  min={-100}
                  max={100}
                  step={1}
                  onChange={(x) => setCrop((current) => ({ ...current, x }))}
                />
                <CropSlider
                  label={`Vertical · ${Math.round(crop.y)}%`}
                  value={crop.y}
                  min={-100}
                  max={100}
                  step={1}
                  onChange={(y) => setCrop((current) => ({ ...current, y }))}
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-zinc-400">
                <Move className="h-3.5 w-3.5" />
                Use zoom and position to keep the important part inside the frame.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCropDraft(null)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" onClick={applyCrop} disabled={loading || !cropDraft}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Save crop & upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function CropSlider({ label, value, min, max, step, onChange }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-zinc-300">{label}</span>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} />
    </label>
  );
}

function CropPreview({ draft, crop }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadImage(draft.url)
      .then((image) => {
        if (cancelled || !canvasRef.current) return;
        drawCroppedImage(canvasRef.current, image, draft.config, crop);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [crop.x, crop.y, crop.zoom, draft]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
      <canvas
        ref={canvasRef}
        width={draft.config.outputWidth}
        height={draft.config.outputHeight}
        className="block w-full"
        style={{ aspectRatio: `${draft.config.outputWidth} / ${draft.config.outputHeight}` }}
      />
    </div>
  );
}

async function cropImageToFile(originalFile, objectUrl, config, crop) {
  const image = await loadImage(objectUrl);
  const canvas = document.createElement('canvas');
  canvas.width = config.outputWidth;
  canvas.height = config.outputHeight;
  drawCroppedImage(canvas, image, config, crop);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.92);
  });
  if (!blob) throw new Error('Browser could not export the cropped image.');

  const baseName = String(originalFile.name || 'upload').replace(/\.[^/.]+$/, '').replace(/[^\w.-]+/g, '-').slice(0, 80) || 'upload';
  return new File([blob], `${baseName}-cropped.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}

function drawCroppedImage(canvas, image, config, crop) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not supported in this browser.');

  const source = getSourceCropRect(image, config, crop);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    config.outputWidth,
    config.outputHeight
  );
}

function getSourceCropRect(image, config, crop) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const targetAspect = config.outputWidth / config.outputHeight;
  const zoom = Math.max(1, Number(crop.zoom) || 1);
  let cropWidth = sourceWidth;
  let cropHeight = cropWidth / targetAspect;

  if (cropHeight > sourceHeight) {
    cropHeight = sourceHeight;
    cropWidth = cropHeight * targetAspect;
  }

  cropWidth /= zoom;
  cropHeight /= zoom;

  const maxPanX = Math.max(0, (sourceWidth - cropWidth) / 2);
  const maxPanY = Math.max(0, (sourceHeight - cropHeight) / 2);
  const centerX = sourceWidth / 2 + (clamp(Number(crop.x) || 0, -100, 100) / 100) * maxPanX;
  const centerY = sourceHeight / 2 + (clamp(Number(crop.y) || 0, -100, 100) / 100) * maxPanY;

  return {
    x: clamp(centerX - cropWidth / 2, 0, sourceWidth - cropWidth),
    y: clamp(centerY - cropHeight / 2, 0, sourceHeight - cropHeight),
    width: cropWidth,
    height: cropHeight,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image for cropping.'));
    image.src = src;
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
