import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useJournal } from '@/lib/journal';
import { CHAPTERS, KURALS, PARTS, chapter } from '@/lib/pack';
import type { Chapter, Kural, Part } from '@/lib/pack';
import { useSettings } from '@/lib/settings';
import { HScroll, partColor } from '@/ui/common';
import { KuralRow } from '@/ui/kuralRow';
import { BackButton, Chip, Icon, IconButton, T } from '@/ui/parts';
import { alpha, tamilSerif } from '@/ui/theme';
import { useUI } from '@/ui/ui';

type Filter = 'all' | Part | 'saved' | 'written' | 'unread';

type Item = { kind: 'part'; p: Part } | { kind: 'chapter'; ch: Chapter } | { kind: 'kural'; k: Kural } | { kind: 'count'; n: number };

export default function LibraryScreen() {
  const { c, tr, L, type, tamil } = useUI();
  const s = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries } = useJournal();
  // Opened from Today or Settings: a back button returns there, and Settings can ask for the saved couplets.
  const { from, show } = useLocalSearchParams<{ from?: string; show?: string }>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState<string | undefined>(undefined);
  if (show && show !== shown) {
    setShown(show);
    if (show === 'saved') setFilter('saved');
  }
  const goBack = () => {
    const to = from === 'settings' ? '/settings' : '/';
    router.setParams({ from: undefined, show: undefined });
    setShown(undefined);
    router.navigate(to);
  };
  const written = useMemo(() => new Set(entries.map((e) => e.kural)), [entries]);
  const q = query.trim();
  const kuralMode = q !== '' || filter === 'saved' || filter === 'written' || filter === 'unread';
  const read = useMemo(() => new Set(s.read), [s.read]);

  const items: Item[] = useMemo(() => {
    if (kuralMode) {
      const ql = q.toLowerCase();
      const num = /^\d+$/.test(q) ? Number(q) : null;
      let list = KURALS.filter((k) => {
        const ch = chapter(k.c);
        const matches =
          !q ||
          String(k.n) === q ||
          `${k.a} ${k.b}`.includes(q) ||
          ch.ta.includes(q) ||
          ch.en.toLowerCase().includes(ql) ||
          k.en.toLowerCase().includes(ql) ||
          k.pa.toLowerCase().includes(ql) ||
          k.pb.toLowerCase().includes(ql) ||
          (num != null && num >= 1 && num <= 133 && ch.n === num);
        const passes =
          filter === 'saved'
            ? s.saved.includes(k.n)
            : filter === 'written'
              ? written.has(k.n)
              : filter === 'unread'
                ? !read.has(k.n)
                : filter === 'all'
                  ? true
                  : ch.part === filter;
        return matches && passes;
      });
      if (num != null) list = [...list].sort((a, b) => (a.n === num ? -1 : b.n === num ? 1 : 0));
      return [{ kind: 'count', n: list.length }, ...list.slice(0, 300).map((k) => ({ kind: 'kural' as const, k }))];
    }
    const parts: Part[] = filter === 'aram' || filter === 'porul' || filter === 'inbam' ? [filter] : ['aram', 'porul', 'inbam'];
    return parts.flatMap((p) => [{ kind: 'part' as const, p }, ...CHAPTERS.filter((ch) => ch.part === p).map((ch) => ({ kind: 'chapter' as const, ch }))]);
  }, [kuralMode, q, filter, s.saved, written, read]);

  const filters: [Filter, string][] = [
    ['all', tr('All', 'அனைத்தும்')],
    ['aram', tr('Virtue · அறம்', 'அறம்')],
    ['porul', tr('Wealth · பொருள்', 'பொருள்')],
    ['inbam', tr('Love · இன்பம்', 'இன்பம்')],
    ['saved', tr(`Saved (${s.saved.length})`, `சேமித்தவை (${s.saved.length})`)],
    ['written', tr('Written about', 'எழுதியவை')],
    ['unread', tr('Not read yet', 'இன்னும் படிக்காதவை')],
  ];
  const ph = tr('A number, a word in Tamil or English', 'எண், தமிழ் அல்லது ஆங்கிலச் சொல்');

  const header = (
    <View>
      <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 12 }}>
        {from ? (
          <View style={{ marginLeft: -6, marginBottom: 8 }}>
            <BackButton onPress={goBack} label={from === 'settings' ? tr('Back to Settings', 'அமைப்புகளுக்குத் திரும்பு') : tr('Back to Today', 'இன்றைக்குத் திரும்பு')} />
          </View>
        ) : null}
        <T v="label" color={c.ink3}>
          {tr('1,330 couplets · 133 chapters', '1,330 குறள்கள் · 133 அதிகாரங்கள்')}
        </T>
        <T v="display">{tr('Thirukkural', 'திருக்குறள்')}</T>
      </View>
      <View
        style={{
          margin: 16,
          borderRadius: 26,
          backgroundColor: c.surface2,
          minHeight: 54,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <Icon name="search" color={c.ink3} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={ph}
          placeholderTextColor={c.ink3}
          accessibilityLabel={ph}
          selectionColor={c.primary}
          maxFontSizeMultiplier={1.6}
          style={[type.body, { flex: 1, color: c.ink, paddingVertical: 10 }]}
        />
        {query ? <IconButton name="close" label={L.close} onPress={() => setQuery('')} color={c.ink3} /> : null}
      </View>
      <HScroll style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        {filters.map(([f, label]) => (
          <Chip key={f} label={label} on={filter === f} onPress={() => setFilter(f)} />
        ))}
      </HScroll>
    </View>
  );

  return (
    <FlatList
      data={items}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 48 }}
      initialNumToRender={14}
      windowSize={9}
      keyExtractor={(it) => (it.kind === 'part' ? `p${it.p}` : it.kind === 'chapter' ? `c${it.ch.n}` : it.kind === 'kural' ? `k${it.k.n}` : 'count')}
      renderItem={({ item }) => {
        if (item.kind === 'count')
          return (
            <T v="label" color={c.ink3} style={{ marginLeft: 20, marginVertical: 4 }}>
              {tr(`${item.n} ${item.n === 1 ? 'couplet' : 'couplets'}`, `${item.n} குறள்கள்`)}
            </T>
          );
        if (item.kind === 'kural') return <KuralRow k={item.k} />;
        if (item.kind === 'part') {
          const range = item.p === 'aram' ? '1–38' : item.p === 'porul' ? '39–108' : '109–133';
          return (
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
              <Text style={[tamilSerif(type.headline.fontSize), { color: partColor(item.p, c) }]}>{PARTS[item.p].ta}</Text>
              <T v="label" color={c.ink3}>
                {tamil ? `அதிகாரங்கள் ${range}` : `${PARTS[item.p].en} · chapters ${range}`}
              </T>
            </View>
          );
        }
        const ch = item.ch;
        const col = partColor(ch.part, c);
        let readCount = 0;
        for (let i = (ch.n - 1) * 10 + 1; i <= ch.n * 10; i++) if (read.has(i)) readCount++;
        return (
          <Pressable
            onPress={() => router.push({ pathname: '/chapter/[n]', params: { n: String(ch.n) } })}
            android_ripple={{ color: c.surface3 }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: alpha(col, 0.12), alignItems: 'center', justifyContent: 'center' }}>
              <T v="label" color={col}>
                {ch.n}
              </T>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[tamilSerif(type.title.fontSize + 1), { color: c.ink }]}>{ch.ta}</Text>
              <T v="labelM" color={c.ink3} numberOfLines={2}>
                {ch.en}
              </T>
            </View>
            {readCount > 0 ? (
              <T v="labelM" color={c.ink3}>
                {readCount}/10
              </T>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}
