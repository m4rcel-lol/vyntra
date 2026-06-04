import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, Music2, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt = (seconds = 0) => {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Frosted background music player. Playback only starts after explicit user
 * interaction; progress is visual when no playable audio URL is attached.
 */
export const MusicPlayer = ({ music, accent = '0 0% 100%', autoStart = false, className }) => {
  const [playing, setPlaying] = useState(autoStart);
  const [progress, setProgress] = useState(music?.progress ?? 0);
  const [duration, setDuration] = useState(0);
  const [looping, setLooping] = useState(music?.loop !== false);
  const [volume, setVolume] = useState(music?.volume ?? 50);
  const audioRef = useRef(null);

  useEffect(() => {
    setLooping(music?.loop !== false);
    setProgress(0);
    setDuration(0);
  }, [music?.loop, music?.src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [playing, music?.src]);

  if (!music?.enabled || !music?.src) return null;

  return (
    <div className={cn('flex w-[calc(100vw-1rem)] max-w-sm items-center gap-2 rounded-2xl glass-strong border-gradient p-2.5 shadow-soft sm:w-96 sm:gap-3 sm:p-3', className)}>
      <audio
        ref={audioRef}
        src={music.src}
        loop={looping}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
            setProgress(Math.min(100, (audio.currentTime / audio.duration) * 100));
          }
        }}
        onEnded={(event) => {
          if (!looping) {
            setPlaying(false);
            return;
          }
          event.currentTarget.currentTime = 0;
          event.currentTarget.play().catch(() => setPlaying(false));
        }}
      />
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl sm:h-14 sm:w-14">
        {music.cover ? <img src={music.cover} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-secondary"><Music2 className="h-5 w-5" /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{music.title || 'Untitled track'}</p>
        <p className="truncate text-xs text-muted-foreground">{music.artist || 'Unknown artist'}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="w-7 text-[10px] tabular-nums text-muted-foreground sm:w-8">{fmt((progress / 100) * duration)}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `hsl(${accent})` }} />
          </div>
          <span className="w-7 text-right text-[10px] tabular-nums text-muted-foreground sm:w-8">{fmt(duration)}</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLooping((value) => !value)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border border-border transition-colors sm:h-9 sm:w-9',
              looping ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
            )}
            aria-label={looping ? 'Disable loop' : 'Enable loop'}
            title={looping ? 'Loop on' : 'Loop off'}
            data-testid="music-loop"
          >
            <Repeat className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 sm:h-9 sm:w-9"
            aria-label={playing ? 'Pause' : 'Play'}
            data-testid="music-toggle"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Volume2 className="h-3 w-3 text-muted-foreground" />
          <input
            type="range" min={0} max={100} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 w-12 cursor-pointer appearance-none rounded-full bg-secondary accent-white sm:w-16"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
};
