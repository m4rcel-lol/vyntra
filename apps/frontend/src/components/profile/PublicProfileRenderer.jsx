import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ProfileBackground } from './ProfileBackground';
import { ProfileEffects } from './ProfileEffects';
import { IntroScreen } from './IntroScreen';
import { MusicPlayer } from './MusicPlayer';
import { MinimalLayout } from './layouts';
import { cn } from '@/lib/utils';

/**
 * Full profile renderer used by the public page (full screen) and the editor
 * live preview (`preview`). Handles background, effects, click-to-enter intro,
 * background music and safely-simulated custom CSS / cursor.
 */
export const PublicProfileRenderer = ({ profile, preview = false, forceEntered = false, className }) => {
  const needIntro = !!profile.effects?.clickToEnter && !forceEntered;
  const [entered, setEntered] = useState(!needIntro);
  const [viaClick, setViaClick] = useState(false);

  // Keep intro state in sync when the profile config changes (editor toggles).
  useEffect(() => {
    setEntered(!needIntro);
    setViaClick(false);
  }, [needIntro, profile.id]);

  const cursor = profile.advanced?.customCursor ? `url(${profile.advanced.customCursor}), auto` : undefined;

  return (
    <div
      className={cn('relative isolate w-full overflow-hidden', preview ? 'h-full' : 'min-h-screen', className)}
      style={{ cursor }}
      data-testid="public-profile"
    >
      <ProfileBackground background={profile.background} />
      {/* readability vignette */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

      <AnimatePresence>
        {entered && profile.effects && (
          <ProfileEffects key="fx" effects={profile.effects} accent={profile.accent} />
        )}
      </AnimatePresence>

      <div
        className={cn(
          'relative z-10 flex w-full items-center justify-center px-3 sm:px-4',
          preview ? 'min-h-full py-8 sm:py-10' : 'min-h-screen py-12',
          !preview && profile.music?.enabled && profile.music?.src ? 'pb-36 sm:pb-16' : ''
        )}
      >
        {entered && <MinimalLayout profile={profile} />}
      </div>

      {entered && profile.music?.enabled && profile.music?.src && (
        <MusicPlayer
          music={profile.music}
          accent={profile.accent}
          autoStart={viaClick}
          className={cn(
            preview
              ? 'absolute bottom-3 left-1/2 z-20 -translate-x-1/2'
              : 'fixed bottom-3 left-1/2 z-20 -translate-x-1/2 sm:absolute sm:bottom-4 sm:left-4 sm:translate-x-0'
          )}
        />
      )}

      <AnimatePresence>
        {!entered && (
          <IntroScreen
            key="intro"
            profile={profile}
            onEnter={() => { setEntered(true); setViaClick(true); }}
          />
        )}
      </AnimatePresence>

      {/* Custom CSS is frontend-only and rendered only on the live page (not the editor). */}
      {!preview && profile.advanced?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: profile.advanced.customCss }} />
      )}
    </div>
  );
};
