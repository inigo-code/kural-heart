import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Share, Text, View } from 'react-native';

import { deletePage } from '@/lib/actions';
import { longDate } from '@/lib/dates';
import { toggleStar, useJournal } from '@/lib/journal';
import { chapterOf, kural } from '@/lib/pack';
import { wordCount } from '@/lib/types';
import { MOODS, Markdown, PhotoGallery, moodTint, plainMarkdown, questionText, timeOf, weatherLabel } from '@/ui/common';
import { MayilBorder } from '@/ui/kolam';
import { CoupletText, Leaf, LeafNote } from '@/ui/leaf';
import { Button, Icon, Page, StarButton, T, raised } from '@/ui/parts';
import type { IconName } from '@/ui/parts';
import { F, alpha } from '@/ui/theme';
import { AudioNote, VideoNote } from '@/ui/media';
import { closeMedia } from '@/lib/photos';
import { useUI } from '@/ui/ui';

export default function PageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, L, tamil, tr, type, scale } = useUI();
  const router = useRouter();
  const { entries } = useJournal();
  const e = entries.find((x) => x.id === id);
  useEffect(() => {
    if (!e && router.canGoBack()) router.back();
  }, [e, router]);
  // Voice notes and videos are opened into temporary files while the page is open; tidy them away after.
  useEffect(() => () => closeMedia(), []);
  if (!e) return null;
  const k = kural(e.kural);
  const ch = chapterOf(k);
  const mood = MOODS.find((m) => m.id === e.mood);
  const words = wordCount(e.text);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Page
        title={longDate(e.date, tamil)}
        contentStyle={{ paddingBottom: 24 }}
        footer={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Button label={L.edit} icon="pen" style={{ flex: 1, minHeight: 50 }} onPress={() => router.replace({ pathname: '/write', params: { kural: String(e.kural), id: e.id } })} />
            <Button
              label={L.share}
              icon="share"
              tonal
              style={{ flex: 1, minHeight: 50 }}
              onPress={() => Share.share({ message: `${plainMarkdown(e.text)}\n\n— ${L.kural} ${k.n}: ${k.a} / ${k.b}` }).catch(() => {})}
            />
            <Pressable
              onPress={() => {
                router.back();
                deletePage(e.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={L.delete}
              style={({ pressed }) => ({ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: alpha(c.heart, 0.5), backgroundColor: pressed ? alpha(c.heart, 0.12) : 'transparent' })}>
              <Icon name="trash" size={20} color={c.heart} />
            </Pressable>
          </View>
        }
        actions={
          <StarButton disc on={e.starred} label={e.starred ? tr('Remove the star', 'நட்சத்திரத்தை நீக்கு') : tr('Star this page', 'இந்தப் பக்கத்தை நட்சத்திரமிடு')} onPress={() => toggleStar(e)} />
        }>
        {/* The page's circumstances at a glance: how you felt, when, the weather and the place. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {mood ? <InfoPill emoji={mood.emoji} text={tamil ? mood.ta : mood.en} tint={moodTint(mood, c)} /> : null}
          <InfoPill icon="clock" text={timeOf(e)} />
          {e.weather ? <InfoPill icon={e.weather.kind === 'sun' || e.weather.kind === 'wind' ? 'sun' : 'cloud'} text={weatherLabel(e.weather, tamil)} /> : null}
          {e.place ? (
            <InfoPill
              icon="pin"
              text={e.place.name}
              onPress={e.place.lat != null && e.place.lon != null ? () => router.push({ pathname: '/atlas', params: { focus: e.id } }) : undefined}
            />
          ) : null}
        </View>

        <Pressable onPress={() => router.push({ pathname: '/kural/[n]', params: { n: String(k.n) } })} style={{ marginTop: 16 }}>
          <Leaf mini>
            <CoupletText a={k.a} b={k.b} max={22} min={14} />
            <LeafNote>{tamil ? `அதிகாரம் ${ch.n} · ${ch.ta} · குறள் ${k.n}` : `Chapter ${ch.n} · ${ch.ta} · Kural ${k.n}`}</LeafNote>
          </Leaf>
        </Pressable>

        {/* The question this page answers, set off by an accent bar. */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <View style={{ width: 3, borderRadius: 2, backgroundColor: c.primary }} />
          <View style={{ flex: 1 }}>
            <T v="small" color={c.primary}>
              {L.lens[e.lens] ?? L.todayQ}
            </T>
            <Text style={[type.title, { fontFamily: F.serifItalic, color: c.ink2, marginTop: 2 }]}>{questionText(k, e.lens, tamil)}</Text>
          </View>
        </View>

        {/* What you wrote, on its own sheet of paper. */}
        <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: c.surface, paddingHorizontal: 18, paddingVertical: 16, ...raised(c) }}>
          <Markdown text={e.text} style={[type.body, { color: c.ink, fontSize: 19 * scale * (tamil ? 1.08 : 1), lineHeight: (tamil ? 33 : 30) * scale }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <MayilBorder height={10} style={{ flex: 1 }} strength={0.7} />
            <T v="small" color={c.ink3}>
              {L.wordsN(words)}
            </T>
          </View>
        </View>

        {e.photos.length ? (
          <View style={{ marginTop: 12 }}>
            <PhotoGallery ids={e.photos} />
          </View>
        ) : null}
        {e.audio.map((a) => (
          <View key={a} style={{ marginTop: 12 }}>
            <AudioNote id={a} />
          </View>
        ))}
        {e.videos.map((v) => (
          <View key={v} style={{ marginTop: 12 }}>
            <VideoNote id={v} />
          </View>
        ))}
        {e.tags.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {e.tags.map((tg) => (
              <InfoPill key={tg} text={`#${tg}`} />
            ))}
          </View>
        ) : null}
      </Page>
    </View>
  );
}

/** A small rounded detail: an icon or emoji and a word or two; tinted for a feeling; tappable for the place. */
function InfoPill({ icon, emoji, text, tint, onPress }: { icon?: IconName; emoji?: string; text: string; tint?: string; onPress?: () => void }) {
  const { c } = useUI();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 34,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 17,
        backgroundColor: tint ? alpha(tint, 0.16) : pressed ? c.surface3 : c.surface2,
        borderWidth: 1,
        borderColor: tint ? alpha(tint, 0.4) : 'transparent',
      })}>
      {emoji ? <Text style={{ fontSize: 15 }}>{emoji}</Text> : icon ? <Icon name={icon} size={16} color={tint ?? c.ink2} /> : null}
      <T v="labelM" color={c.ink} numberOfLines={1}>
        {text}
      </T>
      {onPress ? <Icon name="chevron" size={14} color={c.ink3} /> : null}
    </Pressable>
  );
}
