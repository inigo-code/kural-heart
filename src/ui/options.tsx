import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { setSettings, useSettings } from '@/lib/settings';
import { BUILT_IN, isOnline, tryBuiltIn, tryVoice, voiceSettings, voicesFor } from '@/lib/speak';
import type { Voice } from '@/lib/speak';

import { Sheet } from './common';
import { Icon, T, TextLink } from './parts';
import { F } from './theme';
import { useUI } from './ui';

export type Option<V> = { value: V; title: string; sub?: string; sample?: string };

function Radio({ on }: { on: boolean }) {
  const { c } = useUI();
  return (
    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: on ? c.primary : c.ink3, alignItems: 'center', justifyContent: 'center' }}>
      {on ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.primary }} /> : null}
    </View>
  );
}

/** A sheet of choices, each with a line saying what it means, and a sample where that helps. */
export function OptionSheet<V extends string | number>({
  visible,
  title,
  lede,
  options,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  title: string;
  lede?: string;
  options: Option<V>[];
  value: V;
  onChange: (v: V) => void;
  onClose: () => void;
}) {
  const { c } = useUI();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T v="headline">{title}</T>
      {lede ? (
        <T v="bodyM" color={c.ink2} style={{ marginTop: 6 }}>
          {lede}
        </T>
      ) : null}
      <View style={{ gap: 10, marginTop: 16 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => {
                onChange(o.value);
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={{ flexDirection: 'row', gap: 14, padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: on ? c.primary : c.line, backgroundColor: on ? c.primarySoft : c.surface }}>
              <Radio on={on} />
              <View style={{ flex: 1, gap: 4 }}>
                <T v="title" color={on ? c.onSoft : c.ink}>
                  {o.title}
                </T>
                {o.sub ? (
                  <T v="labelM" color={on ? c.onSoft : c.ink3}>
                    {o.sub}
                  </T>
                ) : null}
                {o.sample ? (
                  <T v="bodyM" color={on ? c.onSoft : c.ink2} numberOfLines={4} style={{ marginTop: 4, fontFamily: F.serifItalic }}>
                    {o.sample}
                  </T>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

/** One choice in the voice list: a radio, its name and where it speaks from, and Try. */
function VoiceChoice({ on, title, sub, onPick, onTry }: { on: boolean; title: string; sub: string; onPick: () => void; onTry: () => void }) {
  const { c, tr } = useUI();
  return (
    <Pressable
      onPress={onPick}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: on ? c.primary : c.line, backgroundColor: on ? c.primarySoft : c.surface }}>
      <Radio on={on} />
      <View style={{ flex: 1 }}>
        <T v="title" color={on ? c.onSoft : c.ink}>
          {title}
        </T>
        <T v="labelM" color={on ? c.onSoft : c.ink3}>
          {sub}
        </T>
      </View>
      <Pressable
        onPress={onTry}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={tr('Try this voice', 'இந்தக் குரலைக் கேள்')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: c.surface2 }}>
        <Icon name="play" size={16} color={c.ink2} />
        <T v="label">{tr('Try', 'கேள்')}</T>
      </Pressable>
    </Pressable>
  );
}

/**
 * Choose the voice for one language, with Try beside each. Tamil starts with the app's own recordings (the default);
 * then the phone's voices, one entry per voice, saying whether each needs the internet.
 */
export function VoiceSheet({ lang, visible, onClose, sample, n }: { lang: 'ta' | 'en'; visible: boolean; onClose: () => void; sample: string; n: number }) {
  const { c, tr } = useUI();
  const s = useSettings();
  const [list, setList] = useState<Voice[] | null>(null);
  useEffect(() => {
    // Read afresh each time, so voices just added in Android's settings show up.
    if (visible) voicesFor(lang, true).then(setList);
  }, [visible, lang]);
  const chosen = lang === 'ta' ? s.voiceTa : s.voiceEn;
  const set = (id: string) => setSettings(lang === 'ta' ? { voiceTa: id } : { voiceEn: id });
  const known = !!list?.some((x) => x.id === chosen);
  // As Listen does: Tamil falls back to the recordings, English to the best phone voice.
  const builtInOn = lang === 'ta' && !known;
  const where = (v: Voice) =>
    `${v.language} · ${isOnline(v) ? tr('needs internet', 'இணையம் தேவை') : tr('on this phone', 'இந்த அலைபேசியில்')}${v.quality === 'Enhanced' ? tr(' · clearer', ' · தெளிவானது') : ''}`;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T v="headline">{lang === 'ta' ? tr('Tamil voice', 'தமிழ்க் குரல்') : tr('English voice', 'ஆங்கிலக் குரல்')}</T>
      <T v="bodyM" color={c.ink2} style={{ marginTop: 6 }}>
        {lang === 'ta'
          ? tr(
              'Kural Heart’s own voice reads every couplet the same way on any phone, even offline. Your phone’s voices are below; tap Try to hear each.',
              'Kural Heart குரல் எந்த அலைபேசியிலும், இணையம் இல்லாமலும் ஒவ்வொரு குறளையும் ஒரே மாதிரிப் படிக்கும். உங்கள் அலைபேசியின் குரல்கள் கீழே; ஒவ்வொன்றையும் கேட்க "கேள்" தொடவும்.',
            )
          : tr('These are the voices on this phone. Tap Try to hear each one.', 'இவை இந்த அலைபேசியில் உள்ள குரல்கள். ஒவ்வொன்றையும் கேட்க "கேள்" தொடவும்.')}
      </T>
      <View style={{ gap: 10, marginTop: 16 }}>
        {lang === 'ta' ? (
          <VoiceChoice
            on={builtInOn}
            title={tr('Kural Heart voice', 'Kural Heart குரல்')}
            sub={tr('Natural Tamil, recorded for every couplet · works offline', 'இயல்பான தமிழ், ஒவ்வொரு குறளுக்கும் பதிவு · இணையம் தேவையில்லை')}
            onPick={() => set(BUILT_IN)}
            onTry={() => tryBuiltIn(n, s.speechRate)}
          />
        ) : null}
        {!list ? <ActivityIndicator color={c.primary} style={{ marginTop: 8 }} /> : null}
        {list && list.length === 0 && lang === 'en' ? (
          <T v="bodyM" color={c.heart}>
            {tr('No English voice is installed yet.', 'ஆங்கிலக் குரல் இன்னும் நிறுவப்படவில்லை.')}
          </T>
        ) : null}
        {(list ?? []).map((v, i) => (
          <VoiceChoice
            key={v.id}
            on={lang === 'ta' ? known && chosen === v.id : known ? chosen === v.id : i === 0}
            title={`${tr('Phone voice', 'அலைபேசிக் குரல்')} ${i + 1}`}
            sub={where(v)}
            onPick={() => set(v.id)}
            onTry={() => tryVoice(v, sample, s.speechRate)}
          />
        ))}
      </View>
      <TextLink label={tr('Add voices in Android settings', 'Android அமைப்புகளில் குரல்களைச் சேர்')} onPress={voiceSettings} />
    </Sheet>
  );
}
