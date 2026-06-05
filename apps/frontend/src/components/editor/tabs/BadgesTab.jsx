import { useProfileStore } from '@/stores/profile.store';
import { EditorSection } from '@/components/editor/Field';
import { Icon } from '@/components/common/Icon';

export const BadgesTab = () => {
  const badges = useProfileStore((s) => s.profile.badges);

  return (
    <EditorSection title="Badges" description="Badges are assigned by staff, role automation, and platform moderation.">
      <div className="space-y-3">
        {badges.length ? badges.map((b) => (
          <div key={b.id} className="rounded-xl border border-border bg-secondary/20 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `hsl(${b.color} / 0.16)`, color: `hsl(${b.color})`, boxShadow: b.glow ? `0 0 14px -2px hsl(${b.color} / 0.7)` : 'none' }}>
                <Icon name={b.icon} fallback="Star" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.label}</p>
                {b.tooltip && <p className="truncate text-xs text-muted-foreground">{b.tooltip}</p>}
              </div>
            </div>
          </div>
        )) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-5 text-center">
            <p className="text-sm font-medium">No badges assigned yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Verified, Staff, Owner, Moderator, and other trusted badges are managed by the platform.</p>
          </div>
        )}
      </div>
    </EditorSection>
  );
};
