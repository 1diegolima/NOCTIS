import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { FloatingRestTimer } from '@/components/floating-rest-timer';
import { RestTimerProvider } from '@/contexts/rest-timer-context';
import { initDatabase } from '@/database/client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    try {
      initDatabase();
    } catch (e) {
      console.error('Erro ao inicializar banco de dados:', e);
    }
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <RestTimerProvider>
        <StatusBar style="light" />
        <AnimatedSplashOverlay />
        <AppTabs />
        <FloatingRestTimer />
      </RestTimerProvider>
    </ThemeProvider>
  );
}
