import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { today } from '@/lib/dates';
import { authenticate, canLock, unlockNow } from '@/lib/lock';
import { askNotify, planReminders } from '@/lib/notify';
import { setSettings, useSettings } from '@/lib/settings';
import { WHATS_NEW } from '@/lib/whatsNew';

import { ArchValluvar, Wrap } from './common';
import { Button, Choice, Icon, T, TextLink, timeLabel } from './parts';
import { useUI } from './ui';

/** Set when onboarding ends with "Coming from another phone?": the root layout then opens Backup. */
export const afterOnboarding = { restore: false };

export function Onboarding() {
  const { c, L, tamil } = useUI();
  const s = useSettings();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const finish = () => {
    setSettings({ onboarded: true, whatsNewSeen: WHATS_NEW.id, startedOn: s.startedOn || today() });
    unlockNow();
    planReminders().catch(() => {});
  };
  const next = async () => {
    if (step === 1) setStep(2);
    else if (step === 2) {
      if (s.reminderOn && !(await askNotify())) setSettings({ reminderOn: false });
      setStep(3);
    } else finish();
  };
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ height: 56, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12, alignItems: 'center' }}>
        {step < 3 ? <TextLink label={L.skip} color={c.ink3} onPress={() => setStep(3)} /> : null}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, alignItems: 'center', paddingBottom: 12 }}>
        <ArchValluvar state={step === 1 ? 'greeting' : step === 2 ? 'listening' : 'writing'} size={220} />
        <View style={{ height: 20 }} />
        {step === 1 ? (
          <>
            <T v="display">Kural Heart</T>
            <T v="title" color={c.primary}>
              {L.tagline}
            </T>
            <T v="body" color={c.ink2} style={{ textAlign: 'center', marginTop: 12 }}>
              {L.ob1b}
            </T>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' }}>
              <Choice label={L.leadEnglish} on={!s.tamil} onPress={() => setSettings({ tamil: false })} style={{ flex: 1 }} />
              <Choice label={L.leadTamil} on={s.tamil} onPress={() => setSettings({ tamil: true })} style={{ flex: 1 }} />
            </View>
          </>
        ) : step === 2 ? (
          <>
            <T v="headline" style={{ textAlign: 'center' }}>
              {L.ob2}
            </T>
            <T v="body" color={c.ink2} style={{ textAlign: 'center', marginTop: 8 }}>
              {L.ob2b}
            </T>
            <T v="display" style={{ marginTop: 16 }}>
              {s.reminderOn ? timeLabel(s.reminderMinutes) : '—'}
            </T>
            <Wrap style={{ justifyContent: 'center', marginTop: 12 }}>
              {[6 * 60 + 30, 7 * 60, 13 * 60, 20 * 60 + 30, 22 * 60].map((m) => (
                <Choice key={m} label={timeLabel(m)} on={s.reminderOn && s.reminderMinutes === m} onPress={() => setSettings({ reminderOn: true, reminderMinutes: m })} />
              ))}
              <Choice label={tamil ? 'வேண்டாம்' : 'No reminder'} on={!s.reminderOn} onPress={() => setSettings({ reminderOn: false })} />
            </Wrap>
          </>
        ) : (
          <>
            <T v="headline" style={{ textAlign: 'center' }}>
              {L.ob3}
            </T>
            <View style={{ height: 16 }} />
            {(
              [
                ['shield', L.p1],
                ['lock', L.p2],
                ['share', L.p3],
              ] as const
            ).map(([icon, text]) => (
              <View key={icon} style={{ flexDirection: 'row', gap: 14, paddingVertical: 8, alignSelf: 'stretch' }}>
                <Icon name={icon} color={c.primary} />
                <T v="body" color={c.ink2} style={{ flex: 1 }}>
                  {text}
                </T>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <View style={{ padding: 20, alignItems: 'center', gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`${step} / 3`}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? c.primary : c.surface3 }} />
          ))}
        </View>
        <Button label={step === 3 ? L.begin : L.next} onPress={next} style={{ alignSelf: 'stretch' }} />
        {step === 3 ? (
          <TextLink
            label={tamil ? 'வேறொரு அலைபேசியிலிருந்து வருகிறீர்களா? நாட்குறிப்பை மீட்டெடுங்கள்' : 'Coming from another phone? Bring your journal back'}
            onPress={() => {
              afterOnboarding.restore = true;
              finish();
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

export function LockScreen() {
  const { c, L } = useUI();
  const insets = useSafeAreaInsets();
  const unlock = async () => {
    if (!(await canLock())) unlockNow(); // the phone's own lock was removed; nothing to check against
    else if (await authenticate('Kural Heart')) unlockNow();
  };
  useEffect(() => {
    unlock();
     
  }, []);
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, alignItems: 'center' }}>
      <View style={{ flex: 1 }} />
      <ArchValluvar state="resting" />
      <T v="display" style={{ textAlign: 'center', marginTop: 20 }}>
        {L.locked}
      </T>
      <T v="body" color={c.ink2} style={{ textAlign: 'center', marginTop: 8, maxWidth: 300 }}>
        {L.lockedSub}
      </T>
      <View style={{ flex: 1 }} />
      <Button label={L.unlock} icon="lock" onPress={unlock} style={{ alignSelf: 'stretch' }} />
      <T v="labelM" color={c.ink3} style={{ marginTop: 12 }}>
        {L.lockedFoot}
      </T>
    </View>
  );
}
