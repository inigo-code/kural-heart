import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { PARTS, chapter, chapterKurals } from '@/lib/pack';
import { partColor } from '@/ui/common';
import { KuralRow } from '@/ui/kuralRow';
import { Page, T, TextLink } from '@/ui/parts';
import { tamilSerif } from '@/ui/theme';
import { useUI } from '@/ui/ui';

export default function ChapterScreen() {
  const { n: raw } = useLocalSearchParams<{ n: string }>();
  const n = Math.min(133, Math.max(1, Number(raw) || 1));
  const { c, tr, tamil, type } = useUI();
  const router = useRouter();
  const ch = chapter(n);
  return (
    <Page title={tr(`Chapter ${n}`, `அதிகாரம் ${n}`)} scroll={false}>
      <FlatList
        style={{ flex: 1 }}
        data={chapterKurals(n)}
        keyExtractor={(k) => String(k.n)}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={[tamilSerif(type.display.fontSize * 0.9), { color: c.ink }]}>{ch.ta}</Text>
            <T v="label" color={partColor(ch.part, c)}>
              {`${ch.en} · ${tamil ? PARTS[ch.part].ta : PARTS[ch.part].en}`}
            </T>
          </View>
        }
        renderItem={({ item }) => <KuralRow k={item} inChapter />}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 4 }}>
        {n > 1 ? <TextLink label={tr(`‹ Chapter ${n - 1}`, `‹ அதிகாரம் ${n - 1}`)} onPress={() => router.setParams({ n: String(n - 1) })} /> : <View />}
        {n < 133 ? <TextLink label={tr(`Chapter ${n + 1} ›`, `அதிகாரம் ${n + 1} ›`)} onPress={() => router.setParams({ n: String(n + 1) })} /> : null}
      </View>
    </Page>
  );
}
