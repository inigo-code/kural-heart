import * as Linking from 'expo-linking';
import { View } from 'react-native';

import { Group, Page, T, TextLink } from '@/ui/parts';
import { useUI } from '@/ui/ui';

export default function SourcesScreen() {
  const { c, L, tr } = useUI();
  const items: { title: string; body: string; tag?: string }[] = [
    {
      title: tr('The couplets in Tamil', 'தமிழ்க் குறள்கள்'),
      body: tr(
        'Project Madurai’s Thirukkural e-text (no. 0001), checked line by line against its e-text 0017 and a third copy. 1,305 couplets agree, 12 were settled by vote, and 13 lines were chosen by hand.',
        'மதுரைத் திட்டத்தின் திருக்குறள் மின்னூல் (எண் 0001), அதன் மின்னூல் 0017-உடனும் மூன்றாவது பிரதியுடனும் வரிவரியாக ஒப்பிடப்பட்டது. 1,305 குறள்கள் ஒத்துப்போகின்றன; 12 பெரும்பான்மைப்படி முடிவாயின; 13 வரிகள் கையால் தேர்ந்தெடுக்கப்பட்டன.',
      ),
      tag: L.publicDomain,
    },
    {
      title: tr('English', 'ஆங்கில மொழிபெயர்ப்பு'),
      body: tr(
        'V. V. S. Aiyar, 1916, from Standard Ebooks. G. U. Pope, 1886, verse and prose, from Project Madurai’s e-text 0153.',
        'வ. வே. சு. ஐயர், 1916, Standard Ebooks-இலிருந்து. ஜி. யு. போப், 1886, செய்யுளும் உரைநடையும், மதுரைத் திட்டத்தின் மின்னூல் 0153-இலிருந்து.',
      ),
      tag: L.publicDomain,
    },
    {
      title: tr('Tamil explanation', 'தமிழ் உரை'),
      body: tr(
        'Mu. Varadarasanar’s Thirukkural Thelivurai (1969), a book nationalised by the Government of Tamil Nadu (CC0), from Tamil Wikisource’s transcription, matched to each couplet. 1,329 of the 1,330 couplets have it.',
        'மு. வரதராசனாரின் திருக்குறள் தெளிவுரை (1969), தமிழ்நாடு அரசு நாட்டுடைமையாக்கிய நூல் (CC0). தமிழ் விக்கிமூலத்தின் தட்டச்சுப் பதிப்பிலிருந்து, ஒவ்வொரு குறளுடனும் ஒப்பிட்டுச் சேர்க்கப்பட்டது. 1,330-இல் 1,329 குறள்களுக்கு உரை உள்ளது.',
      ),
      tag: L.publicDomain,
    },
    {
      title: tr('For daily life, and the questions', 'அன்றாட வாழ்வுக்கும் கேள்விகளும்'),
      body: tr(
        'The short notes on living each couplet, and the questions to write about, were written for Kural Heart in English and Tamil. They are a reader’s suggestions, not a commentary.',
        'ஒவ்வொரு குறளையும் வாழ்வில் கொள்ளும் சிறு குறிப்புகளும் எழுதுவதற்கான கேள்விகளும் Kural Heart-க்காக ஆங்கிலத்திலும் தமிழிலும் எழுதப்பட்டவை. இவை ஒரு வாசகரின் பரிந்துரைகள்; உரை அல்ல.',
      ),
    },
    {
      title: tr('Other commentaries', 'பிற உரைகள்'),
      body: tr(
        'Kalaignar Karunanidhi’s and Solomon Pappaiah’s commentaries are under copyright and aren’t included. Parimelazhagar’s classic commentary may follow when a checked digital text is found.',
        'கலைஞர் கருணாநிதி, சாலமன் பாப்பையா ஆகியோரின் உரைகள் பதிப்புரிமைக்கு உட்பட்டவை; அதனால் சேர்க்கப்படவில்லை. சரிபார்த்த மின்பதிப்பு கிடைத்தால் பரிமேலழகர் உரை பின்னர் வரலாம்.',
      ),
    },
    {
      title: tr('Type', 'எழுத்துருக்கள்'),
      body: tr(
        'Anek Tamil, Noto Serif Tamil and Literata, under the SIL Open Font License.',
        'Anek Tamil, Noto Serif Tamil, Literata: SIL Open Font License உரிமத்தின் கீழ்.',
      ),
    },
    {
      title: tr('Valluvar', 'வள்ளுவர்'),
      body: tr('Drawn for Kural Heart. White robes, no marks: a teacher for everyone.', 'Kural Heart-க்காக வரையப்பட்டவர். வெண்ணாடை, எந்தக் குறியும் இல்லை: எல்லோருக்குமான ஆசான்.'),
    },
    {
      title: tr('Online', 'இணையம்'),
      body: tr(
        'Weather from Open-Meteo. Place names from Android’s geocoder. Maps from OpenStreetMap. Drive sync through Google. Updates from Expo. Each only when you use it.',
        'வானிலை Open-Meteo-விலிருந்து. இடப் பெயர்கள் Android-இலிருந்து. வரைபடங்கள் OpenStreetMap-இலிருந்து. Drive ஒத்திசைவு Google வழியாக. புதுப்பிப்புகள் Expo-விலிருந்து. ஒவ்வொன்றும் நீங்கள் பயன்படுத்தும்போது மட்டுமே.',
      ),
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
                <View style={{ alignSelf: 'flex-start', marginTop: 6, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: c.aramSoft }}>
                  <T v="labelM" color={c.aram}>
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
