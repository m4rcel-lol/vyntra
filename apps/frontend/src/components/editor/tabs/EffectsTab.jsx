import { Sparkles, Waves, CircleDot, Snowflake, CloudRain, Star, MousePointer2, DoorOpen, Wand2 } from 'lucide-react';
import { useProfileStore } from '@/stores/profile.store';
import { EditorSection } from '@/components/editor/Field';
import { ToggleRow } from '@/components/editor/ToggleRow';

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
  return (
    <EditorSection title="Effects" description="Bring your profile to life. Combine effects for your vibe.">
      <div className="space-y-2.5">
        {EFFECTS.map((e) => (
          <ToggleRow key={e.key} icon={e.icon} label={e.label} description={e.desc} checked={!!effects[e.key]} onCheckedChange={() => toggleEffect(e.key)} testId={`fx-${e.key}`} />
        ))}
      </div>
    </EditorSection>
  );
};
