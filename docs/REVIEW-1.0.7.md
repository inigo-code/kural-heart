# Kural Heart 1.0.7: review and plan

A pass over the whole app on 13 November 2026 (libraries, every screen, backup and sync). What was found, and
what to do about it, in the order it should be built. Everything here lands in 1.0.7, which is not released yet.

## A. Bugs that can lose or duplicate pages (do first)

### A1. A deleted page comes back after the next Drive sync
`syncDrive` downloads the Drive copy and `mergeEntries` adds every page this phone doesn't have. A page deleted
here is "missing", so it is added again, then uploaded again. Deleting only sticks if Drive sync is off.

Fix: remember deletions.
- New `src/lib/syncState.ts`, its own kv-store value (`kuralheart/sync`), not part of settings:
  `{ exported: Record<id, updatedStamp>, deleted: Record<id, deletedAtMs> }`.
- `deleteEntry` records a tombstone, but only for a page that was ever exported (its id is in `exported`), so drafts
  never leave one. Undo (`deletePage`'s undo) clears it. "Delete everything" clears the whole sync state.
- The backup payload gains `deleted` (the tombstone map). Format stays 3; older readers ignore the key.
- Import has two modes:
  - `sync` (Drive sync, nightly): tombstones are merged both ways (latest time wins). An incoming page whose
    tombstone is at or after its `updated` is skipped. A local page with such a tombstone from the other phone is
    deleted here.
  - `restore` (the person picks a backup file, or a new phone opens its Drive copy for the first time): tombstones
    are ignored and pages brought back lose theirs. Restoring a file is how a deleted page is deliberately recovered.
- Tombstones older than 400 days are dropped.
- `MergeResult` gains `removed`; the sync message says so when it is above zero, in both languages.

### A2. Editing a page that was already synced makes a duplicate
`mergeEntries` keeps both whenever `updated` and the text differ. It can't tell "I edited my page since the last
sync" from "both phones edited it", so every edit of a synced page leaves a copy of the old version after the next
sync.

Fix: use `exported[id]`, the `updated` stamp of the version last sent out (set only after an upload or folder write
succeeded, from the stamps taken when the export was made, not after).
For an incoming page `e` and this phone's `mine` with the same id and different `updated`:
1. `e.updated === exported[id]`: the incoming one is what we already sent; mine is a later edit. Keep mine.
2. `mine.updated === exported[id]`: mine hasn't changed since; the other phone edited it. Take `e`.
3. Text is the same: the newer `updated` wins.
4. `exported[id]` exists and `e.updated < exported[id]`: an older ancestor (an old backup file). Keep mine.
5. Otherwise both changed: keep both (as today).

Keep this decision in one pure function so it can be read and checked case by case.

### A3. Every photo, voice note and video can be deleted at start
`_layout.tsx` runs `loadJournal().catch(() => {}).finally(...)` and then `purgeMedia(keep)`. If the journal fails
to open (database or key error) the list is empty and every media file is purged. Pages that fail to decrypt are
skipped silently, and their media is purged too.

Fix: `loadJournal` reports how many rows failed. Purge only when the load succeeded and nothing failed. If the load
failed or rows failed, show it plainly (a banner on Journal: "n pages couldn't be opened on this phone", both
languages) rather than an empty journal.

### A4. Two syncs or backups can run at once
The nightly run at app start and a tap on "Sync now" can overlap; both read, merge and upload. One queue for
`syncDrive`, `openDriveCopy`, `backupNow` and imports, so they run one after another.

## B. Bugs that are wrong but lose nothing

- **B1. The day doesn't change while the app stays open.** `today()` is read during render and nothing re-renders at
  midnight, so Today can show yesterday's couplet and date until something else changes. Add a `useToday()` hook
  (re-checks each minute and on returning to the app) and use it on Today, Journal, Journey, Insights and Settings.
  On a change: refresh the widget and plan reminders again.
- **B2. The reminder still fires on a day already written.** `planReminders` skips today's only by time. Skip it when
  a page was written today, and plan again after a save, a delete, an undo and a restore.
- **B3. "Keep writing" opens a new page.** Today's button reads "Keep writing" when any page exists today but only
  reopens one on today's couplet. Label and target should both follow that one page.
- **B4. The thread is recomputed on every render, slowly.** `thread()` walks the whole history once per written day
  (quadratic), on Today, Journey, Insights and Settings. Compute the longest run in one pass and cache the result per
  journal snapshot and day.
- **B5. Drive picks any file if two exist.** `findFile` takes the first match; order by `modifiedTime desc`.
- **B6. The whole journal is uploaded every night even when nothing changed.** Keep a small fingerprint of what was
  last uploaded (ids and stamps, tombstones, the exported prefs); skip the upload when the download brought nothing
  and the fingerprint is the same. Saves data and battery; `lastDriveSync` still moves.
- **B7. The weather lookup has no time limit.** Give `weatherAt` a 10 second limit so "…" can't sit forever.
- **B8. A restored phone forgets some choices.** `exportPrefs` and the fresh-phone restore leave out pronunciation
  on/off, reduce motion (exported, never restored), "then read the English" and the speech speed. Carry them.

## C. Ease of use

- **C1. Edit returns to the page.** `page/[id]` replaces itself with Write, so saving lands on the list. Push Write
  instead, so Save or Close comes back to the page, now showing the edit.
- **C2. On this day, any year.** Journal shows a page from exactly a year ago. Show the most recent earlier year that
  has one, and say how long ago ("On this day, 2 years ago"), in both languages.
- **C3. Chapters and seals on Journey answer a tap.** A chapter dot opens its chapter. A seal opens a small dialog:
  what it is for, when it was earned or how far along it is.
- **C4. Journal search finds more.** Also match the chapter's name (English and Tamil), the feeling's name and a tag
  typed in part.
- **C5. The share screen remembers "Under the couplet".** Keep the choice between "Its meaning" and "For daily life"
  in settings, like the look.
- **C6. Plain-text export says more.** `journalAsText` leaves out the time, the feeling and the question the page
  answered. Add them.

## D. New features

- **D1. Change the passphrase.** There is no way to change it short of deleting everything. On the Backup page, once a
  passphrase is set: "Change passphrase". Confirm with the phone's screen lock (`authenticate`, when one is set), new
  passphrase twice with the same rules and the "written down" tick, then back up or sync straight away so every copy
  is locked with the new one. Say that older backup files keep the old passphrase.
- **D2. A gentle backup nudge.** The journal lives only on the phone until a backup is set up, and nothing says so.
  Once there are five pages and no passphrase, show one card on Journal: "Your pages live only on this phone" with
  "Set up a backup" and "Not now" (remembered; never shown again after "Not now"). Never a dialog, never on Today.

## E. Not in this round

- Drive sync that sends only what changed (today the whole journal travels as one file, which is what runs out of
  memory with many videos). Worth its own design: one sealed file per page and per media file.
- A PDF or printable export.
- Swiping between couplets on the couplet page.

## F. Housekeeping

- What's new (`src/lib/whatsNew.ts`, id stays 18 as 1.0.7 is unreleased): add lines for deletions that stick, no
  more duplicate pages after editing, change passphrase, and On this day.
- `CLAUDE.md`: add `syncState.ts` to the `src/lib` list.
- No formatter (the project is hand-formatted). `npm run typecheck && npm run lint` must pass.
