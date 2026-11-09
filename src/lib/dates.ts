// Calendar days as ISO strings (YYYY-MM-DD) in the phone's own time zone.

export type Day = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function dayOf(d: Date): Day {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): Day {
  return dayOf(new Date());
}

export function parseDay(s: Day): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(s: Day, n: number): Day {
  const d = parseDay(s);
  d.setDate(d.getDate() + n);
  return dayOf(d);
}

/** Monday of the week that holds [s]. */
export function mondayOf(s: Day): Day {
  const d = parseDay(s);
  const back = (d.getDay() + 6) % 7;
  return addDays(s, -back);
}

/** Whole days since 1970-01-01, like Kotlin's toEpochDay. */
export function epochDay(s: Day): number {
  const [y, m, d] = s.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TA_MONTHS = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TA_DAYS = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];

export function monthName(m: number, tamil: boolean) {
  return (tamil ? TA_MONTHS : EN_MONTHS)[m];
}

/** "Monday, 9 November" (with the year when it isn't this year). */
export function longDate(s: Day, tamil: boolean, withYear = false): string {
  const d = parseDay(s);
  const showYear = withYear || d.getFullYear() !== new Date().getFullYear();
  const day = (tamil ? TA_DAYS : EN_DAYS)[d.getDay()];
  return `${day}, ${d.getDate()} ${monthName(d.getMonth(), tamil)}${showYear ? ' ' + d.getFullYear() : ''}`;
}

export function shortDate(s: Day, tamil: boolean): string {
  const d = parseDay(s);
  const m = monthName(d.getMonth(), tamil);
  const showYear = d.getFullYear() !== new Date().getFullYear();
  return `${d.getDate()} ${tamil ? m : m.slice(0, 3)}${showYear ? ' ' + d.getFullYear() : ''}`;
}

export function weekdayShort(s: Day, tamil: boolean): string {
  const d = parseDay(s).getDay();
  return tamil ? TA_DAYS[d].slice(0, 2) : EN_DAYS[d].slice(0, 3);
}

export function clock(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function minutesLabel(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
