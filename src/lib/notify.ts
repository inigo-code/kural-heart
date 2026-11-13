// The daily reminder. Android can't run code at the reminder's moment without a background service, so the app
// plans the next week of reminders whenever it opens: today's names the actual couplet, the later ones only say a
// new couplet is waiting (the day's couplet is chosen when the app is opened that day). With the app lock on, no
// reminder shows a couplet.

import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays, parseDay, today } from './dates';
import { todayKural } from './daily';
import { allEntries } from './journal';
import { chapterOf, kural } from './pack';
import { settings } from './settings';

// The reminder pops up over whatever is open (high importance). Android keeps a channel's importance as first made, so
// the louder one has a new id and the old, quiet one is removed.
const CHANNEL = 'daily_couplet_popup';
const OLD_CHANNEL = 'daily_couplet';
const CATEGORY = 'couplet';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

let prepared = false;

async function prepare(tamil: boolean) {
  if (Platform.OS === 'android') {
    await Notifications.deleteNotificationChannelAsync(OLD_CHANNEL).catch(() => {});
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: tamil ? 'இன்றைய குறள்' : 'Daily couplet',
      description: tamil ? 'நாளுக்கு ஒருமுறை, அன்றைய குறளுடன் ஒரு மென்மையான நினைவூட்டல்.' : 'One gentle reminder a day with the day’s kural.',
      importance: AndroidImportance.HIGH,
      lightColor: '#B4492A',
    });
  }
  await Notifications.setNotificationCategoryAsync(CATEGORY, [
    { identifier: 'write', buttonTitle: tamil ? 'எழுது' : 'Write', options: { opensAppToForeground: true } },
  ]);
  prepared = true;
}

export async function canNotify(): Promise<boolean> {
  const p = await Notifications.getPermissionsAsync();
  return p.granted;
}

export async function askNotify(): Promise<boolean> {
  const p = await Notifications.requestPermissionsAsync();
  return p.granted;
}

// Plans run one after another: two at once could each clear the list and then both fill it, doubling the reminders.
let planning: Promise<void> = Promise.resolve();

/**
 * Plan the next seven reminders (or clear them when reminders are off). Today's is left out once a page has been
 * written today, so plan again after a save, a delete, an undo or a restore.
 */
export function planReminders(): Promise<void> {
  const run = planning.then(plan);
  planning = run.catch(() => {});
  return run;
}

async function plan() {
  const s = settings();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!s.reminderOn || !s.onboarded) return;
  if (!(await canNotify())) return;
  if (!prepared) await prepare(s.tamil);
  const now = Date.now();
  const t = today();
  const writtenToday = allEntries().some((e) => e.date === t);
  for (let i = 0; i < 7; i++) {
    const day = addDays(t, i);
    const at = parseDay(day);
    at.setHours(Math.floor(s.reminderMinutes / 60), s.reminderMinutes % 60, 0, 0);
    if (at.getTime() <= now || (i === 0 && writtenToday)) continue;
    let title: string;
    let body: string;
    if (i === 0 && !s.lockOn) {
      const k = kural(todayKural());
      const ch = chapterOf(k);
      title = s.tamil ? `இன்றைய குறள் · ${ch.ta}` : `Today's couplet · ${ch.en}`;
      body = `${k.a}\n${k.b}`;
    } else {
      title = s.tamil ? 'இன்றைய குறள்' : "Today's couplet";
      body = s.tamil ? 'இன்றைய குறள் காத்திருக்கிறது.' : "Today's couplet is waiting.";
    }
    await Notifications.scheduleNotificationAsync({
      content: { title, body, categoryIdentifier: CATEGORY, data: { kind: 'reminder' }, color: '#B4492A' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
    });
  }
}
