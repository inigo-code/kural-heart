import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { setToday } from '@/lib/daily';
import { useJournal } from '@/lib/journal';
import { chapterOf, english, kural } from '@/lib/pack';
import { markRead, toggleSaved, useSettings } from '@/lib/settings';
import { readAloud, stopReading, useSpeaker, voiceSettings } from '@/lib/speak';
import { ActionRow, EntryCard, MUVA_BY, kuralRef, partColor, questionText } from '@/ui/common';
import { CoupletText, Leaf, LeafNote, Pronounce } from '@/ui/leaf';
import { Button, IconButton, Note, Page, SectionLabel, T, TextLink } from '@/ui/parts';
import { F } from '@/ui/theme';
import { useUI } from '@/ui/ui';
import { refreshWidget } from '@/widget/widgets';

/** One couplet's page: the leaf, all three English renderings, the question, audio, save, share and write. */
export default function KuralScreen() {
  const { n: raw } = useLocalSearchParams<{ n: string }>();
  const n = Math.min(1330, Math.max(1, Number(raw) || 1));
  const { c, tr, tamil, L, type } = useUI();
  const s = useSettings();
  const router = useRouter();
  const speaker = useSpeaker();
  const { entries } = useJournal();
  const k = kural(n);
  const ch = chapterOf(k);
  const saved = s.saved.includes(n);
  const playing = speaker.speaking === n;
  const pages = entries.filter((e) => e.kural === n);
  useEffect(() => {
    markRead(n);
  }, [n]);
  useEffect(() => () => stopReading(), []);
  return (
    <Page
      title={tr(`Kural ${n}`, `குறள் ${n}`)}
      actions={<IconButton name="star" label={saved ? tr('Remove from saved', 'சேமிப்பிலிருந்து நீக்கு') : tr('Save', 'சேமி')} onPress={() => toggleSaved(n)} color={saved ? c.gold : c.ink2} />}>
      <T v="label" color={partColor(ch.part, c)}>
        {kuralRef(k, tamil)}
      </T>
      <View style={{ height: 12 }} />
      <Leaf>
        <CoupletText a={k.a} b={k.b} max={28} />
        <Pronounce a={k.a} b={k.b} />
        <LeafNote>{ch.ta}</LeafNote>
      </Leaf>
      <View style={{ marginHorizontal: -20, marginTop: 18 }}>
        <ActionRow
          items={[
            { icon: playing ? 'stop' : 'play', label: playing ? tr('Stop', 'நிறுத்து') : tr('Listen', 'கேள்'), on: playing, onPress: () => readAloud(k, english(k, s.translation)) },
            { icon: 'share', label: L.share, onPress: () => router.push({ pathname: '/share/[n]', params: { n: String(n) } }) },
            {
              icon: 'today',
              label: tr("Make today's couplet", 'இன்றைய குறளாக்கு'),
              onPress: () => {
                setToday(n);
                refreshWidget();
                router.dismissTo('/');
              },
            },
          ]}
        />
      </View>
      {speaker.missingTamil ? (
        <View style={{ marginTop: 8 }}>
          <Note icon="play">
            {tr(
              'This phone has no Tamil voice yet, so only the English was read. Add one in voice settings.',
              'இந்த அலைபேசியில் தமிழ்க் குரல் இல்லை; ஆங்கிலம் மட்டும் படிக்கப்பட்டது. குரல் அமைப்புகளில் சேர்க்கலாம்.',
            )}
          </Note>
          <TextLink label={tr('Open voice settings', 'குரல் அமைப்புகளைத் திற')} onPress={voiceSettings} />
        </View>
      ) : null}
      {(
        [
          ...(tamil && k.ta ? [[MUVA_BY.ta, k.ta, false] as const] : []),
          ['V. V. S. Aiyar, 1916', k.en, false] as const,
          ['G. U. Pope, 1886', `${k.pa}\n${k.pb}`, true] as const,
          [tr("Pope's edition, prose", 'போப் பதிப்பு, உரைநடை'), k.pp, false] as const,
          // Readers who lead in English but know some Tamil find the Tamil explanation last.
          ...(!tamil && k.ta ? [[MUVA_BY.en, k.ta, false] as const] : []),
        ]
      ).map(([by, text, italic], i) => (
        <View key={by} style={{ marginTop: i === 0 ? 22 : 0, paddingVertical: 16, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line }}>
          <T v="small" color={c.primary} style={{ letterSpacing: 0.2 }}>
            {by}
          </T>
          <Text style={[type.body, { color: c.ink, marginTop: 6 }, italic ? { fontFamily: F.serifItalic } : null]}>{text}</Text>
        </View>
      ))}
      <SectionLabel>{tr('A question to write about', 'எழுதுவதற்கு ஒரு கேள்வி')}</SectionLabel>
      <T v="headline" style={{ fontSize: type.headline.fontSize * 0.85, lineHeight: type.headline.lineHeight * 0.88 }}>
        {questionText(k, 0, tamil)}
      </T>
      <Button label={L.write} icon="pen" style={{ marginTop: 12 }} onPress={() => router.push({ pathname: '/write', params: { kural: String(n) } })} />
      {pages.length ? (
        <>
          <SectionLabel>{tr('Your pages on this couplet', 'இந்தக் குறள் பற்றிய உங்கள் பக்கங்கள்')}</SectionLabel>
          <View style={{ marginHorizontal: -16 }}>
            {pages.map((e) => (
              <EntryCard key={e.id} e={e} />
            ))}
          </View>
        </>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        {n > 1 ? <TextLink label={tr(`‹ Kural ${n - 1}`, `‹ குறள் ${n - 1}`)} onPress={() => router.setParams({ n: String(n - 1) })} /> : <View />}
        {n < 1330 ? <TextLink label={tr(`Kural ${n + 1} ›`, `குறள் ${n + 1} ›`)} onPress={() => router.setParams({ n: String(n + 1) })} /> : null}
      </View>
    </Page>
  );
}
