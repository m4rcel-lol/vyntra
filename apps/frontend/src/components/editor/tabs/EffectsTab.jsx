import { Sparkles, Waves, CircleDot, Snowflake, CloudRain, Star, MousePointer2, DoorOpen, Wand2 } from 'lucide-react';
import { useProfileStore } from '@/stores/profile.store';
import { EditorSection, Field } from '@/components/editor/Field';
import { ToggleRow } from '@/components/editor/ToggleRow';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EFFECTS = [
  { key: 'glowBorder', label: 'Glow border', desc: 'Accent-tinted glow around the card', icon: Sparkles },
  { key: 'floating', label: 'Floating animation', desc: 'Gently float the card', icon: Waves },
  { key: 'particles', label: 'Particles', desc: 'Rising accent particles', icon: CircleDot },
  { key: 'snow', label: 'Snow', desc: 'Falling snowflakes', icon: Snowflake },
  { key: 'rain', label: 'Rain', desc: 'Falling rain streaks', icon: CloudRain },
  { key: 'stars', label: 'Stars', desc: 'Twinkling starfield', icon: Star },
  { key: 'cursorTrail', label: 'Cursor trail', desc: 'Trailing glow on the cursor', icon: MousePointer2 },
  { key: 'clickToEnter', label: 'Click-to-enter intro', desc: 'Cinematic entrance screen', icon: DoorOpen },
  { key: 'pageEntrance', label: 'Page entrance', desc: 'Animate elements on load', icon: Wand2 },
];

export const EffectsTab = () => {
  const effects = useProfileStore((s) => s.profile.effects);
  const toggleEffect = useProfileStore((s) => s.toggleEffect);
  const setEffect = useProfileStore((s) => s.setEffect);
  const particleMode = effects.particleMode || (effects.snow ? 'snow' : effects.rain ? 'rain' : effects.stars ? 'stars' : effects.particles ? 'sparkles' : 'none');
  const particleDensity = Number(effects.particleDensity ?? 32);
  const particleSpeed = Number(effects.particleSpeed ?? 1);
  const effectIntensity = Number(effects.effectIntensity ?? 0.7);

  const setParticleMode = (mode) => {
    setEffect('particleMode', mode);
    setEffect('particles', ['sparkles', 'bubbles', 'shapes'].includes(mode));
    setEffect('snow', mode === 'snow');
    setEffect('rain', mode === 'rain');
    setEffect('stars', mode === 'stars');
  };

  const checkedFor = (key) => {
    if (key === 'particles') return ['sparkles', 'bubbles', 'shapes'].includes(particleMode);
    if (key === 'snow') return particleMode === 'snow';
    if (key === 'rain') return particleMode === 'rain';
    if (key === 'stars') return particleMode === 'stars';
    return !!effects[key];
  };

  const toggleFor = (key) => {
    if (key === 'particles') {
      setParticleMode(['sparkles', 'bubbles', 'shapes'].includes(particleMode) ? 'none' : 'sparkles');
      return;
    }
    if (['snow', 'rain', 'stars'].includes(key)) {
      setParticleMode(particleMode === key ? 'none' : key);
      return;
    }
    toggleEffect(key);
  };

  return (
    <EditorSection title="Effects" description="Bring your profile to life. Combine effects for your vibe.">
      <div className="space-y-2.5">
        {EFFECTS.map((e) => (
          <ToggleRow key={e.key} icon={e.icon} label={e.label} description={e.desc} checked={checkedFor(e.key)} onCheckedChange={() => toggleFor(e.key)} testId={`fx-${e.key}`} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl border border-border bg-secondary/20 p-4">
        <Field label="Particle style">
          <Select value={particleMode} onValueChange={setParticleMode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="sparkles">Sparkles</SelectItem>
              <SelectItem value="bubbles">Bubbles</SelectItem>
              <SelectItem value="shapes">Floating shapes</SelectItem>
              <SelectItem value="stars">Stars</SelectItem>
              <SelectItem value="snow">Snow</SelectItem>
              <SelectItem value="rain">Rain</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label={`Particle amount · ${Number.isFinite(particleDensity) ? particleDensity : 32}`}>
          <Slider value={[Number.isFinite(particleDensity) ? particleDensity : 32]} min={10} max={90} step={1} onValueChange={([v]) => setEffect('particleDensity', v)} />
        </Field>

        <Field label={`Particle speed · ${(Number.isFinite(particleSpeed) ? particleSpeed : 1).toFixed(1)}x`}>
          <Slider value={[Number.isFinite(particleSpeed) ? particleSpeed : 1]} min={0.5} max={2} step={0.1} onValueChange={([v]) => setEffect('particleSpeed', v)} />
        </Field>

        <Field label={`Effect intensity · ${Math.round((Number.isFinite(effectIntensity) ? effectIntensity : 0.7) * 100)}%`}>
          <Slider value={[Number.isFinite(effectIntensity) ? effectIntensity : 0.7]} min={0.2} max={1} step={0.05} onValueChange={([v]) => setEffect('effectIntensity', v)} />
        </Field>

        <Field label="Cursor trail">
          <Select
            value={effects.cursorTrail ? (effects.cursorTrailMode || 'glow') : 'none'}
            onValueChange={(mode) => {
              setEffect('cursorTrailMode', mode);
              setEffect('cursorTrail', mode !== 'none');
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="glow">Glow</SelectItem>
              <SelectItem value="stars">Stars</SelectItem>
              <SelectItem value="dots">Dots</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Profile entrance">
          <Select value={effects.pageEntrance ? (effects.entranceAnimation || 'scale') : 'none'} onValueChange={(mode) => { setEffect('entranceAnimation', mode); setEffect('pageEntrance', mode !== 'none'); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="fade">Fade</SelectItem>
              <SelectItem value="scale">Scale</SelectItem>
              <SelectItem value="slide">Slide</SelectItem>
              <SelectItem value="blur">Blur</SelectItem>
              <SelectItem value="terminal">Terminal</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Hover animation">
          <Select value={effects.floating ? (effects.hoverAnimation || 'lift') : 'none'} onValueChange={(mode) => { setEffect('hoverAnimation', mode); setEffect('floating', mode !== 'none'); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="lift">Lift</SelectItem>
              <SelectItem value="glow">Glow</SelectItem>
              <SelectItem value="scale">Scale</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Background animation">
          <Select value={effects.backgroundAnimation || 'none'} onValueChange={(mode) => setEffect('backgroundAnimation', mode)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="gradient">Slow gradient</SelectItem>
              <SelectItem value="float">Floating media</SelectItem>
              <SelectItem value="pulse">Soft pulse</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </EditorSection>
  );
};
