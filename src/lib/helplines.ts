// Support lines for a very heavy day, by country. Each number was checked against the service's own site or the
// government's notice (November 2026): Tele MANAS (India's Ministry of Health), NIMH Sri Lanka's 1926, Samaritans of
// Singapore, Befrienders Kuala Lumpur, Samaritans (UK and Ireland), 988 (US and Canada), Lifeline Australia.
// Check them again before each release that touches this file; a wrong number on a heavy day is worse than none.

export type Line = { name: string; nameTa?: string; number: string; dial: string; note: string; noteTa: string };
export type Country = { id: string; en: string; ta: string; emergency: string; lines: Line[] };

export const COUNTRIES: Country[] = [
  {
    id: 'IN',
    en: 'India',
    ta: 'இந்தியா',
    emergency: '112',
    lines: [
      {
        name: 'Tele MANAS',
        number: '14416',
        dial: '14416',
        note: 'Free, day and night, in Tamil and other languages',
        noteTa: 'இலவசம், இரவும் பகலும், தமிழிலும் பிற மொழிகளிலும்',
      },
    ],
  },
  {
    id: 'LK',
    en: 'Sri Lanka',
    ta: 'இலங்கை',
    emergency: '119',
    lines: [{ name: 'NIMH 1926', number: '1926', dial: '1926', note: 'National Mental Health Helpline', noteTa: 'தேசிய மனநல உதவி எண்' }],
  },
  {
    id: 'SG',
    en: 'Singapore',
    ta: 'சிங்கப்பூர்',
    emergency: '995',
    lines: [{ name: 'Samaritans of Singapore', number: '1767', dial: '1767', note: 'Any time, day or night', noteTa: 'எந்நேரமும், இரவும் பகலும்' }],
  },
  {
    id: 'MY',
    en: 'Malaysia',
    ta: 'மலேசியா',
    emergency: '999',
    lines: [{ name: 'Befrienders Kuala Lumpur', number: '03-7627 2929', dial: '+60376272929', note: 'Free and confidential, any time', noteTa: 'இலவசம், ரகசியம், எந்நேரமும்' }],
  },
  {
    id: 'GB',
    en: 'UK and Ireland',
    ta: 'பிரிட்டன், அயர்லாந்து',
    emergency: '999',
    lines: [{ name: 'Samaritans', number: '116 123', dial: '116123', note: 'Free, any time, day or night', noteTa: 'இலவசம், எந்நேரமும்' }],
  },
  {
    id: 'US',
    en: 'United States',
    ta: 'அமெரிக்கா',
    emergency: '911',
    lines: [{ name: '988 Lifeline', number: '988', dial: '988', note: 'Call or text, any time', noteTa: 'அழைக்கலாம் அல்லது செய்தி அனுப்பலாம், எந்நேரமும்' }],
  },
  {
    id: 'CA',
    en: 'Canada',
    ta: 'கனடா',
    emergency: '911',
    lines: [{ name: '988', number: '988', dial: '988', note: 'Call or text, any time, in English or French', noteTa: 'அழைக்கலாம் அல்லது செய்தி அனுப்பலாம், எந்நேரமும்' }],
  },
  {
    id: 'AU',
    en: 'Australia',
    ta: 'ஆஸ்திரேலியா',
    emergency: '000',
    lines: [{ name: 'Lifeline', number: '13 11 14', dial: '131114', note: 'Any time, day or night', noteTa: 'எந்நேரமும், இரவும் பகலும்' }],
  },
];

/** For the world beyond the list: an independent directory of free helplines, kept up to date. */
export const ELSEWHERE_URL = 'https://findahelpline.com';

const ZONES: Record<string, string> = {
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Colombo': 'LK',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Kuching': 'MY',
  'Europe/London': 'GB',
  'Europe/Dublin': 'GB',
};

/** The phone's country, from its region setting or, failing that, its time zone. India when it can't tell. */
export function homeCountry(): Country {
  let id = '';
  try {
    const o = Intl.DateTimeFormat().resolvedOptions();
    const region = /[-_]([A-Z]{2})\b/.exec(o.locale ?? '')?.[1] ?? '';
    id = region === 'IE' ? 'GB' : region;
    if (!COUNTRIES.some((c) => c.id === id)) id = ZONES[o.timeZone ?? ''] ?? (o.timeZone?.startsWith('Australia/') ? 'AU' : '');
  } catch {
    id = '';
  }
  return COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0];
}
