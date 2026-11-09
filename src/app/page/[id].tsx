import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deletePage } from '@/lib/actions';
import { longDate } from '@/lib/dates';
import { toggleStar, useJournal } from '@/lib/journal';
import { chapterOf, kural } from '@/lib/pack';
import { wordCount } from '@/lib/types';
import { DetailLine, Markdown, PhotoFull, moodLabel, plainMarkdown, questionText, timeOf, weatherLabel } from '@/ui/common';
import { CoupletText, Leaf, LeafNote } from '@/ui/leaf';
import { Chip, IconButton, Page, T, TextLink } from '@/ui/parts';
import { AudioNote, VideoTile } from '@/ui/media';
import { closeMedia } from '@/lib/photos';
import { useUI } from '@/ui/ui';

export default function PageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, L, tamil, tr, type, scale } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Page
        title={longDate(e.date, tamil)}
        contentStyle={{ paddingBottom: 24 }}
        actions={
          <IconButton
            name="star"
            label={tr('Star', 'நட்சத்திரம்')}
            color={e.starred ? c.gold : c.ink2}
            onPress={() => toggleStar(e)}
          />
        }>
        <Pressable onPress={() => router.push({ pathname: '/kural/[n]', params: { n: String(k.n) } })}>
          <Leaf mini>
            <CoupletText a={k.a} b={k.b} max={22} min={16} />
            <LeafNote>{tamil ? `அதிகாரம் ${ch.n} · ${ch.ta} · குறள் ${k.n}` : `Chapter ${ch.n} · ${ch.ta} · Kural ${k.n}`}</LeafNote>
          </Leaf>
        </Pressable>
        <T v="label" color={c.ink3} style={{ marginTop: 18 }}>
          {questionText(k, e.lens, tamil)}
        </T>
        <View style={{ marginTop: 8 }}>
          <Markdown text={e.text} style={[type.body, { color: c.ink, fontSize: 19 * scale * (tamil ? 1.08 : 1), lineHeight: (tamil ? 33 : 30) * scale }]} />
        </View>
        {e.photos.map((p) => (
          <View key={p} style={{ marginTop: 12 }}>
            <PhotoFull id={p} />
          </View>
        ))}
        {e.videos.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {e.videos.map((v) => (
              <VideoTile key={v} id={v} size={110} />
            ))}
          </View>
        ) : null}
        {e.audio.map((a) => (
          <View key={a} style={{ marginTop: 10 }}>
            <AudioNote id={a} />
          </View>
        ))}
        <View style={{ marginTop: 14 }}>
          <DetailLine icon="clock" text={`${longDate(e.date, tamil)} · ${timeOf(e)}`} />
          {e.weather ? <DetailLine icon={e.weather.kind === 'sun' || e.weather.kind === 'wind' ? 'sun' : 'cloud'} text={weatherLabel(e.weather, tamil)} /> : null}
          {e.place ? <DetailLine icon="pin" text={e.place.name} /> : null}
          {e.place?.lat != null && e.place?.lon != null ? (
            <TextLink label={tr('Show on the map', 'வரைபடத்தில் காட்டு')} onPress={() => router.push({ pathname: '/atlas', params: { focus: e.id } })} />
          ) : null}
          {e.mood ? <DetailLine icon="heart" text={moodLabel(e.mood, tamil) ?? ''} /> : null}
          {e.tags.length ? <DetailLine icon="tag" text={e.tags.map((t) => `#${t}`).join(' ')} /> : null}
          <T v="labelM" color={c.ink3} style={{ marginTop: 6 }}>
            {L.wordsN(wordCount(e.text))}
          </T>
        </View>
      </Page>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
        <Chip label={L.edit} icon="pen" onPress={() => router.replace({ pathname: '/write', params: { kural: String(e.kural), id: e.id } })} />
        <Chip
          label={L.share}
          icon="share"
          onPress={() => Share.share({ message: `${plainMarkdown(e.text)}\n\n— ${L.kural} ${k.n}: ${k.a} / ${k.b}` }).catch(() => {})}
        />
        <View style={{ flex: 1 }} />
        <Chip
          label={L.delete}
          icon="trash"
          onPress={() => {
            router.back();
            deletePage(e.id);
          }}
        />
      </View>
    </View>
  );
}
