import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { MobileProfileProvider, useMobileProfile } from '@/features/profile/mobile-profile-context';
import { ProfileSetupScreen } from '@/features/profile/profile-setup-screen';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <MobileProfileProvider>
        <AnimatedSplashOverlay />
        <AppContent />
      </MobileProfileProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { profile, state } = useMobileProfile();

  if (state === 'loading') return null;
  if (!profile) return <ProfileSetupScreen />;

  return <AppTabs />;
}
