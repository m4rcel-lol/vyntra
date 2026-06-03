import { useProfileStore } from '@/stores/profile.store';
import { EditorSection, Field } from '@/components/editor/Field';
import { Input } from '@/components/ui/input';
import { ToggleRow } from '@/components/editor/ToggleRow';
import { Youtube, Twitch, Music, Rss, Disc, LayoutGrid } from 'lucide-react';

export const EmbedsTab = () => {
  const embeds = useProfileStore((s) => s.profile.embeds);
  const setNested = useProfileStore((s) => s.setNested);
  return (
    <EditorSection title="Embeds" description="Pull in your content. YouTube renders live in the preview.">
      <Field label="YouTube video ID" hint="e.g. dQw4w9WgXcQ"><Input value={embeds.youtube} onChange={(e) => setNested('embeds', 'youtube', e.target.value)} placeholder="Video ID" /></Field>
      <Field label="Twitch channel"><Input value={embeds.twitch} onChange={(e) => setNested('embeds', 'twitch', e.target.value)} placeholder="channel name" /></Field>
      <Field label="Spotify ID"><Input value={embeds.spotify} onChange={(e) => setNested('embeds', 'spotify', e.target.value)} placeholder="playlist / track id" /></Field>
      <Field label="SoundCloud"><Input value={embeds.soundcloud} onChange={(e) => setNested('embeds', 'soundcloud', e.target.value)} placeholder="username" /></Field>
      <ToggleRow icon={Disc} label="Discord activity card" description="Show your live Discord status" checked={!!embeds.discordActivity} onCheckedChange={(v) => setNested('embeds', 'discordActivity', v)} />
      <ToggleRow icon={LayoutGrid} label="Portfolio card" description="Feature a work showcase block" checked={!!embeds.portfolioCard} onCheckedChange={(v) => setNested('embeds', 'portfolioCard', v)} />
    </EditorSection>
  );
};
