import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { currentThread } from '@/lib/actions';
import { longDate } from '@/lib/dates';
import { useJournal } from '@/lib/journal';
import { awayFor } from '@/lib/lock';
import { kural } from '@/lib/pack';
import { addPhoto } from '@/lib/photos';
import { setSettings, useSettings } from '@/lib/settings';
import { Avatar, Field } from '@/ui/common';
import { Button, Group, Page, Row, SectionLabel, TextLink } from '@/ui/parts';
import { useUI } from '@/ui/ui';

export default function ProfileScreen() {
  const { c, L, tr, tamil } = useUI();
  const s = useSettings();
  const router = useRouter();
  const { entries } = useJournal();
  const [name, setName] = useState(s.name);
  const [title, setTitle] = useState(s.journalTitle);
  const thread = currentThread();
  const chapters = new Set(entries.map((e) => kural(e.kural).c)).size;
  const save = () => {
    setSettings({ name: name.trim(), journalTitle: title.trim() });
    router.back();
  };
  const pick = async () => {
    const r = await awayFor(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 }));
    if (r.canceled) return;
    const a = r.assets[0];
    setSettings({ avatar: await addPhoto(a.uri, a.width, a.height) });
  };
  return (
    <Page title={tr('Your profile', 'உங்கள் சுயவிவரம்')} onBack={save}>
      <View style={{ alignItems: 'center' }}>
        <Avatar size={112} />
        <TextLink label={tr('Choose a photo', 'படத்தைத் தேர்ந்தெடு')} onPress={pick} />
        {s.avatar ? <TextLink label={tr('Remove photo', 'படத்தை நீக்கு')} color={c.ink3} onPress={() => setSettings({ avatar: '' })} /> : null}
      </View>
      <SectionLabel>{tr('Your name', 'உங்கள் பெயர்')}</SectionLabel>
      <Field value={name} onChangeText={setName} placeholder={tr('What should Valluvar call you?', 'வள்ளுவர் உங்களை எப்படி அழைக்கட்டும்?')} />
      <SectionLabel>{tr('Journal name', 'நாட்குறிப்பின் பெயர்')}</SectionLabel>
      <Field value={title} onChangeText={setTitle} placeholder={tr('My Kural journal', 'என் குறள் நாட்குறிப்பு')} />
      <SectionLabel>{tr('So far', 'இதுவரை')}</SectionLabel>
      <Group>
        <Row title={tr('Pages', 'பக்கங்கள்')} sub={String(entries.length)} divider={false} />
        <Row title={tr('Longest thread', 'நீண்ட தொடர்')} sub={String(thread.longest)} />
        <Row title={tr('Chapters written on', 'எழுதிய அதிகாரங்கள்')} sub={`${chapters} / 133`} />
        <Row title={tr('Couplets read', 'படித்த குறள்கள்')} sub={`${s.read.length} / 1330`} />
        <Row title={tr('Seals', 'முத்திரைகள்')} sub={`${Object.keys(s.seals).length} / 9`} />
        {s.startedOn ? <Row title={tr('With Valluvar since', 'வள்ளுவருடன் தொடங்கியது')} sub={longDate(s.startedOn, tamil, true)} /> : null}
      </Group>
      <Group style={{ marginTop: 12 }}>
        <Row title={tr('Insights', 'புள்ளிவிவரங்கள்')} sub={tr('Words, feelings, times and chapters', 'சொற்கள், உணர்வுகள், நேரங்கள், அதிகாரங்கள்')} icon="chart" divider={false} onPress={() => router.push('/journey/insights')} />
        <Row title={tr('Atlas', 'வரைபடம்')} sub={tr('Your pages on a map', 'வரைபடத்தில் உங்கள் பக்கங்கள்')} icon="map" onPress={() => router.push('/atlas')} />
      </Group>
      <Button label={L.save} onPress={save} style={{ marginTop: 16 }} />
    </Page>
  );
}
