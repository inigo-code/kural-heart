import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { planNightly, runNightly } from '@/lib/background';
import { todayKural } from '@/lib/daily';
import { loadJournal, allEntries } from '@/lib/journal';
import { useLocked } from '@/lib/lock';
import { purgeMedia } from '@/lib/photos';
import { planReminders } from '@/lib/notify';
import { settings, useSettings } from '@/lib/settings';
import { LockScreen, Onboarding } from '@/ui/gate';
import { SplashOverlay } from '@/ui/splash';
import { ToastHost } from '@/ui/toast';
import { UIProvider, useUI } from '@/ui/ui';
import { UpdatePrompt } from '@/ui/updates';
import { refreshWidget } from '@/widget/widgets';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UIProvider>
        <Root />
      </UIProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { c } = useUI();
  const s = useSettings();
  const locked = useLocked();
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [nativeGone, setNativeGone] = useState(false);
  const endSplash = useCallback(() => setSplashDone(true), []);

  // The native splash hands straight over to Valluvar's (SplashOverlay), which stays until the journal is open.
  // Its time on screen counts only once Android's own splash (and its exit animation) has gone.
  useEffect(() => {
    // hideAsync resolves when the hide is asked for, not when it is done; wait until frames are drawing again
    // (two animation frames), then for the system splash's exit animation.
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => setNativeGone(true), 450))));
  }, []);

  // Keep the splash up until the journal is open, so the first screen is the real one.
  useEffect(() => {
    loadJournal()
      .catch(() => {})
      .finally(() => {
        setReady(true);
        const keep = new Set(allEntries().flatMap((e) => [...e.photos, ...e.audio, ...e.videos]));
        if (settings().avatar) keep.add(settings().avatar);
        try {
          purgeMedia(keep);
        } catch {}
        todayKural();
        refreshWidget();
        planReminders().catch(() => {});
        planNightly().catch(() => {});
        runNightly().catch(() => {});
      });
  }, []);

  // A new day while the app sits open, or coming back to it: the widget and reminders catch up.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') return;
      refreshWidget();
      planReminders().catch(() => {});
    });
    return () => sub.remove();
  }, []);

  // The reminder's Write button, or a tap on the reminder, opens today's page.
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!ready || !response) return;
    if (response.actionIdentifier === 'write') router.push('/write');
  }, [ready, response]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={c.isNight ? 'light' : 'dark'} />
      {!ready ? null : !s.onboarded ? (
        <Onboarding />
      ) : locked ? (
        <LockScreen />
      ) : (
        <>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: c.bg },
              animation: s.reduceMotion ? 'fade' : 'ios_from_right',
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="write" options={{ animation: s.reduceMotion ? 'fade' : 'slide_from_bottom' }} />
            <Stack.Screen name="award" options={{ animation: 'fade' }} />
          </Stack>
          {/* What's new and the update prompt wait for the splash: a dialog is its own window and would sit on top. */}
          {splashDone ? <UpdatePrompt /> : null}
        </>
      )}
      <ToastHost lift={s.onboarded ? 80 : 0} />
      {!splashDone ? <SplashOverlay ready={ready} shown={nativeGone} onDone={endSplash} /> : null}
    </View>
  );
}
