// What happens around a save or a delete: the widget redraws, new seals are recorded and celebrated, and a delete
// can be undone.

import { router } from 'expo-router';

import { STRINGS } from '@/i18n/strings';
import { toast } from '@/ui/toast';
import { refreshWidget } from '@/widget/widgets';

import { today } from './dates';
import { allEntries, deleteEntry, saveEntry, writtenDays } from './journal';
import { newlyEarned, thread } from './progress';
import type { Seal } from './progress';
import { earnSeal, settings } from './settings';
import type { Entry } from './types';

export function currentThread() {
  return thread(writtenDays(allEntries()), today());
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
  toast(L().deleted, { label: L().undo, run: () => saveEntry(gone).then(refreshWidget) });
}
