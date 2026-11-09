import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { todayKural } from '@/lib/daily';
import { addDays, dayOf, longDate, monthName, today } from '@/lib/dates';
import type { Day } from '@/lib/dates';
import { allTags, searchEntries, useJournal } from '@/lib/journal';
import { PARTS, partOf } from '@/lib/pack';
import type { Part } from '@/lib/pack';
import type { Entry } from '@/lib/types';
import { ArchValluvar, EntryCard, MOODS, MoodChip, PhotoThumb, Sheet, Wrap, plainMarkdown, usePhoto } from '@/ui/common';
import { AtlasMap } from '@/ui/atlas';
import { VideoTile } from '@/ui/media';
import { Button, Chip, Icon, IconButton, SectionLabel, T, TextLink } from '@/ui/parts';
import { useUI } from '@/ui/ui';

type Filter = { starred: boolean; photos: boolean; moods: string[]; tags: string[]; parts: Part[]; within: number; oldestFirst: boolean };
const NONE: Filter = { starred: false, photos: false, moods: [], tags: [], parts: [], within: 0, oldestFirst: false };

const count = (f: Filter) => [f.starred, f.photos, f.moods.length > 0, f.tags.length > 0, f.parts.length > 0, f.within > 0, f.oldestFirst].filter(Boolean).length;

function applyFilter(f: Filter, list: Entry[]): Entry[] {
  const since = f.within > 0 ? addDays(today(), -(f.within - 1)) : null;
  const out = list.filter(
    (e) =>
      (!f.starred || e.starred) &&
      (!f.photos || e.photos.length > 0) &&
      (!f.moods.length || (e.mood != null && f.moods.includes(e.mood))) &&
      (!f.tags.length || e.tags.some((t) => f.tags.includes(t))) &&
      (!f.parts.length || f.parts.includes(partOf(e.kural))) &&
      (!since || e.date >= since),
  );
  return f.oldestFirst ? [...out].sort((a, b) => (a.date === b.date ? a.created - b.created : a.date < b.date ? -1 : 1)) : out;
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function JournalScreen() {
  const { c, L, tr, type, tamil } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries, loaded } = useJournal();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'list' | 'calendar' | 'media' | 'map'>('list');
  const calendar = view === 'calendar';
  const listing = view === 'list' || !!query;
  const [mapPick, setMapPick] = useState<string[]>([]);
  const { height: screenH } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>(NONE);
  const [open, setOpen] = useState(false);
  const shown = useMemo(() => applyFilter(filter, searchEntries(entries, query)), [filter, entries, query]);
  const yearAgo = entries.find((e) => e.date === addDays(today(), -365) || e.date === `${Number(today().slice(0, 4)) - 1}${today().slice(4)}`);
  const n = count(filter);

  const header = (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 20, paddingRight: 8, paddingTop: insets.top + 12 }}>
        <View style={{ flex: 1 }}>
          <T v="label" color={c.ink3}>
            {L.pages(entries.length)}
          </T>
          <T v="display">{L.journal}</T>
        </View>
        <View>
          <IconButton name="filter" label={tr('Filters', 'வடிகட்டிகள்')} onPress={() => setOpen(true)} color={n ? c.primary : c.ink} />
          {n ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
              <T v="small" allowFontScaling={false} color={c.onPrimary} style={{ fontSize: 11, lineHeight: 14 }}>
                {n}
              </T>
            </View>
          ) : null}
        </View>
      </View>
      {entries.length === 0 && loaded ? (
        <View style={{ alignItems: 'center', padding: 24 }}>
          {/* Today shows him reading; here he waits with his stylus, for the first page. */}
          <ArchValluvar state="writing" size={200} typing />
          <T v="headline" style={{ textAlign: 'center', marginTop: 12 }}>
            {L.empty}
          </T>
          <T v="bodyM" color={c.ink2} style={{ textAlign: 'center', maxWidth: 300 }}>
            {L.emptySub}
          </T>
          <Button label={L.firstPage} icon="pen" style={{ marginTop: 16, alignSelf: 'stretch' }} onPress={() => router.push({ pathname: '/write', params: { kural: String(todayKural()) } })} />
        </View>
      ) : (
        <>
          <View style={{ margin: 16, borderRadius: 26, backgroundColor: c.surface2, minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="search" color={c.ink3} size={20} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={L.searchPh}
              placeholderTextColor={c.ink3}
              accessibilityLabel={L.searchPh}
              selectionColor={c.primary}
              maxFontSizeMultiplier={1.6}
              style={[type.body, { flex: 1, color: c.ink, paddingVertical: 10 }]}
            />
            {query ? <IconButton name="close" label={L.close} onPress={() => setQuery('')} color={c.ink3} /> : null}
          </View>
          {n ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              <T v="label" color={c.ink3} style={{ flex: 1 }}>
                {tr(`${shown.length} of ${entries.length} pages`, `${entries.length}-இல் ${shown.length} பக்கங்கள்`)}
              </T>
              <TextLink label={tr('Clear filters', 'வடிகட்டிகளை நீக்கு')} onPress={() => setFilter(NONE)} />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 6, marginHorizontal: 16, marginBottom: 10, padding: 4, borderRadius: 22, backgroundColor: c.surface2 }}>
            {(
              [
                ['list', 'list', L.list],
                ['calendar', 'calendar', L.calendar],
                ['media', 'grid', tr('Media', 'ஊடகம்')],
                ['map', 'map', tr('Map', 'வரைபடம்')],
              ] as const
            ).map(([v, icon, label]) => {
              const on = view === v;
              return (
                <Pressable
                  key={v}
                  onPress={() => setView(v)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={{
                    flex: 1,
                    flexDirection: tamil ? 'column' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: tamil ? 2 : 6,
                    minHeight: tamil ? 52 : 40,
                    paddingHorizontal: 4,
                    paddingVertical: tamil ? 6 : 0,
                    borderRadius: 18,
                    backgroundColor: on ? c.primary : 'transparent',
                  }}>
                  <Icon name={icon} size={16} color={on ? c.onPrimary : c.ink2} />
                  {/* Tamil words are longer: the label sits under the icon and shrinks to fit rather than run out. */}
                  <T v="small" color={on ? c.onPrimary : c.ink2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ maxWidth: '100%' }}>
                    {label}
                  </T>
                </Pressable>
              );
            })}
          </View>
          {calendar && !query ? <CalendarMonth entries={entries} /> : null}
          {view === 'media' && !query ? <MediaGrid entries={entries} /> : null}
          {view === 'map' && !query ? (
            <View style={{ marginHorizontal: 16 }}>
              <AtlasMap
                points={entries.flatMap((e) => (e.place?.lat != null && e.place?.lon != null ? [{ id: e.id, lat: e.place.lat, lon: e.place.lon }] : []))}
                height={Math.round(screenH * 0.45)}
                selected={mapPick}
                onSelect={setMapPick}
              />
              <View style={{ marginHorizontal: -16, marginTop: 8 }}>
                {entries
                  .filter((e) => mapPick.includes(e.id))
                  .map((e) => (
                    <EntryCard key={e.id} e={e} />
                  ))}
              </View>
            </View>
          ) : null}
          {view === 'list' && !query && yearAgo ? (
            <Pressable
              onPress={() => router.push({ pathname: '/page/[id]', params: { id: yearAgo.id } })}
              style={{ marginHorizontal: 16, marginBottom: 8, borderRadius: 24, backgroundColor: c.primarySoft, padding: 16 }}>
              <T v="label" color={c.onSoft}>
                {L.otd}
              </T>
              <T v="body" numberOfLines={2}>
                {plainMarkdown(yearAgo.text)}
              </T>
            </Pressable>
          ) : null}
          {listing && shown.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 24 }}>
              <ArchValluvar state="listening" size={170} />
              <T v="headline" style={{ textAlign: 'center' }}>
                {L.noResults}
              </T>
              <T v="bodyM" color={c.ink2} style={{ textAlign: 'center' }}>
                {L.noResultsSub}
              </T>
            </View>
          ) : null}
        </>
      )}
    </View>
  );

  return (
    <>
      <FlatList
        data={listing ? shown : []}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <EntryCard e={item} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      <FilterSheet visible={open} filter={filter} entries={entries} onClose={(f) => {
        setFilter(f);
        setOpen(false);
      }} />
    </>
  );
}

function MediaGrid({ entries }: { entries: Entry[] }) {
  const { c, tr } = useUI();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const items = entries.flatMap((e) => [...e.photos.map((id) => ({ id, page: e.id, video: false })), ...e.videos.map((id) => ({ id, page: e.id, video: true }))]);
  const size = Math.floor((width - 32 - 12) / 3);
  if (!items.length)
    return (
      <T v="bodyM" color={c.ink3} style={{ marginHorizontal: 20 }}>
        {tr('Photos and videos you add to pages will gather here.', 'பக்கங்களில் சேர்க்கும் படங்களும் காணொளிகளும் இங்கே சேரும்.')}
      </T>
    );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: 16 }}>
      {items.map((m) =>
        m.video ? (
          <VideoTile key={m.id} id={m.id} size={size} />
        ) : (
          <Pressable key={m.id} onPress={() => router.push({ pathname: '/page/[id]', params: { id: m.page } })} accessibilityRole="button" accessibilityLabel={tr('Open its page', 'அதன் பக்கத்தைத் திற')}>
            <PhotoThumb id={m.id} size={size} />
          </Pressable>
        ),
      )}
    </View>
  );
}

/** A day's photo filling its calendar circle. */
function CellPhoto({ id }: { id: string }) {
  const uri = usePhoto(id);
  return uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null;
}

function CalendarMonth({ entries }: { entries: Entry[] }) {
  const { c, tamil, tr } = useUI();
  const now = new Date();
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
  const [picked, setPicked] = useState<Day>(today());
  const photoOf = useMemo(() => {
    const m = new Map<Day, string>();
    for (const e of entries) if (e.photos[0] && !m.has(e.date)) m.set(e.date, e.photos[0]);
    return m;
  }, [entries]);
  const byDay = useMemo(() => {
    const m = new Map<Day, Entry[]>();
    for (const e of entries) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [entries]);
  const [y, mo] = ym;
  const first = new Date(y, mo, 1, 12);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(y, mo + 1, 0).getDate();
  const rows = Math.ceil((lead + days) / 7);
  const heads = tamil ? ['தி', 'செ', 'பு', 'வி', 'வெ', 'ச', 'ஞா'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const move = (d: number) => {
    const t = new Date(y, mo + d, 1);
    setYm([t.getFullYear(), t.getMonth()]);
  };
  const t = today();
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton name="back" label={tr('Previous month', 'முந்தைய மாதம்')} onPress={() => move(-1)} />
        <T v="headline" style={{ flex: 1, textAlign: 'center' }}>{`${monthName(mo, tamil)} ${y}`}</T>
        <IconButton name="chevron" label={tr('Next month', 'அடுத்த மாதம்')} onPress={() => move(1)} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {heads.map((h, i) => (
          <T key={i} v="labelM" color={c.ink3} style={{ flex: 1, textAlign: 'center' }}>
            {h}
          </T>
        ))}
      </View>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {Array.from({ length: 7 }, (_, col) => {
            const i = r * 7 + col - lead + 1;
            if (i < 1 || i > days) return <View key={col} style={{ flex: 1, aspectRatio: 1 }} />;
            const day = dayOf(new Date(y, mo, i, 12));
            const has = byDay.has(day);
            const on = day === picked;
            const photo = photoOf.get(day);
            return (
              <View key={col} style={{ flex: 1, aspectRatio: 1, padding: 3 }}>
                <Pressable
                  onPress={() => setPicked(day)}
                  accessibilityRole="button"
                  accessibilityLabel={longDate(day, tamil)}
                  style={{
                    flex: 1,
                    borderRadius: 100,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // A day with a photo shows it; chosen, it gets a ring rather than a fill that would hide it.
                    backgroundColor: photo ? c.surface2 : on ? c.primary : has ? c.primarySoft : 'transparent',
                    borderWidth: photo && on ? 2.5 : day === t && !on ? 1.5 : 0,
                    borderColor: c.primary,
                  }}>
                  {photo ? (
                    <View style={StyleSheet.absoluteFill}>
                      <CellPhoto id={photo} />
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,16,12,0.38)' }]} />
                    </View>
                  ) : null}
                  <T
                    v="label"
                    color={photo ? '#FFFFFF' : on ? c.onPrimary : has ? c.onSoft : c.ink2}
                    style={photo ? { textShadowColor: 'rgba(0,0,0,0.75)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } } : undefined}>
                    {i}
                  </T>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
      <View style={{ height: 12 }} />
      {(byDay.get(picked) ?? []).length === 0 ? (
        <T v="label" color={c.ink3} style={{ padding: 4 }}>
          {longDate(picked, tamil)}
        </T>
      ) : null}
      <View style={{ marginHorizontal: -16 }}>
        {(byDay.get(picked) ?? []).map((e) => (
          <EntryCard key={e.id} e={e} />
        ))}
      </View>
    </View>
  );
}

function FilterSheet({ visible, filter, entries, onClose }: { visible: boolean; filter: Filter; entries: Entry[]; onClose: (f: Filter) => void }) {
  const { tr, tamil } = useUI();
  const [f, setF] = useState(filter);
  const [was, setWas] = useState(visible);
  if (visible !== was) {
    setWas(visible);
    if (visible) setF(filter);
  }
  const tags = allTags(entries);
  return (
    <Sheet visible={visible} onClose={() => onClose(f)}>
      <T v="headline">{tr('Filter your pages', 'பக்கங்களை வடிகட்டு')}</T>
      <SectionLabel>{tr('Show', 'காட்டு')}</SectionLabel>
      <Wrap>
        <Chip label={tr('Starred', 'நட்சத்திரமிட்டவை')} icon="star" on={f.starred} onPress={() => setF({ ...f, starred: !f.starred })} />
        <Chip label={tr('With photos', 'படங்களுடன்')} icon="gallery" on={f.photos} onPress={() => setF({ ...f, photos: !f.photos })} />
        <Chip label={tr('Oldest first', 'பழையவை முதலில்')} on={f.oldestFirst} onPress={() => setF({ ...f, oldestFirst: !f.oldestFirst })} />
      </Wrap>
      <SectionLabel>{tr('When', 'எப்போது')}</SectionLabel>
      <Wrap>
        {(
          [
            [0, 'Any time', 'எப்போதும்'],
            [7, 'Last 7 days', 'கடந்த 7 நாள்கள்'],
            [30, 'Last 30 days', 'கடந்த 30 நாள்கள்'],
            [365, 'Last year', 'கடந்த ஆண்டு'],
          ] as const
        ).map(([d, en, ta]) => (
          <Chip key={d} label={tamil ? ta : en} on={f.within === d} onPress={() => setF({ ...f, within: d })} />
        ))}
      </Wrap>
      <SectionLabel>{tr('Feeling', 'உணர்வு')}</SectionLabel>
      <Wrap>
        {MOODS.map((m) => (
          <MoodChip key={m.id} m={m} on={f.moods.includes(m.id)} onPress={() => setF({ ...f, moods: toggle(f.moods, m.id) })} />
        ))}
      </Wrap>
      <SectionLabel>{tr('Book of the Kural', 'குறளின் பால்')}</SectionLabel>
      <Wrap>
        {(['aram', 'porul', 'inbam'] as Part[]).map((p) => (
          <Chip key={p} label={tamil ? PARTS[p].ta : PARTS[p].en} on={f.parts.includes(p)} onPress={() => setF({ ...f, parts: toggle(f.parts, p) })} />
        ))}
      </Wrap>
      {tags.length ? (
        <>
          <SectionLabel>{tr('Tags', 'குறிச்சொற்கள்')}</SectionLabel>
          <Wrap>
            {tags.map((t) => (
              <Chip key={t} label={`#${t}`} on={f.tags.includes(t)} onPress={() => setF({ ...f, tags: toggle(f.tags, t) })} />
            ))}
          </Wrap>
        </>
      ) : null}
      <Button label={tr('Show pages', 'பக்கங்களைக் காட்டு')} style={{ marginTop: 18 }} onPress={() => onClose(f)} />
      <TextLink label={tr('Clear all', 'அனைத்தையும் நீக்கு')} onPress={() => setF(NONE)} />
    </Sheet>
  );
}
