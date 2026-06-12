import { useMemo } from 'react';

const rng = (seed) => {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
};

const build = (count, seed, fn) => {
  const r = rng(seed);
  return Array.from({ length: count }).map((_, i) => fn(r, i));
};

/**
 * Ambient profile effects layer. Renders only the enabled effects.
 * Pure CSS animations for performance. Sits behind content, no pointer events.
 */
export const ProfileEffects = ({ effects = {}, accent = '0 0% 100%' }) => {
  const mode = effects.particleMode || (effects.snow ? 'snow' : effects.rain ? 'rain' : effects.stars ? 'stars' : effects.particles ? 'sparkles' : 'none');
  const density = Math.round(Math.max(10, Math.min(90, Number(effects.particleDensity ?? 32) || 32)));
  const speed = Math.max(0.5, Math.min(2, Number(effects.particleSpeed ?? 1)));
  const intensity = Math.max(0.2, Math.min(1, Number(effects.effectIntensity ?? 0.7)));
  const stars = useMemo(
    () => build(Math.round(density * 1.25), 7, (r) => ({ left: r() * 100, top: r() * 100, size: 1 + r() * 2, dur: (2 + r() * 3) / speed, delay: r() * 4 })),
    [density, speed]
  );
  const particles = useMemo(
    () => build(density, 13, (r) => ({ left: r() * 100, top: 100 + r() * 12, size: 2 + r() * 5, dur: (8 + r() * 9) / speed, delay: r() * 9, drift: (r() - 0.5) * 90 })),
    [density, speed]
  );
  const snow = useMemo(
    () => build(Math.round(density * 1.15), 21, (r) => ({ left: r() * 100, size: 2 + r() * 4, dur: (6 + r() * 8) / speed, delay: r() * 8, vx: (r() - 0.5) * 80 })),
    [density, speed]
  );
  const rain = useMemo(
    () => build(Math.round(density * 1.8), 31, (r) => ({ left: r() * 100, len: 40 + r() * 60, dur: (0.6 + r() * 0.8) / speed, delay: r() * 2 })),
    [density, speed]
  );
  const shapes = useMemo(
    () => build(Math.round(density * 0.55), 43, (r) => ({ left: r() * 100, top: 20 + r() * 70, size: 10 + r() * 22, dur: (9 + r() * 12) / speed, delay: r() * 8, radius: r() > 0.5 ? '999px' : '8px', rotate: r() * 180 })),
    [density, speed]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {mode === 'stars' &&
        stars.map((s, i) => (
          <span key={`st${i}`} className="vy-star" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, opacity: intensity, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }} />
        ))}
      {(mode === 'sparkles' || mode === 'bubbles') &&
        particles.map((p, i) => (
          <span
            key={`pt${i}`}
            className={mode === 'bubbles' ? 'vy-bubble' : 'vy-particle'}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              '--vx': `${p.drift}px`,
              opacity: intensity,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              background: mode === 'bubbles' ? `hsl(${accent} / 0.08)` : `hsl(${accent} / 0.58)`,
              borderColor: `hsl(${accent} / 0.32)`,
            }}
          />
        ))}
      {mode === 'shapes' &&
        shapes.map((shape, i) => (
          <span
            key={`sh${i}`}
            className="vy-shape"
            style={{
              left: `${shape.left}%`,
              top: `${shape.top}%`,
              width: shape.size,
              height: shape.size,
              borderRadius: shape.radius,
              opacity: intensity * 0.75,
              '--rotate': `${shape.rotate}deg`,
              '--vx': `${(shape.rotate % 2 ? 1 : -1) * 28}px`,
              animationDuration: `${shape.dur}s`,
              animationDelay: `${shape.delay}s`,
              borderColor: `hsl(${accent} / 0.22)`,
              background: `hsl(${accent} / 0.045)`,
            }}
          />
        ))}
      {mode === 'snow' &&
        snow.map((s, i) => (
          <span key={`sn${i}`} className="vy-snow" style={{ left: `${s.left}%`, width: s.size, height: s.size, opacity: intensity, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`, '--vx': `${s.vx}px` }} />
        ))}
      {mode === 'rain' &&
        rain.map((r, i) => (
          <span key={`rn${i}`} className="vy-rain" style={{ left: `${r.left}%`, height: r.len, opacity: intensity, animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s` }} />
        ))}
    </div>
  );
};
