// What happens around a save or a delete: the widget redraws, the reminder is planned again, new seals are recorded
// and celebrated, and a delete can be undone.

import { router } from 'expo-router';

import { STRINGS } from '@/i18n/strings';
import { toast } from '@/ui/toast';
import { refreshWidget } from '@/widget/widgets';

import { today } from './dates';
import type { Day } from './dates';
import { allEntries, deleteEntry, saveEntry, writtenDays } from './journal';
import { planReminders } from './notify';
import { newlyEarned, thread } from './progress';
import type { Seal, Thread } from './progress';
import { earnSeal, settings } from './settings';
import { clearDeletion } from './syncState';
import type { Entry } from './types';

// The thread walks the whole history, so it is worked out once per journal and day, not on every render.
let threadMemo: { list: Entry[]; day: Day; t: Thread } | null = null;

export function currentThread(day: Day = today()): Thread {
  const list = allEntries();
  if (threadMemo && threadMemo.list === list && threadMemo.day === day) return threadMemo.t;
  const t = thread(writtenDays(list), day);
  threadMemo = { list, day, t };
  return t;
}

/** Record any seals newly met, and say which to celebrate. */
export function sealsAfterSave(): Seal[] {
  const fresh = newlyEarned(allEntries(), currentThread(), settings().seals);
  for (const s of fresh) earnSeal(s.id, today());
  return fresh;
}

const L = () => STRINGS[settings().tamil ? 'ta' : 'en'];

/** Save a page and celebrate: a seal if one was earned, otherwise a quiet "Saved". */
export async function savePage(e: Entry, after?: () => void) {
  await saveEntry(e);
  refreshWidget();
  planReminders().catch(() => {});
  const fresh = sealsAfterSave();
  after?.();
  if (fresh.length) router.push({ pathname: '/award', params: { ids: fresh.map((s) => s.id).join(',') } });
  else toast(L().savedMsg);
}

/** Delete with undo: the page comes back if Undo is tapped. */
export async function deletePage(id: string) {
  const gone = await deleteEntry(id);
  if (!gone) return;
  refreshWidget();
  planReminders().catch(() => {});
  toast(L().deleted, {
    label: L().undo,
    run: () => {
      // The deletion is forgotten. Had a sync already carried it to Drive, the page comes back as an edit made now,
      // which is later than the deletion, so the next sync doesn't remove it again.
      const at = clearDeletion(gone.id);
      const synced = at != null && settings().lastDriveSync >= at;
      saveEntry(synced ? { ...gone, updated: Date.now() } : gone)
        .then(() => {
          refreshWidget();
          planReminders().catch(() => {});
        })
        .catch(() => {});
    },
  });
}
