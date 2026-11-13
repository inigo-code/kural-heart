import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Group, Icon, Page, Row, SectionLabel, T } from '@/ui/parts';
import { useUI } from '@/ui/ui';

const ICON = require('../../assets/icon.png');
const LOGO = require('../../assets/heart-apps.png');
const APPS = [
  { name: 'Prompt Heart', en: 'For the AI prompts that work', ta: 'பயன்தரும் AI கட்டளைகளுக்கு', url: 'https://inigo-code.github.io/prompt-heart-site/', icon: require('../../assets/prompt-heart.png') },
  { name: 'Watch Heart', en: 'A diary for films and shows', ta: 'திரைப்படங்களுக்கும் தொடர்களுக்கும் ஒரு நாட்குறிப்பு', url: 'https://inigo-code.github.io/watch-heart-site/', icon: require('../../assets/watch-heart.png') },
];

export default function AboutScreen() {
  const { c, L, tr } = useUI();
  const router = useRouter();
  return (
    <Page title={L.sAbout}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Image source={ICON} style={{ width: 88, height: 88, borderRadius: 22 }} />
        <View style={{ flex: 1 }}>
          <T v="headline">Kural Heart</T>
          <T v="labelM" color={c.ink3}>
            {tr(`Version ${Constants.expoConfig?.version ?? ''} · made by Inigo`, `பதிப்பு ${Constants.expoConfig?.version ?? ''} · உருவாக்கியவர் Inigo`)}
          </T>
        </View>
      </View>
      <T v="body" color={c.ink2} style={{ marginTop: 16 }}>
        {L.aboutLede}
      </T>
      <SectionLabel>{L.heartApps}</SectionLabel>
      {/* The Heart Apps card: the mark and its line, the other apps, and the way home (as on the website). */}
      <View style={{ backgroundColor: c.surface, borderRadius: 24, padding: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Image source={LOGO} style={{ width: 48, height: 48, borderRadius: 12 }} />
          <View style={{ flex: 1 }}>
            <T v="title">Heart Apps</T>
            <T v="labelM" color={c.ink3}>
              {tr('Free Android apps by Inigo. No ads, no tracking, nothing to buy.', 'Inigo-வின் இலவச Android செயலிகள். விளம்பரம் இல்லை, கண்காணிப்பு இல்லை, வாங்க எதுவும் இல்லை.')}
            </T>
          </View>
        </View>
        {APPS.map((a) => (
          <Pressable
            key={a.name}
            onPress={() => Linking.openURL(a.url)}
            accessibilityRole="link"
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 10, backgroundColor: pressed ? c.surface3 : c.surface2 })}>
            <Image source={a.icon} style={{ width: 40, height: 40, borderRadius: 10 }} />
            <View style={{ flex: 1 }}>
              <T v="label">{a.name}</T>
              <T v="labelM" color={c.ink3}>
                {tr(a.en, a.ta)}
              </T>
            </View>
            <Icon name="share" size={16} color={c.ink3} />
          </Pressable>
        ))}
        <Pressable onPress={() => Linking.openURL('https://inigo-code.github.io/')} accessibilityRole="link" style={{ alignSelf: 'flex-start', borderRadius: 18, backgroundColor: c.primarySoft, paddingHorizontal: 16, paddingVertical: 8 }}>
          <T v="label" color={c.onSoft}>
            {tr('All Heart Apps', 'எல்லா Heart Apps')}
          </T>
        </Pressable>
      </View>
      <Group style={{ marginTop: 12 }}>
        <Row title={L.sSources} divider={false} onPress={() => router.replace('/sources')} />
        <Row title="inigo@tosstheworld.org" sub={tr('Write to Inigo', 'Inigo-வுக்கு எழுதுங்கள்')} onPress={() => Linking.openURL('mailto:inigo@tosstheworld.org?subject=Kural%20Heart')} />
      </Group>
    </Page>
  );
}
