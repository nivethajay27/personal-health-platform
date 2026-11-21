import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  loadMobileProfile,
  saveMobileProfile,
  type MobileProfile,
} from '@/storage/mobile-database';

type ProfileState = 'error' | 'loading' | 'ready';

type MobileProfileContextValue = {
  profile: MobileProfile | null;
  saveProfile: (profile: Omit<MobileProfile, 'updatedAt'>) => Promise<void>;
  state: ProfileState;
};

const MobileProfileContext = createContext<MobileProfileContextValue | null>(null);

export function MobileProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MobileProfile | null>(null);
  const [state, setState] = useState<ProfileState>('loading');

  useEffect(() => {
    let isMounted = true;

    void loadMobileProfile()
      .then((savedProfile) => {
        if (!isMounted) return;

        setProfile(savedProfile);
        setState('ready');
      })
      .catch(() => {
        if (isMounted) setState('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveProfile(nextProfile: Omit<MobileProfile, 'updatedAt'>) {
    await saveMobileProfile(nextProfile);
    setProfile({ ...nextProfile, updatedAt: new Date().toISOString() });
    setState('ready');
  }

  const value = useMemo(
    () => ({ profile, saveProfile, state }),
    [profile, state],
  );

  return <MobileProfileContext.Provider value={value}>{children}</MobileProfileContext.Provider>;
}

export function useMobileProfile() {
  const context = useContext(MobileProfileContext);

  if (!context) {
    throw new Error('useMobileProfile must be used within MobileProfileProvider');
  }

  return context;
}
