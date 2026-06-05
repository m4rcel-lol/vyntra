import { useRef, useState } from 'react';
import { ImageIcon, Music2, Upload, Link2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { filesService } from '@/services/files.service';
import { cn } from '@/lib/utils';

export const FileUploadMock = ({ value, onChange, label = 'Image', kind, aspect = 'aspect-video', allowUrl = false }) => {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const uploadKind = kind || '';
  const hasExplicitKind = Boolean(uploadKind);
  const isVideo = hasExplicitKind ? uploadKind === 'BACKGROUND_VIDEO' : label.toLowerCase().includes('video');
  const isAudio = hasExplicitKind ? uploadKind === 'AUDIO' : label.toLowerCase().includes('audio') || label.toLowerCase().includes('music');
  const accept = isVideo
    ? 'video/mp4,video/webm'
    : isAudio
      ? 'audio/*'
      : 'image/jpeg,image/png,image/webp,image/gif';

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const res = await filesService.uploadAssetFile(file, label, uploadKind);
      onChange(res.url, res);
      toast.success(`${label} uploaded and compressed`);
    } catch (e) {
      const message = e.message || `Could not upload ${label.toLowerCase()}`;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
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
    </div>
  );
};
