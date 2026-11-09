// The nightly backup and Drive sync, run by Android when it chooses (about once a day, with enough battery), and
// also when the app opens if the last run was more than a day ago.

import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { backupNow } from './backup';
import { syncQuietly } from './drive';
import { isLoaded, loadJournal } from './journal';
import { reloadSettings, settings } from './settings';

const TASK = 'kuralheart-nightly';
const DAY = 20 * 60 * 60 * 1000;

export async function runNightly(force = false) {
  const s = settings();
  if (!s.hasPassphrase) return;
  if (!isLoaded()) await loadJournal();
  if (s.backupNightly && s.backupFolder && (force || Date.now() - s.lastBackup > DAY)) {
    await backupNow().catch(() => {});
  }
  if (s.driveOn && (force || Date.now() - s.lastDriveSync > DAY)) await syncQuietly();
}

export function defineNightly() {
  TaskManager.defineTask(TASK, async () => {
    try {
      reloadSettings();
      await runNightly();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function planNightly() {
  const s = settings();
  const want = (s.backupNightly && !!s.backupFolder) || s.driveOn;
  const has = await TaskManager.isTaskRegisteredAsync(TASK);
  if (want && !has) await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 12 * 60 });
  if (!want && has) await BackgroundTask.unregisterTaskAsync(TASK);
}
