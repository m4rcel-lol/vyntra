import { useCallback, useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

const sameLocation = (a, b) =>
  a.pathname === b.pathname && a.search === b.search && a.hash === b.hash;

export const useUnsavedRouteGuard = (when) => {
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    Boolean(when) && !sameLocation(currentLocation, nextLocation)
  );

  useEffect(() => {
    if (!when && blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker, when]);

  useEffect(() => {
    if (!when) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [when]);

  const proceed = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const reset = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return {
    isBlocked: blocker.state === 'blocked',
    nextLocation: blocker.state === 'blocked' ? blocker.location : null,
    proceed,
    reset,
  };
};
