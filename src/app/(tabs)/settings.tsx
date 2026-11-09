import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Directory } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentThread } from '@/lib/actions';
import { exportTextTo } from '@/lib/backup';
import { deleteDeviceKey } from '@/lib/crypto';
import { disconnectDrive } from '@/lib/drive';
import { deleteAllEntries, useJournal } from '@/lib/journal';
import { authenticate, awayFor, canLock, unlockNow } from '@/lib/lock';
import { askNotify, canNotify, planReminders } from '@/lib/notify';
import { deleteAllPhotos } from '@/lib/photos';
import { askLocation } from '@/lib/places';
import { setSettings, useSettings, wipeSettings } from '@/lib/settings';
import { BUILT_IN } from '@/lib/speak';
import { pronounce, scholarly } from '@/lib/translit';
import type { Accent, Settings } from '@/lib/settings';
import { english, kural } from '@/lib/pack';
import { today } from '@/lib/dates';
import { Avatar, Dialog, Field, lastLabel } from '@/ui/common';
import { OptionSheet, VoiceSheet } from '@/ui/options';
import { Choice, Group, Icon, Row, SectionLabel, SwitchRow, T, TextLink, Button, timeLabel } from '@/ui/parts';
import { ACCENT_SWATCH } from '@/ui/theme';
import { toast } from '@/ui/toast';
import { useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';
import { refreshWidget } from '@/widget/widgets';

export default function SettingsScreen() {
  const { c, L, tr, tamil } = useUI();
  const s = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries } = useJournal();
  const [wipe, setWipe] = useState(false);
  const [typed, setTyped] = useState('');
  const [lockMissing, setLockMissing] = useState(false);
  const [notifyOk, setNotifyOk] = useState(true);
  const [sheet, setSheet] = useState<null | 'theme' | 'english' | 'daily' | 'speed' | 'voiceTa' | 'voiceEn' | 'spelling'>(null);
  const sampleK = kural(s.dayLog[today()] ?? 391);
  const translatorName = (t: string) => (t === 'pope' ? 'G. U. Pope, 1886' : t === 'popeprose' ? tr('G. U. Pope, prose', 'போப், உரைநடை') : 'V. V. S. Aiyar, 1916');
  const voiceSub = (id: string) => (id ? tr('Your choice', 'நீங்கள் தேர்ந்தது') : tr('The best one on this phone', 'இந்த அலைபேசியின் சிறந்த குரல்'));
  const speedName = (r: number) => (r <= 0.75 ? tr('Slow', 'மெதுவாக') : r < 1 ? tr('Gentle', 'நிதானமாக') : tr('Normal', 'இயல்பாக'));
  const ways = [s.driveOn ? 'Google Drive' : null, s.hasPassphrase && s.backupFolder ? tr('a folder', 'ஒரு கோப்புறை') : null].filter(Boolean);
  const backupSummary = ways.length ? `${ways.join(' + ')} · ${lastLabel(Math.max(s.lastBackup, s.lastDriveSync), L, tamil)}` : L.notSet;
  const thread = currentThread();

  useEffect(() => {
    const check = () => canNotify().then(setNotifyOk);
    check();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => sub.remove();
  }, []);

  const set = (p: Partial<Settings>) => setSettings(p);
  const themeLabel = s.theme === 'auto' ? L.themeAuto : s.theme === 'ivory' ? L.themeIvory : L.themeMidnight;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 28 }}>
      <T v="display" style={{ marginLeft: 4 }}>
        {L.settings}
      </T>
      <Pressable
        onPress={() => router.push('/profile')}
        style={{ marginTop: 12, borderRadius: 24, backgroundColor: c.surface, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar size={56} />
        <View style={{ flex: 1 }}>
          <T v="title">{s.name || tr('Add your name', 'உங்கள் பெயரைச் சேர்க்கவும்')}</T>
          <T v="labelM" color={c.ink3}>
            {`${s.journalTitle || tr('My Kural journal', 'என் குறள் நாட்குறிப்பு')} · ${L.pages(entries.length)} · ${tr(`${thread.days}-day thread`, `${thread.days} நாள் தொடர்`)}`}
          </T>
        </View>
        <Icon name="chevron" color={c.ink3} size={20} />
      </Pressable>

      <SectionLabel>{L.sLook}</SectionLabel>
      <Group>
        <Row
          title={L.sLang}
          divider={false}
          trailing={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Choice label="EN" on={!s.tamil} onPress={() => (set({ tamil: false }), refreshWidget())} />
              <Choice label="தமிழ்" on={s.tamil} onPress={() => (set({ tamil: true }), refreshWidget())} />
            </View>
          }
        />
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ height: 1, backgroundColor: c.line, marginBottom: 12 }} />
          <T v="body">{tr('Text size', 'எழுத்து அளவு')}</T>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {(
              [
                [90, tr('Small', 'சிறியது')],
                [100, tr('Default', 'இயல்பு')],
                [115, tr('Large', 'பெரியது')],
                [130, tr('Larger', 'மிகப் பெரியது')],
              ] as const
            ).map(([pct, label]) => (
              <Choice key={pct} label={label} on={s.textScale === pct} onPress={() => set({ textScale: pct })} style={{ flex: 1, paddingHorizontal: 6 }} />
            ))}
          </View>
          <T v="body" style={{ marginTop: 14 }}>
            {tr('Colour', 'வண்ணம்')}
          </T>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
            {(
              [
                ['clay', tr('Clay', 'களிமண்')],
                ['indigo', tr('Indigo', 'நீலம்')],
                ['green', tr('Leaf green', 'இலைப் பச்சை')],
                ['rose', tr('Rose', 'ரோஜா')],
              ] as [Accent, string][]
            ).map(([id, name]) => (
              <Pressable
                key={id}
                onPress={() => set({ accent: id })}
                accessibilityRole="radio"
                accessibilityState={{ checked: s.accent === id }}
                accessibilityLabel={name}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ACCENT_SWATCH[id], borderWidth: s.accent === id ? 3 : 0, borderColor: c.ink }}
              />
            ))}
          </View>
        </View>
        <Row title={L.sTheme} sub={themeLabel} onPress={() => setSheet('theme')} />
        <SwitchRow title={L.sMotion} value={s.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
      </Group>

      <SectionLabel>{tr('Couplets', 'குறள்கள்')}</SectionLabel>
      <Group>
        <Row title={tr('English under each couplet', 'குறளின் கீழ் ஆங்கிலம்')} sub={translatorName(s.translation)} divider={false} onPress={() => setSheet('english')} />
        <SwitchRow
          title={tr('Pronunciation', 'உச்சரிப்பு')}
          sub={tr('Each couplet spelled out in English letters, for reading it aloud', 'ஒவ்வொரு குறளும் ஆங்கில எழுத்துகளில், உரக்கப் படிக்க')}
          value={s.pronounce}
          onChange={(v) => set({ pronounce: v })}
        />
        {s.pronounce ? (
          <Row
            title={tr('Pronunciation style', 'உச்சரிப்பு முறை')}
            sub={s.pronounceStyle === 'scholarly' ? tr('Scholarly · ISO 15919', 'அறிஞர் முறை · ISO 15919') : tr('Simple English sounds', 'எளிய ஆங்கில ஒலிகள்')}
            onPress={() => setSheet('spelling')}
          />
        ) : null}
        <Row
          title={tr('How today’s couplet is chosen', 'இன்றைய குறள் தேர்வு')}
          sub={s.promptMode === 'random' ? tr('Any couplet, at random', 'ஏதேனும் ஒரு குறள்') : tr('A welcome week, then in turn', 'வரவேற்பு வாரம், பிறகு வரிசையாக')}
          onPress={() => setSheet('daily')}
        />
        <Row title={tr('Saved couplets', 'சேமித்த குறள்கள்')} sub={String(s.saved.length)} onPress={() => router.navigate({ pathname: '/kural', params: { from: 'settings', show: 'saved' } })} />
      </Group>

      <SectionLabel>{tr('Listening', 'கேட்டல்')}</SectionLabel>
      <Group>
        <Row
          title={tr('Tamil voice', 'தமிழ்க் குரல்')}
          sub={!s.voiceTa || s.voiceTa === BUILT_IN ? tr('Kural Heart voice · natural, offline', 'Kural Heart குரல் · இயல்பானது, இணையம் தேவையில்லை') : tr('A phone voice', 'அலைபேசிக் குரல்')}
          divider={false}
          onPress={() => setSheet('voiceTa')}
        />
        <SwitchRow title={tr('Then read the English', 'பிறகு ஆங்கிலத்தையும் படி')} value={s.readEnglish} onChange={(v) => set({ readEnglish: v })} />
        {s.readEnglish ? <Row title={tr('English voice', 'ஆங்கிலக் குரல்')} sub={voiceSub(s.voiceEn)} onPress={() => setSheet('voiceEn')} /> : null}
        <Row title={tr('Speed', 'வேகம்')} sub={speedName(s.speechRate)} onPress={() => setSheet('speed')} />
      </Group>

      <SectionLabel>{L.sDaily}</SectionLabel>
      <Group>
        <SwitchRow
          title={L.sRem}
          divider={false}
          value={s.reminderOn}
          onChange={async (on) => {
            if (on && !(await canNotify()) && !(await askNotify())) {
              setNotifyOk(false);
              set({ reminderOn: true });
              return;
            }
            set({ reminderOn: on });
            setNotifyOk(await canNotify());
            planReminders().catch(() => {});
          }}
        />
        {s.reminderOn ? (
          <Row
            title={L.sRemTime}
            sub={timeLabel(s.reminderMinutes)}
            onPress={() => {
              const at = new Date();
              at.setHours(Math.floor(s.reminderMinutes / 60), s.reminderMinutes % 60, 0, 0);
              DateTimePickerAndroid.open({
                value: at,
                mode: 'time',
                onChange: (ev, d) => {
                  if (ev.type === 'set' && d) {
                    set({ reminderMinutes: d.getHours() * 60 + d.getMinutes() });
                    planReminders().catch(() => {});
                  }
                },
              });
            }}
          />
        ) : null}
      </Group>
      {s.reminderOn && !notifyOk ? (
        <View style={{ marginTop: 12, borderRadius: 24, backgroundColor: c.surface, padding: 16, alignItems: 'center' }}>
          <Valluvar state="listening" size={160} />
          <T v="headline" style={{ textAlign: 'center' }}>
            {L.remOffTitle}
          </T>
          <T v="bodyM" color={c.ink2} style={{ textAlign: 'center' }}>
            {L.remOffBody}
          </T>
          <Button
            label={L.remOffOpen}
            style={{ marginTop: 12, alignSelf: 'stretch' }}
            onPress={() =>
              IntentLauncher.startActivityAsync('android.settings.APP_NOTIFICATION_SETTINGS', {
                extra: { 'android.provider.extra.APP_PACKAGE': Constants.expoConfig?.android?.package ?? 'com.inigocode.kuralheart' },
              }).catch(() => {})
            }
          />
          <TextLink label={L.remOffKeep} onPress={() => (set({ reminderOn: false }), planReminders().catch(() => {}))} />
        </View>
      ) : null}

      <SectionLabel>{L.sPrivate}</SectionLabel>
      <Group>
        <SwitchRow
          title={L.sLock}
          sub={L.sLockSub}
          divider={false}
          value={s.lockOn}
          onChange={async (on) => {
            if (!on) return set({ lockOn: false });
            if (!(await canLock())) return setLockMissing(true);
            if (await authenticate(L.sLock)) {
              set({ lockOn: true });
              unlockNow();
            }
          }}
        />
        <Row title={tr('Backup and Google Drive', 'காப்பும் Google Drive-உம்')} sub={backupSummary} onPress={() => router.push('/backup')} />
        <Row
          title={L.sText}
          sub={L.sTextSub}
          onPress={async () => {
            try {
              const d = await awayFor(() => Directory.pickDirectoryAsync());
              await exportTextTo(d.uri);
              toast(tr('Saved as Kural Heart pages.txt', 'Kural Heart pages.txt ஆகச் சேமிக்கப்பட்டது'));
            } catch {}
          }}
        />
        <Row title={L.sWipe} titleColor={c.heart} onPress={() => (setTyped(''), setWipe(true))} />
      </Group>

      <SectionLabel>{tr('Online', 'இணையம்')}</SectionLabel>
      <Group>
        <SwitchRow
          title={tr('Add place and weather to new pages', 'புதிய பக்கங்களில் இடமும் வானிலையும்')}
          sub={tr('Uses your rough location; weather from Open-Meteo', 'தோராயமான இருப்பிடம்; வானிலை Open-Meteo-விலிருந்து')}
          divider={false}
          value={s.autoDetails}
          onChange={async (on) => {
            set({ autoDetails: on });
            if (on && !(await awayFor(() => askLocation()))) set({ autoDetails: false });
          }}
        />
        <SwitchRow
          title={tr('Update over the air', 'தானாகப் புதுப்பி')}
          sub={tr(`Version ${Constants.expoConfig?.version ?? ''}`, `பதிப்பு ${Constants.expoConfig?.version ?? ''}`)}
          value={s.updateCheck}
          onChange={(v) => set({ updateCheck: v })}
        />
      </Group>

      <SectionLabel>{L.sAbout}</SectionLabel>
      <Group>
        <Row title={L.sAbout} divider={false} onPress={() => router.push('/about')} />
        <Row title={L.sSources} onPress={() => router.push('/sources')} />
      </Group>

      <OptionSheet
        visible={sheet === 'theme'}
        title={L.sTheme}
        value={s.theme}
        onChange={(v) => set({ theme: v })}
        onClose={() => setSheet(null)}
        options={[
          { value: 'auto', title: L.themeAuto, sub: tr('Ivory by day, Midnight from evening to dawn', 'பகலில் வெளிர், மாலை முதல் வைகறை வரை இருள்') },
          { value: 'ivory', title: L.themeIvory, sub: tr('Warm paper, always', 'எப்போதும் வெளிர் காகிதம்') },
          { value: 'midnight', title: L.themeMidnight, sub: tr('Dark, always', 'எப்போதும் இருள்') },
        ]}
      />
      <OptionSheet
        visible={sheet === 'english'}
        title={tr('English under each couplet', 'குறளின் கீழ் ஆங்கிலம்')}
        lede={tr(`Shown on Today and on share images. Here is couplet ${sampleK.n} in each.`, `இன்றும் பகிர்வுப் படங்களிலும் காட்டப்படும். குறள் ${sampleK.n} ஒவ்வொன்றிலும்:`)}
        value={s.translation}
        onChange={(v) => set({ translation: v })}
        onClose={() => setSheet(null)}
        options={[
          { value: 'aiyar', title: 'V. V. S. Aiyar, 1916', sub: tr('Plain prose, the easiest to read', 'எளிய உரைநடை'), sample: english(sampleK, 'aiyar') },
          { value: 'pope', title: 'G. U. Pope, 1886', sub: tr('Rhyming verse in two lines, like the Tamil', 'தமிழைப் போல இரண்டு வரிச் செய்யுள்'), sample: english(sampleK, 'pope') },
          { value: 'popeprose', title: tr('G. U. Pope, prose', 'போப், உரைநடை'), sub: tr('Pope’s literal prose rendering', 'போப்பின் நேரடி உரைநடை'), sample: english(sampleK, 'popeprose') },
        ]}
      />
      <OptionSheet
        visible={sheet === 'daily'}
        title={tr('How today’s couplet is chosen', 'இன்றைய குறள் தேர்வு')}
        value={s.promptMode}
        onChange={(v) => set({ promptMode: v })}
        onClose={() => setSheet(null)}
        options={[
          {
            value: 'daily',
            title: tr('A welcome week, then in turn', 'வரவேற்பு வாரம், பிறகு வரிசையாக'),
            sub: tr(
              'Seven chosen couplets to begin, then the 900 couplets that suit a journal, each once, in an order of their own.',
              'தொடக்கத்தில் தேர்ந்த ஏழு குறள்கள், பிறகு நாட்குறிப்புக்கு ஏற்ற 900 குறள்கள், ஒவ்வொன்றும் ஒருமுறை.',
            ),
          },
          {
            value: 'random',
            title: tr('Any couplet, at random', 'ஏதேனும் ஒரு குறள்'),
            sub: tr('A surprise each day; couplets may come round again sooner.', 'நாள்தோறும் ஒரு வியப்பு; குறள்கள் விரைவில் மீண்டும் வரலாம்.'),
          },
        ]}
      />
      <OptionSheet
        visible={sheet === 'speed'}
        title={tr('Speed', 'வேகம்')}
        value={s.speechRate}
        onChange={(v) => set({ speechRate: v })}
        onClose={() => setSheet(null)}
        options={[
          { value: 0.7, title: tr('Slow', 'மெதுவாக'), sub: tr('For learning the words', 'சொற்களைக் கற்க') },
          { value: 0.85, title: tr('Gentle', 'நிதானமாக'), sub: tr('A recitation pace', 'ஓதும் வேகம்') },
          { value: 1, title: tr('Normal', 'இயல்பாக'), sub: tr('Everyday speech', 'அன்றாடப் பேச்சு') },
        ]}
      />
      <OptionSheet
        visible={sheet === 'spelling'}
        title={tr('Pronunciation style', 'உச்சரிப்பு முறை')}
        lede={tr('How the line under each couplet spells it.', 'ஒவ்வொரு குறளின் கீழும் உள்ள வரி அதை எப்படி எழுதுகிறது.')}
        value={s.pronounceStyle}
        onChange={(v) => set({ pronounceStyle: v })}
        onClose={() => setSheet(null)}
        options={[
          {
            value: 'simple',
            title: tr('Simple', 'எளியது'),
            sub: tr('Written as it sounds, for reading aloud without knowing Tamil', 'ஒலிப்பது போலவே, தமிழ் தெரியாமலும் படிக்க'),
            sample: `${pronounce(sampleK.a)}
${pronounce(sampleK.b)}`,
          },
          {
            value: 'scholarly',
            title: tr('Scholarly', 'அறிஞர் முறை'),
            sub: tr('ISO 15919, letter for letter, as in Tamil dictionaries and scholarship', 'ISO 15919, எழுத்துக்கு எழுத்து, அகராதிகளிலும் ஆய்விலும் உள்ளபடி'),
            sample: `${scholarly(sampleK.a)}
${scholarly(sampleK.b)}`,
          },
        ]}
      />
      <VoiceSheet lang="ta" visible={sheet === 'voiceTa'} onClose={() => setSheet(null)} sample={`${sampleK.a}. ${sampleK.b}.`} n={sampleK.n} />
      <VoiceSheet lang="en" n={sampleK.n} visible={sheet === 'voiceEn'} onClose={() => setSheet(null)} sample={english(sampleK, s.translation).replace(/\n/g, ' ')} />
      <Dialog visible={lockMissing} title={L.sLock} onClose={() => setLockMissing(false)} actions={[{ label: L.close, onPress: () => setLockMissing(false) }]}>
        <T v="bodyM" color={c.ink2}>
          {tamil ? 'முதலில் அலைபேசியின் அமைப்புகளில் திரைப் பூட்டை அமைக்கவும்.' : 'Set a screen lock in your phone’s settings first. The app lock uses it.'}
        </T>
      </Dialog>
      <Dialog
        visible={wipe}
        title={L.wipeTitle}
        onClose={() => setWipe(false)}
        actions={[
          { label: L.cancel, onPress: () => setWipe(false) },
          {
            label: L.wipeConfirm,
            color: c.heart,
            disabled: typed.trim() !== L.wipeWord,
            onPress: async () => {
              setWipe(false);
              await deleteAllEntries();
              deleteAllPhotos();
              if (s.driveOn) await disconnectDrive();
              await deleteDeviceKey();
              wipeSettings();
              planReminders().catch(() => {});
              refreshWidget();
              router.dismissTo('/');
            },
          },
        ]}>
        <T v="bodyM" color={c.ink2}>
          {L.wipeBody(entries.length)}
        </T>
        <T v="label" color={c.primary}>
          {L.wipeType}
        </T>
        <Field value={typed} onChangeText={setTyped} placeholder={L.wipeWord} autoCapitalize="characters" style={{ backgroundColor: c.surface2 }} />
      </Dialog>
    </ScrollView>
  );
}
