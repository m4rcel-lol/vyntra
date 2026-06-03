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
  const stars = useMemo(
    () => build(46, 7, (r) => ({ left: r() * 100, top: r() * 100, size: 1 + r() * 2, dur: 2 + r() * 3, delay: r() * 4 })),
    []
  );
  const particles = useMemo(
    () => build(26, 13, (r) => ({ left: r() * 100, size: 2 + r() * 4, dur: 9 + r() * 10, delay: r() * 10 })),
    []
  );
  const snow = useMemo(
    () => build(40, 21, (r) => ({ left: r() * 100, size: 2 + r() * 4, dur: 6 + r() * 8, delay: r() * 8, vx: (r() - 0.5) * 80 })),
    []
  );
  const rain = useMemo(
    () => build(60, 31, (r) => ({ left: r() * 100, len: 40 + r() * 60, dur: 0.6 + r() * 0.8, delay: r() * 2 })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {effects.stars &&
        stars.map((s, i) => (
          <span key={`st${i}`} className="vy-star" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }} />
        ))}
      {effects.particles &&
        particles.map((p, i) => (
          <span key={`pt${i}`} className="vy-particle" style={{ left: `${p.left}%`, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, background: `hsl(${accent} / 0.5)` }} />
        ))}
      {effects.snow &&
        snow.map((s, i) => (
          <span key={`sn${i}`} className="vy-snow" style={{ left: `${s.left}%`, width: s.size, height: s.size, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`, '--vx': `${s.vx}px` }} />
        ))}
      {effects.rain &&
        rain.map((r, i) => (
          <span key={`rn${i}`} className="vy-rain" style={{ left: `${r.left}%`, height: r.len, animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s` }} />
        ))}
    </div>
  );
};
