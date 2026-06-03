import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileUp, Image, Music, Trash2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { filesService } from '@/services/files.service';

const KINDS = [
  'AVATAR',
  'BANNER',
  'BACKGROUND_IMAGE',
  'BACKGROUND_VIDEO',
  'AUDIO',
  'CURSOR',
  'BADGE_ICON',
  'TEMPLATE_PREVIEW',
  'CUSTOM_ICON',
  'METADATA_IMAGE',
  'OTHER',
];

export default function FilesPage() {
  const inputRef = useRef(null);
  const [kind, setKind] = useState('OTHER');
  const [uploading, setUploading] = useState(false);
  const { data: files = [], refetch } = useQuery({ queryKey: ['files'], queryFn: filesService.listFiles });

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await filesService.uploadFile(file, kind);
      toast.success('File uploaded and compressed');
      await refetch();
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout title="Files">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight">File manager</h2>
        <p className="text-sm text-muted-foreground">Upload profile assets to local storage. The backend validates and compresses uploads before saving.</p>
      </div>

      <GlassCard className="mb-6 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium">Asset type</p>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((item) => <SelectItem key={item} value={item}>{item.replaceAll('_', ' ').toLowerCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <input ref={inputRef} type="file" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            <FileUp className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload file'}
          </Button>
        </div>
      </GlassCard>

      {files.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <GlassCard key={file.id} className="overflow-hidden">
              <div className="flex h-44 items-center justify-center bg-secondary/30">
                {file.mimeType?.startsWith('image/') ? <img src={file.url} alt="" className="h-full w-full object-cover" /> : <FileIcon mime={file.mimeType} />}
              </div>
              <div className="p-5">
                <p className="truncate font-medium">{file.originalName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{file.kind} · {formatBytes(file.sizeBytes)}</p>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" className="flex-1"><a href={file.url} target="_blank" rel="noreferrer">Open</a></Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => filesService.deleteFile(file.id).then(refetch).catch((e) => toast.error(e.message || 'Delete failed'))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-10 text-center text-muted-foreground">No files uploaded yet.</GlassCard>
      )}
    </DashboardLayout>
  );
}

const FileIcon = ({ mime }) => {
  if (mime?.startsWith('video/')) return <Video className="h-12 w-12 text-muted-foreground" />;
  if (mime?.startsWith('audio/')) return <Music className="h-12 w-12 text-muted-foreground" />;
  return <Image className="h-12 w-12 text-muted-foreground" />;
};

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
