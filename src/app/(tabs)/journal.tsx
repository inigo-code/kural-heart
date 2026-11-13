import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { todayKural } from '@/lib/daily';
import { useTabTop } from '@/lib/tabTop';
import { addDays, dayOf, longDate, monthName } from '@/lib/dates';
import type { Day } from '@/lib/dates';
import { allTags, searchEntries, useJournal } from '@/lib/journal';
import { PARTS, partOf } from '@/lib/pack';
import type { Part } from '@/lib/pack';
import { setSettings, useSettings } from '@/lib/settings';
import type { Entry } from '@/lib/types';
import { ArchValluvar, EntryCard, MOODS, MoodChip, PhotoThumb, Rise, Sheet, ToTop, Wrap, moodTint, plainMarkdown, usePhoto } from '@/ui/common';
import { KolamBand } from '@/ui/kolam';
import { AtlasMap } from '@/ui/atlas';
import { VideoTile } from '@/ui/media';
import { Button, Chip, Icon, IconButton, Note, SectionLabel, T, TextLink, raised } from '@/ui/parts';
import { alpha } from '@/ui/theme';
import { useToday, useUI } from '@/ui/ui';

type Filter = { starred: boolean; photos: boolean; moods: string[]; tags: string[]; parts: Part[]; within: number; oldestFirst: boolean };
const NONE: Filter = { starred: false, photos: false, moods: [], tags: [], parts: [], within: 0, oldestFirst: false };

const count = (f: Filter) => [f.starred, f.photos, f.moods.length > 0, f.tags.length > 0, f.parts.length > 0, f.within > 0, f.oldestFirst].filter(Boolean).length;

function applyFilter(f: Filter, list: Entry[], day: Day): Entry[] {
  const since = f.within > 0 ? addDays(day, -(f.within - 1)) : null;
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
  const listRef = useRef<FlatList<Entry>>(null);
  const [far, setFar] = useState(false);
  useTabTop('journal', () => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
  const { c, L, tr, type, tamil } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries, loaded, failed, broken } = useJournal();
  const s = useSettings();
  const day = useToday();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'list' | 'calendar' | 'media' | 'map'>('list');
  const calendar = view === 'calendar';
  const listing = view === 'list' || !!query;
  const [mapPick, setMapPick] = useState<string[]>([]);
  const { height: screenH } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>(NONE);
  const [open, setOpen] = useState(false);
  const shown = useMemo(() => applyFilter(filter, searchEntries(entries, query, MOODS), day), [filter, entries, query, day]);
  // On this day: the most recent earlier year with a page on today's date (newest first, so the first found).
  const onThisDay = entries.find((e) => e.date.slice(5) === day.slice(5) && e.date < day);
  const yearsAgo = onThisDay ? Number(day.slice(0, 4)) - Number(onThisDay.date.slice(0, 4)) : 0;
  // Until a backup is set up, the journal lives only on this phone: once there's something to lose, say so once.
  const nudge = loaded && entries.length >= 5 && !s.hasPassphrase && !s.backupNudgeDismissed;
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
      {/* A journal that couldn't be opened says so, rather than looking empty. Nothing is deleted meanwhile. */}
      {broken || failed > 0 ? (
        <Note icon="shield" iconColor={c.heart} style={{ marginHorizontal: 16, marginTop: 12 }}>
          {broken
            ? tr(
                'Your journal couldn’t be opened on this phone just now. Nothing has been deleted. Close the app and open it again; if this stays, restore from your backup.',
                'உங்கள் நாட்குறிப்பை இப்போது இந்த அலைபேசியில் திறக்க இயலவில்லை. எதுவும் நீக்கப்படவில்லை. செயலியை மூடி மீண்டும் திறங்கள்; இது தொடர்ந்தால் உங்கள் காப்பிலிருந்து மீட்டெடுங்கள்.',
              )
            : tr(
                `${failed === 1 ? '1 page' : `${failed} pages`} couldn’t be opened on this phone. Nothing has been deleted: ${failed === 1 ? 'it stays, with its' : 'they stay, with their'} photos.`,
                `${failed === 1 ? '1 பக்கத்தை' : `${failed} பக்கங்களை`} இந்த அலைபேசியில் திறக்க இயலவில்லை. எதுவும் நீக்கப்படவில்லை: ${failed === 1 ? 'அது அதன் படங்களுடன் அப்படியே உள்ளது' : 'அவை அவற்றின் படங்களுடன் அப்படியே உள்ளன'}.`,
              )}
        </Note>
      ) : null}
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
              <TextLink label={tr('Clear filters', 'வடிகட்டிகளை அழி')} onPress={() => setFilter(NONE)} />
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
          {view === 'list' && !query && nudge ? (
            <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
              <Note icon="shield" iconColor={c.primary}>
                {tr(
                  'Your pages live only on this phone. A backup, locked with a passphrase only you know, keeps them safe if the phone is lost or replaced.',
                  'உங்கள் பக்கங்கள் இந்த அலைபேசியில் மட்டுமே உள்ளன. உங்களுக்கு மட்டும் தெரிந்த கடவுச்சொற்றொடரால் பூட்டிய காப்பு, அலைபேசி தொலைந்தாலும் மாறினாலும் அவற்றைப் பாதுகாக்கும்.',
                )}
              </Note>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                <TextLink label={tr('Not now', 'இப்போது வேண்டாம்')} color={c.ink2} onPress={() => setSettings({ backupNudgeDismissed: true })} />
                <TextLink label={tr('Set up a backup', 'காப்பை அமை')} onPress={() => router.push('/backup')} />
              </View>
            </View>
          ) : null}
          {view === 'list' && !query && onThisDay ? (
            <Pressable
              onPress={() => router.push({ pathname: '/page/[id]', params: { id: onThisDay.id } })}
              style={{ marginHorizontal: 16, marginBottom: 8, borderRadius: 24, backgroundColor: c.primarySoft, padding: 16 }}>
              <T v="label" color={c.onSoft}>
                {yearsAgo === 1
                  ? tr('On this day, a year ago', 'இதே நாள், ஓராண்டுக்கு முன்')
                  : tr(`On this day, ${yearsAgo} years ago`, `இதே நாள், ${yearsAgo} ஆண்டுகளுக்கு முன்`)}
              </T>
              <T v="body" numberOfLines={2}>
                {plainMarkdown(onThisDay.text)}
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
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        onScroll={(ev) => setFar(ev.nativeEvent.contentOffset.y > 1400)}
        scrollEventThrottle={100}
        data={listing ? shown : []}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          // The first screenful of pages rises in, one after another.
          <Rise i={index}>
            <EntryCard e={item} />
          </Rise>
        )}
        contentContainerStyle={{ paddingBottom: 72 }}
      />
      <ToTop visible={far && listing} onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })} />
      <FilterSheet visible={open} filter={filter} entries={entries} onClose={(f) => {
        setFilter(f);
        setOpen(false);
      }} />
    </View>
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

/** A round button to the previous or next month. */
function MonthButton({ back, onPress }: { back?: boolean; onPress: () => void }) {
  const { c, tr } = useUI();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={back ? tr('Previous month', 'முந்தைய மாதம்') : tr('Next month', 'அடுத்த மாதம்')}
      style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.primarySoft : c.surface2 })}>
      <Icon name={back ? 'back' : 'chevron'} size={20} color={c.ink} stroke={2} />
    </Pressable>
  );
}

function CalendarMonth({ entries }: { entries: Entry[] }) {
  const { c, tamil, tr } = useUI();
  const router = useRouter();
  const now = new Date();
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
  const t = useToday();
  const [picked, setPicked] = useState<Day>(t);
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
    const to = new Date(y, mo + d, 1);
    setYm([to.getFullYear(), to.getMonth()]);
  };
  const monthKey = `${y}-${String(mo + 1).padStart(2, '0')}`;
  const inMonth = entries.filter((e) => e.date.startsWith(monthKey));
  const daysWritten = new Set(inMonth.map((e) => e.date)).size;
  const pickedPages = byDay.get(picked) ?? [];
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={{ borderRadius: 28, backgroundColor: c.surface, padding: 14, paddingTop: 12, ...raised(c) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MonthButton back onPress={() => move(-1)} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <T v="headline" style={{ textAlign: 'center' }}>{`${monthName(mo, tamil)} ${y}`}</T>
            <T v="small" color={daysWritten ? c.primary : c.ink3}>
              {daysWritten
                ? tr(`${inMonth.length} ${inMonth.length === 1 ? 'page' : 'pages'} on ${daysWritten} ${daysWritten === 1 ? 'day' : 'days'}`, `${daysWritten} நாளில் ${inMonth.length} ${inMonth.length === 1 ? 'பக்கம்' : 'பக்கங்கள்'}`)
                : tr('No pages yet this month', 'இந்த மாதம் இன்னும் பக்கம் இல்லை')}
            </T>
          </View>
          <MonthButton onPress={() => move(1)} />
        </View>
        <KolamBand height={10} strength={0.8} style={{ marginTop: 10, marginBottom: 6 }} />
        <View style={{ flexDirection: 'row' }}>
          {heads.map((h, i) => (
            <T key={i} v="small" color={i >= 5 ? c.primary : c.ink3} style={{ flex: 1, textAlign: 'center', paddingVertical: 4 }}>
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
              const pages = byDay.get(day);
              const on = day === picked;
              const photo = photoOf.get(day);
              // A written day carries a dot in the colour of its feeling (or the accent).
              const m = pages ? MOODS.find((x) => x.id === pages[0].mood) : undefined;
              const dot = m ? moodTint(m, c) : c.primary;
              return (
                <View key={col} style={{ flex: 1, aspectRatio: 1, padding: 3 }}>
                  <Pressable
                    onPress={() => setPicked(day)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={pages ? `${longDate(day, tamil)}, ${pages.length}` : longDate(day, tamil)}
                    style={{
                      flex: 1,
                      borderRadius: 16,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: photo ? c.surface2 : on ? c.primary : pages ? alpha(dot, c.isNight ? 0.22 : 0.14) : 'transparent',
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
                      color={photo ? '#FFFFFF' : on ? c.onPrimary : pages ? c.ink : c.ink2}
                      style={photo ? { textShadowColor: 'rgba(0,0,0,0.75)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } } : undefined}>
                      {i}
                    </T>
                    {pages && !photo ? <View style={{ position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: on ? c.onPrimary : dot }} /> : null}
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 4, marginLeft: 4 }}>
        <T v="label" color={c.ink2} style={{ flex: 1 }}>
          {longDate(picked, tamil)}
        </T>
      </View>
      {pickedPages.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 18, gap: 10 }}>
          <T v="bodyM" color={c.ink3} style={{ textAlign: 'center' }}>
            {picked === t ? tr('Nothing written yet today.', 'இன்று இன்னும் எதுவும் எழுதவில்லை.') : tr('No page on this day.', 'இந்த நாளில் பக்கம் இல்லை.')}
          </T>
          {picked === t ? <Button label={tr('Write today’s page', 'இன்றைய பக்கத்தை எழுது')} icon="pen" onPress={() => router.navigate('/')} /> : null}
        </View>
      ) : null}
      <View style={{ marginHorizontal: -16 }}>
        {pickedPages.map((e) => (
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
            [7, 'Last 7 days', 'கடந்த 7 நாட்கள்'],
            [30, 'Last 30 days', 'கடந்த 30 நாட்கள்'],
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
      <TextLink label={tr('Clear all', 'எல்லாத் தேர்வுகளையும் அழி')} onPress={() => setF(NONE)} />
    </Sheet>
  );
}
