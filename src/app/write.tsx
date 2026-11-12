import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { savePage } from '@/lib/actions';
import { periodAt, todayKural } from '@/lib/daily';
import { dayOf, longDate, parseDay, today } from '@/lib/dates';
import type { Day } from '@/lib/dates';
import { allTags, deleteEntry, entryById, saveEntry, useJournal } from '@/lib/journal';
import { awayFor } from '@/lib/lock';
import { addMediaFile, addPhoto } from '@/lib/photos';
import { placeAndWeather } from '@/lib/places';
import { uuid } from '@/lib/random';
import { useSettings } from '@/lib/settings';
import type { Entry, Place, Weather } from '@/lib/types';
import { wordCount } from '@/lib/types';
import { Dialog, Field, HScroll, MOODS, MoodChip, PhotoThumb, WEATHER_NAMES, Wrap, questionText, timeOf, weatherLabel } from '@/ui/common';
import { KeyboardSafe } from '@/ui/keyboard';
import { AudioNote, VideoNote, VoiceRecorder } from '@/ui/media';
import { CoupletText, Pronounce } from '@/ui/leaf';
import { BackButton, Button, Chip, Icon, IconButton, Note, StarButton, T, TextLink } from '@/ui/parts';
import { F } from '@/ui/theme';
import { toast } from '@/ui/toast';
import { useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';
import { chapterOf, kural } from '@/lib/pack';

type Sel = { start: number; end: number };

export default function WriteScreen() {
  const params = useLocalSearchParams<{ kural?: string; id?: string }>();
  const { c, L, tamil, tr, type, scale } = useUI();
  const s = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries } = useJournal();
  const [existing] = useState(() => (params.id ? entryById(params.id) : undefined));
  const [base] = useState<Entry>(() => {
    if (existing) return existing;
    const now = Date.now();
    return {
      id: uuid(),
      date: today(),
      created: now,
      updated: now,
      kural: Number(params.kural) || todayKural(),
      lens: s.lastLens,
      period: periodAt(),
      mood: null,
      text: '',
      tags: [],
      starred: false,
      place: null,
      weather: null,
      photos: [],
      audio: [],
      videos: [],
    };
  });
  const k = kural(base.kural);
  const ch = chapterOf(k);

  const [text, setText] = useState(base.text);
  const [sel, setSel] = useState<Sel>({ start: base.text.length, end: base.text.length });
  const [forceSel, setForceSel] = useState<Sel | undefined>();
  const [mood, setMood] = useState(base.mood);
  const [lens, setLens] = useState(base.lens);
  const [date, setDate] = useState<Day>(base.date);
  const [created, setCreated] = useState(base.created);
  const [starred, setStarred] = useState(base.starred);
  const [place, setPlace] = useState<Place | null>(base.place);
  const [weather, setWeather] = useState<Weather | null>(base.weather);
  const [tags, setTags] = useState<string[]>(base.tags);
  const [photos, setPhotos] = useState<string[]>(base.photos);
  const [audio, setAudio] = useState<string[]>(base.audio);
  const [videos, setVideos] = useState<string[]>(base.videos);
  const [recording, setRecording] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draftShown, setDraftShown] = useState(false);
  const [dialog, setDialog] = useState<null | 'kb' | 'weather' | 'place' | 'tags'>(null);
  const [fetching, setFetching] = useState(false);
  const [placeInput, setPlaceInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const savedOnce = useRef(!!existing);
  const done = useRef(false);

  const current = (): Entry => ({
    ...base,
    text: text.trim(),
    mood,
    lens,
    date,
    created,
    updated: Date.now(),
    period: periodAt(new Date(created)),
    starred,
    place,
    weather,
    tags,
    photos,
    audio,
    videos,
  });
  const latest = useRef(current);
  latest.current = current;

  const autosave = (e: Entry = latest.current()) => {
    if (e.text || e.photos.length || e.audio.length || e.videos.length) {
      saveEntry(e).then(() => {
        savedOnce.current = true;
        setDraftShown(true);
      });
    }
  };

  // Typing settles for a moment, then the draft saves itself.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setTyping(true);
    setDraftShown(false);
    const t = setTimeout(() => {
      setTyping(false);
      autosave();
    }, 1200);
    return () => clearTimeout(t);
  }, [text]);

  // Details changed: save straight away.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    autosave();
  }, [mood, date, created, starred, place, weather, tags, photos, audio, videos, lens]);

  // A new page fills in its place and weather on its own, if the person turned that on.
  useEffect(() => {
    if (!existing && s.autoDetails) fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving an emptied new page removes its draft.
  useEffect(
    () => () => {
      const e = latest.current();
      if (!done.current && !e.text && !e.photos.length && !e.audio.length && !e.videos.length && savedOnce.current && !existing) deleteEntry(base.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  async function fetchDetails() {
    setFetching(true);
    try {
      const r = await awayFor(() => placeAndWeather());
      if (r.place) setPlace(r.place);
      if (r.weather) setWeather(r.weather);
      if (!r.place && !r.weather) toast(tr('Location is off or not allowed.', 'இருப்பிடம் முடக்கப்பட்டுள்ளது அல்லது அனுமதிக்கப்படவில்லை.'));
    } finally {
      setFetching(false);
    }
  }

  async function addFrom(r: ImagePicker.ImagePickerResult) {
    if (r.canceled) return;
    const ids: string[] = [];
    for (const a of r.assets) {
      try {
        ids.push(await addPhoto(a.uri, a.width, a.height));
      } catch {}
    }
    if (ids.length) setPhotos((p) => [...p, ...ids]);
  }

  const pickPhotos = () =>
    awayFor(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 6, quality: 1 })).then(addFrom);
  const camera = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return;
    awayFor(() => ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })).then(addFrom);
  };
  // Videos: up to a minute, compressed by the picker, then sealed like photos.
  const pickVideo = async () => {
    const r = await awayFor(() =>
      ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: false,
        videoMaxDuration: 60,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      }),
    );
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    if (a.duration && a.duration > 61000) return toast(tr('Choose a video of a minute or less.', 'ஒரு நிமிடம் அல்லது குறைவான காணொளியைத் தேர்ந்தெடுக்கவும்.'));
    setVideoBusy(true);
    try {
      const id = await addMediaFile(a.uri);
      setVideos((v) => [...v, id]);
    } catch {
      toast(tr('That video couldn’t be added.', 'அந்தக் காணொளியைச் சேர்க்க இயலவில்லை.'));
    }
    setVideoBusy(false);
  };

  // --- formatting, stored as light Markdown ---
  const apply = (next: string, selection: Sel) => {
    setText(next);
    setSel(selection);
    setForceSel(selection);
    setTimeout(() => setForceSel(undefined), 50);
  };
  const wrap = (marker: string) => {
    const { start, end } = sel;
    if (start === end) apply(text.slice(0, start) + marker + marker + text.slice(end), { start: start + marker.length, end: start + marker.length });
    else apply(text.slice(0, start) + marker + text.slice(start, end) + marker + text.slice(end), { start: start + marker.length, end: end + marker.length });
  };
  const linePrefix = (prefix: string) => {
    const { start, end } = sel;
    const ls = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
    if (text.startsWith(prefix, ls)) {
      const p = Math.max(ls, start - prefix.length);
      apply(text.slice(0, ls) + text.slice(ls + prefix.length), { start: p, end: Math.max(p, end - prefix.length) });
    } else apply(text.slice(0, ls) + prefix + text.slice(ls), { start: start + prefix.length, end: end + prefix.length });
  };

  const pickDate = () =>
    DateTimePickerAndroid.open({
      value: parseDay(date),
      mode: 'date',
      maximumDate: new Date(),
      onChange: (ev, d) => {
        if (ev.type === 'set' && d) {
          const nd = dayOf(d);
          setDate(nd);
          const t = new Date(created);
          const at = parseDay(nd);
          at.setHours(t.getHours(), t.getMinutes(), 0, 0);
          setCreated(at.getTime());
        }
      },
    });
  const pickTime = () =>
    DateTimePickerAndroid.open({
      value: new Date(created),
      mode: 'time',
      is24Hour: false,
      onChange: (ev, d) => {
        if (ev.type === 'set' && d) {
          const at = parseDay(date);
          at.setHours(d.getHours(), d.getMinutes(), 0, 0);
          setCreated(at.getTime());
        }
      },
    });

  const canSave = text.trim() !== '' || photos.length > 0 || audio.length > 0 || videos.length > 0;
  const words = wordCount(text);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const writeSize = 19 * scale * (tamil ? 1.08 : 1);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <KeyboardSafe inset={insets.bottom}>
        <View style={{ height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
          <BackButton close onPress={close} />
          <T v="headline" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ flex: 1, marginLeft: 4 }}>
            {existing ? L.edit : tr('New page', 'புதிய பக்கம்')}
          </T>
          <StarButton on={starred} label={starred ? tr('Remove the star', 'நட்சத்திரத்தை நீக்கு') : tr('Star this page', 'இந்தப் பக்கத்தை நட்சத்திரமிடு')} onPress={() => setStarred(!starred)} />
          <IconButton name="keyboard" label={L.kbTitle} color={c.ink2} onPress={() => setDialog('kb')} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <Pressable
              onPress={() => router.push({ pathname: '/kural/[n]', params: { n: String(k.n) } })}
              style={{ alignSelf: 'flex-start', borderRadius: 17, backgroundColor: c.primarySoft, paddingHorizontal: 12, paddingVertical: 6 }}>
              <T v="label" color={c.onSoft}>
                {tamil ? `குறள் ${k.n} · அதிகாரம் ${ch.n} · ${ch.ta}` : `Kural ${k.n} · Chapter ${ch.n} · ${ch.en}`}
              </T>
            </Pressable>
            <View style={{ marginTop: 10 }}>
              <CoupletText a={k.a} b={k.b} max={23} min={17} color={c.ink2} />
              <Pronounce a={k.a} b={k.b} color={c.ink3} size={14} />
            </View>
          </View>
          <View style={{ height: 12 }} />
          <HScroll>
            <Chip label={longDate(date, tamil)} icon="calendar" onPress={pickDate} />
            <Chip label={timeOf(current())} icon="clock" onPress={pickTime} />
            <Chip
              label={weather ? weatherLabel(weather, tamil) : tr('Weather', 'வானிலை')}
              icon={weather?.kind === 'sun' || weather?.kind === 'wind' ? 'sun' : 'cloud'}
              on={!!weather}
              onPress={() => setDialog('weather')}
            />
            <Chip
              label={place?.name ?? tr('Place', 'இடம்')}
              icon="pin"
              on={!!place}
              onPress={() => {
                setPlaceInput(place?.name ?? '');
                setDialog('place');
              }}
            />
            <Chip
              label={tags.length ? tags.map((t) => `#${t}`).join(' ') : tr('Tags', 'குறிச்சொற்கள்')}
              icon="tag"
              on={tags.length > 0}
              onPress={() => {
                setTagInput('');
                setDialog('tags');
              }}
            />
          </HScroll>
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {L.lens.map((name, i) => (
                <Pressable
                  key={name}
                  onPress={() => setLens(i)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: lens === i }}
                  style={{ borderRadius: 16, backgroundColor: lens === i ? c.primary : c.surface2, minHeight: 40, paddingHorizontal: 14, paddingVertical: 9 }}>
                  <T v="label" color={lens === i ? c.onPrimary : c.ink2}>
                    {name}
                  </T>
                </Pressable>
              ))}
            </View>
            <T v="headline" style={{ marginTop: 10, fontSize: type.headline.fontSize * 0.88, lineHeight: type.headline.lineHeight * 0.9 }}>
              {questionText(k, lens, tamil)}
            </T>
            <View style={{ marginTop: 14, borderRadius: 20, backgroundColor: c.surface, padding: 16, minHeight: 240 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
                selection={forceSel}
                multiline
                autoFocus={!existing}
                placeholder={L.writeHere}
                placeholderTextColor={c.ink3}
                accessibilityLabel={L.writeHere}
                selectionColor={c.primary}
                cursorColor={c.primary}
                textAlignVertical="top"
                autoCapitalize="sentences"
                maxFontSizeMultiplier={1.4}
                style={{ fontFamily: F.sans, fontSize: writeSize, lineHeight: (tamil ? 33 : 30) * scale, color: c.ink, minHeight: 220, padding: 0 }}
              />
            </View>
          </View>
          {photos.length ? (
            <HScroll style={{ marginTop: 12 }}>
              {photos.map((id) => (
                <View key={id}>
                  <PhotoThumb id={id} size={96} />
                  <Pressable
                    onPress={() => setPhotos((p) => p.filter((x) => x !== id))}
                    accessibilityLabel={tr('Remove photo', 'படத்தை நீக்கு')}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: 'rgba(30,26,22,0.6)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon name="close" size={16} color="#F6F2EA" />
                  </Pressable>
                </View>
              ))}
            </HScroll>
          ) : null}
          <HScroll style={{ marginTop: 12 }}>
            <Chip label={tr('Photos', 'படங்கள்')} icon="gallery" onPress={pickPhotos} />
            <Chip label={tr('Camera', 'கேமரா')} icon="photo" onPress={camera} />
            <Chip label={videoBusy ? '…' : tr('Video', 'காணொளி')} icon="video" onPress={pickVideo} />
            <Chip label={tr('Voice note', 'குரல் குறிப்பு')} icon="mic" onPress={() => setRecording(true)} />
          </HScroll>
          {/* Voice notes and videos play right here, so you can check them before keeping the page. */}
          {audio.length || videos.length ? (
            <View style={{ gap: 8, marginHorizontal: 20, marginTop: 10 }}>
              {audio.map((id) => (
                <AudioNote key={id} id={id} onRemove={() => setAudio((a) => a.filter((x) => x !== id))} />
              ))}
              {videos.map((id) => (
                <VideoNote key={id} id={id} onRemove={() => setVideos((v) => v.filter((x) => x !== id))} />
              ))}
            </View>
          ) : null}
          <HScroll style={{ marginTop: 12 }}>
            {MOODS.map((m) => (
              <MoodChip key={m.id} m={m} on={mood === m.id} onPress={() => setMood(mood === m.id ? null : m.id)} />
            ))}
          </HScroll>
          {mood === 'heavy' ? (
            <Pressable onPress={() => router.push('/feeling')} style={{ marginHorizontal: 20, marginTop: 10 }}>
              <Note icon="heart" iconColor={c.heart}>
                {L.heavyLink}
              </Note>
            </Pressable>
          ) : null}
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface2, paddingHorizontal: 8 }}>
          <IconButton name="bold" label={tr('Bold', 'தடித்த எழுத்து')} color={c.ink2} onPress={() => wrap('**')} />
          <IconButton name="italic" label={tr('Italic', 'சாய்வு எழுத்து')} color={c.ink2} onPress={() => wrap('_')} />
          <IconButton name="heading" label={tr('Heading', 'தலைப்பு')} color={c.ink2} onPress={() => linePrefix('# ')} />
          <IconButton name="bullets" label={tr('List', 'பட்டியல்')} color={c.ink2} onPress={() => linePrefix('- ')} />
          <IconButton name="check" label={tr('Checklist', 'சரிபார்ப்புப் பட்டியல்')} color={c.ink2} onPress={() => linePrefix('- [ ] ')} />
          <IconButton name="quote" label={tr('Quote', 'மேற்கோள்')} color={c.ink2} onPress={() => linePrefix('> ')} />
          <View style={{ flex: 1 }} />
          <Valluvar state="writing" size={64} typing={typing} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 6 }}>
          <T v="labelM" color={c.ink3} style={{ flex: 1 }}>
            {L.wordsN(words)}
          </T>
          {draftShown ? (
            <T v="labelM" color={c.aram}>
              {L.draftSaved}
            </T>
          ) : null}
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 12 }}>
          <Button
            label={L.save}
            enabled={canSave}
            onPress={() => {
              done.current = true;
              savePage(current(), close);
            }}
          />
        </View>
      </KeyboardSafe>

      <VoiceRecorder visible={recording} onClose={() => setRecording(false)} onSaved={(id) => setAudio((a) => [...a, id])} />

      <Dialog
        visible={dialog === 'kb'}
        title={L.kbTitle}
        onClose={() => setDialog(null)}
        actions={[
          { label: L.kbLater, onPress: () => setDialog(null) },
          {
            label: L.kbOpen,
            onPress: () => {
              setDialog(null);
              IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.INPUT_METHOD_SETTINGS).catch(() => {});
            },
          },
        ]}>
        <T v="bodyM" color={c.ink2}>{`${L.kbBody}\n\n1. ${L.kb1}\n2. ${L.kb2}\n3. ${L.kb3}`}</T>
      </Dialog>

      <Dialog
        visible={dialog === 'weather'}
        title={tr('Weather', 'வானிலை')}
        onClose={() => setDialog(null)}
        actions={[
          ...(weather
            ? [
                {
                  label: tr('Remove', 'நீக்கு'),
                  onPress: () => {
                    setWeather(null);
                    setDialog(null);
                  },
                },
              ]
            : []),
          { label: L.close, onPress: () => setDialog(null) },
        ]}>
        <Wrap>
          {WEATHER_NAMES.map(([kind, en, ta]) => (
            <Chip key={kind} label={tamil ? ta : en} on={weather?.kind === kind} onPress={() => setWeather({ kind, temp: weather?.temp ?? null })} />
          ))}
        </Wrap>
        <TextLink
          label={fetching ? '…' : tr('Fill in from where I am', 'நான் இருக்கும் இடத்திலிருந்து நிரப்பு')}
          onPress={() => {
            setDialog(null);
            fetchDetails();
          }}
        />
      </Dialog>

      <Dialog
        visible={dialog === 'place'}
        title={tr('Place', 'இடம்')}
        onClose={() => setDialog(null)}
        actions={[
          {
            label: tr('Remove', 'நீக்கு'),
            onPress: () => {
              setPlace(null);
              setDialog(null);
            },
          },
          {
            label: L.save,
            onPress: () => {
              const n = placeInput.trim();
              setPlace(n ? { name: n, lat: place?.lat ?? null, lon: place?.lon ?? null } : null);
              setDialog(null);
            },
          },
        ]}>
        <Field
          value={placeInput}
          onChangeText={setPlaceInput}
          placeholder={tr('Where were you?', 'எங்கே இருந்தீர்கள்?')}
          style={{ backgroundColor: c.surface2 }}
        />
        <TextLink
          label={tr('Use where I am', 'நான் இருக்கும் இடம்')}
          onPress={() => {
            setDialog(null);
            fetchDetails();
          }}
        />
        <T v="labelM" color={c.ink3}>
          {tr('The name is looked up by Android from your rough position.', 'பெயர் உங்கள் தோராயமான இருப்பிடத்திலிருந்து Android-ஆல் கண்டறியப்படும்.')}
        </T>
      </Dialog>

      <Dialog
        visible={dialog === 'tags'}
        title={tr('Tags', 'குறிச்சொற்கள்')}
        onClose={() => setDialog(null)}
        actions={[
          { label: L.cancel, onPress: () => setDialog(null) },
          {
            label: L.save,
            onPress: () => {
              const add = tagInput
                .split(/[,\s]+/)
                .map((t) => t.trim().replace(/^#/, ''))
                .filter(Boolean);
              setTags((t) => [...t, ...add.filter((x) => !t.includes(x))]);
              setDialog(null);
            },
          },
        ]}>
        <Field
          value={tagInput}
          onChangeText={setTagInput}
          placeholder={tr('Add a tag, like family', 'ஒரு குறிச்சொல், எ.கா. குடும்பம்')}
          autoCapitalize="none"
          style={{ backgroundColor: c.surface2 }}
        />
        <Wrap>
          {[...new Set([...tags, ...allTags(entries)])].slice(0, 24).map((t) => (
            <Chip key={t} label={`#${t}`} on={tags.includes(t)} onPress={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />
          ))}
        </Wrap>
      </Dialog>
    </View>
  );
}
