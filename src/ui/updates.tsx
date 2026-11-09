import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';

import { setSettings, useSettings } from '@/lib/settings';
import { WHATS_NEW } from '@/lib/whatsNew';

import { Dialog } from './common';
import { Button, T, TextLink } from './parts';
import { useUI } from './ui';

// Over-the-air updates (eas update), as in Prompt Heart and Watch Heart. Only real builds receive them.
const enabled = Updates.isEnabled && !__DEV__;

/**
 * Offers a restart when an update has downloaded, and shows What's new once after it is installed (Heart Apps rule).
 * Updates are checked at launch and on every return to the app, only while "Update over the air" is on: expo-updates
 * itself never checks (checkAutomatically is NEVER in app.json), so the setting is the only switch.
 */
export function UpdatePrompt() {
  const s = useSettings();
  const { c, L, tamil } = useUI();
  const u = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (!enabled || !s.updateCheck) return;
    const check = () =>
      Updates.checkForUpdateAsync()
        .then((r) => (r.isAvailable ? Updates.fetchUpdateAsync() : undefined))
        .then(() => setDismissed(false))
        .catch(() => {});
    check();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') check();
    });
    return () => sub.remove();
  }, [s.updateCheck]);

  useEffect(() => {
    if (enabled && s.updateCheck && u.isUpdateAvailable && !u.isUpdatePending && !u.isDownloading) Updates.fetchUpdateAsync().catch(() => {});
  }, [u.isUpdateAvailable, u.isUpdatePending, u.isDownloading, s.updateCheck]);

  const seen = () => setSettings({ whatsNewSeen: WHATS_NEW.id });
  const showNews = s.whatsNewSeen < WHATS_NEW.id && !u.isUpdatePending;

  if (showNews) {
    return (
      <Dialog visible title={tamil ? 'புதியவை' : 'What’s new'} onClose={seen} actions={[{ label: tamil ? 'சரி' : 'Got it', onPress: seen }]}>
        {(tamil ? WHATS_NEW.ta : WHATS_NEW.en).map((line) => (
          <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
            <T v="bodyM" color={c.primary}>
              •
            </T>
            <T v="bodyM" color={c.ink2} style={{ flex: 1 }}>
              {line}
            </T>
          </View>
        ))}
      </Dialog>
    );
  }

  if (!enabled) return null;
  return (
    <Dialog visible={u.isUpdatePending && !dismissed} title={tamil ? 'புதிய பதிப்பு தயார்' : 'A new version is ready'} onClose={() => setDismissed(true)}>
      <T v="bodyM" color={c.ink2}>
        {tamil ? 'மீண்டும் தொடங்கினால் பயன்படுத்தலாம். உங்கள் பக்கங்கள் பாதுகாப்பாக உள்ளன.' : 'Restart to use it. Your pages are safe.'}
      </T>
      <Button
        label={tamil ? 'இப்போதே மீண்டும் தொடங்கு' : 'Restart now'}
        busy={restarting}
        onPress={() => {
          setRestarting(true);
          Updates.reloadAsync().catch(() => setRestarting(false));
        }}
      />
      <TextLink label={L.kbLater} color={c.ink3} onPress={() => setDismissed(true)} />
    </Dialog>
  );
}
