import * as Linking from 'expo-linking';
import { View } from 'react-native';

import { Group, Page, T, TextLink } from '@/ui/parts';
import { useUI } from '@/ui/ui';

export default function SourcesScreen() {
  const { c, L, tamil } = useUI();
  const items: { title: string; body: string; tag?: string; ok?: boolean }[] = [
    {
      title: tamil ? 'தமிழ்க் குறள்கள்' : 'The couplets in Tamil',
      body: 'Project Madurai’s Thirukkural e-text (no. 0001), checked line by line against its e-text 0017 and a third copy. 1,305 couplets agree, 12 were settled by vote, and 13 lines were chosen by hand.',
      tag: L.reviewPending,
    },
    {
      title: tamil ? 'ஆங்கில மொழிபெயர்ப்பு' : 'English',
      body: 'V. V. S. Aiyar, 1916, from Standard Ebooks. G. U. Pope, 1886, verse and prose, from Project Madurai’s e-text 0153.',
      tag: L.publicDomain,
      ok: true,
    },
    { title: tamil ? 'கேள்விகள்' : 'Questions', body: `Written for Kural Heart in English and Tamil. ${L.draftNote}`, tag: L.reviewPending },
    { title: 'Type', body: 'Anek Tamil, Noto Serif Tamil and Literata, under the SIL Open Font License.' },
    { title: 'Valluvar', body: 'Drawn for Kural Heart. White robes, no marks: a teacher for everyone.' },
    {
      title: tamil ? 'தமிழ் உரை' : 'Tamil explanation',
      body: tamil
        ? 'மு. வரதராசனாரின் திருக்குறள் தெளிவுரை (1969), தமிழ்நாடு அரசு நாட்டுடைமையாக்கிய நூல் (CC0). தமிழ் விக்கிமூலத்தின் தட்டச்சுப் பதிப்பிலிருந்து, ஒவ்வொரு குறளுடனும் ஒப்பிட்டுச் சேர்க்கப்பட்டது. 1,330-இல் 1,329 குறள்களுக்கு உரை உள்ளது.'
        : 'Mu. Varadarasanar’s Thirukkural Thelivurai (1969), a book nationalised by the Government of Tamil Nadu (CC0), from Tamil Wikisource’s transcription, matched to each couplet. 1,329 of the 1,330 couplets have it.',
      tag: L.publicDomain,
      ok: true,
    },
    {
      title: tamil ? 'Kural Heart குரல்' : 'The Kural Heart voice',
      body: tamil
        ? 'ஒவ்வொரு குறளும் Piper "ta_IN rasa female" என்ற திறந்த தமிழ்க் குரலில் ஒருமுறை பதிவுசெய்யப்பட்டது. AI4Bharat-இன் Rasa தரவுத்தொகுப்பில் பயிற்றுவிக்கப்பட்டது, CC BY 4.0.'
        : 'Every couplet recorded once with Piper’s open Tamil voice “ta_IN rasa female” (huggingface.co/tinisoft), trained on AI4Bharat’s Rasa dataset. CC BY 4.0.',
    },
    {
      title: tamil ? 'பிற உரைகள்' : 'Other commentaries',
      body: 'Kalaignar Karunanidhi’s and Solomon Pappaiah’s commentaries are under copyright and aren’t included. Parimelazhagar’s classic commentary may follow when a checked digital text is found.',
    },
    {
      title: tamil ? 'இணையம்' : 'Online',
      body: 'Weather from Open-Meteo. Place names from Android’s geocoder. Maps from OpenStreetMap. Drive sync through Google. Updates from Expo. Each only when you use it.',
    },
  ];
  return (
    <Page title={L.sSources}>
      <T v="body" color={c.ink2}>
        {L.sourcesLede}
      </T>
      <Group style={{ marginTop: 16 }}>
        {items.map((it, i) => (
          <View key={it.title}>
            {i > 0 ? <View style={{ height: 1, backgroundColor: c.line }} /> : null}
            <View style={{ padding: 16 }}>
              <T v="title">{it.title}</T>
              <T v="bodyM" color={c.ink2}>
                {it.body}
              </T>
              {it.tag ? (
                <View style={{ alignSelf: 'flex-start', marginTop: 6, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: it.ok ? c.aramSoft : c.primarySoft }}>
                  <T v="labelM" color={it.ok ? c.aram : c.onSoft}>
                    {it.tag}
                  </T>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </Group>
      <TextLink
        label={L.reportMistake}
        onPress={() => Linking.openURL('mailto:inigo@tosstheworld.org?subject=Kural%20Heart%3A%20a%20mistake%20in%20a%20couplet')}
      />
    </Page>
  );
}
