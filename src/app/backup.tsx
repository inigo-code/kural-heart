import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { sealsAfterSave } from '@/lib/actions';
import { planNightly } from '@/lib/background';
import { backupNow, deleteFolderBackup, forgetBackupFolder, oneAtATime, pickBackupFile, pickBackupFolder, restoreFrom } from '@/lib/backup';
import { BackupError, setPassphrase, storedPassphrase } from '@/lib/crypto';
import { DriveError, connectDrive, deleteDriveCopy, disconnectDrive, driveCopyExists, openDriveCopy, switchDriveAccount, syncDrive } from '@/lib/drive';
import { allEntries } from '@/lib/journal';
import type { MergeResult } from '@/lib/journal';
import { authenticate, awayFor, canLock } from '@/lib/lock';
import { planReminders } from '@/lib/notify';
import { setSettings, settings, useSettings } from '@/lib/settings';
import { forgetUpload } from '@/lib/syncState';
import { Dialog, Field, lastLabel } from '@/ui/common';
import { ActionCard, Button, Group, Icon, Note, Page, Row, SectionLabel, SwitchRow, T, TextLink } from '@/ui/parts';
import { toast } from '@/ui/toast';
import { useUI } from '@/ui/ui';
import { Valluvar } from '@/valluvar/Valluvar';
import { refreshWidget } from '@/widget/widgets';

export default function BackupScreen() {
  const { c, L, tr, tamil } = useUI();
  const s = useSettings();
  const [pass, setPass] = useState('');
  const [again, setAgain] = useState('');
  const [wrote, setWrote] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restoreFile, setRestoreFile] = useState<Awaited<ReturnType<typeof pickBackupFile>>>(null);
  const [restorePass, setRestorePass] = useState('');
  // The Drive copy was locked with another passphrase: ask for it once, then sync with it.
  const [askDrivePass, setAskDrivePass] = useState(false);
  const [drivePass, setDrivePass] = useState('');
  // A wrong passphrase is said in the dialog itself, under the field, where the person is looking.
  const [passError, setPassError] = useState<string | null>(null);
  const wrongPass = () => tr('That passphrase doesn’t open this backup. Check it and try again.', 'அந்தக் கடவுச்சொற்றொடர் இந்தக் காப்பைத் திறக்கவில்லை. சரிபார்த்து மீண்டும் முயலுங்கள்.');
  // True when this phone has no passphrase yet and the Drive copy's will become its own.
  const [firstDrive, setFirstDrive] = useState(false);
  const [confirm, setConfirm] = useState<null | 'drive' | 'folder'>(null);
  // Changing the passphrase: a new one twice and the "written down" tick, after the phone's screen lock.
  const [changing, setChanging] = useState(false);
  const [next, setNext] = useState('');
  const [nextAgain, setNextAgain] = useState('');
  const [nextWrote, setNextWrote] = useState(false);
  // Before any passphrase, the page asks one question first: a new backup, or one made before? Each answer shows only
  // its own steps, so someone with a backup isn't met by a form for choosing a new passphrase.
  const { restore: askedRestore } = useLocalSearchParams<{ restore?: string }>();
  const [path, setPath] = useState<null | 'new' | 'restore'>(askedRestore ? 'restore' : null);
  const way = s.hasPassphrase ? 'set' : (path ?? (s.driveOn || s.backupFolder ? 'new' : null));
  const pickFile = async () => {
    if (busy) return;
    const f = await awayFor(() => pickBackupFile()).catch(() => null);
    if (f) {
      setRestorePass('');
      setPassError(null);
      setRestoreFile(f);
    }
  };

  const run = async (label: string, work: () => Promise<string | null>) => {
    setBusy(label);
    setMessage(null);
    let said: string | null;
    try {
      said = await work();
    } catch (e) {
      said = errorText(e);
    } finally {
      setBusy(null);
    }
    setMessage(said);
    // The note sits at the top of the page; the toast says it at the foot too, where the person tapped.
    if (said) toast(said);
  };

  const errorText = (e: unknown): string => {
    const m = e instanceof Error ? e.message : String(e);
    if (e instanceof DriveError && m === 'cancelled') return tr('Google Drive wasn’t connected.', 'Google Drive இணைக்கப்படவில்லை.');
    if (/Network request failed/i.test(m)) return tr('No connection. Try again when you’re online.', 'இணைப்பு இல்லை. இணையத்தில் இருக்கும்போது மீண்டும் முயலுங்கள்.');
    if ((e instanceof BackupError && m === 'memory') || /Failed to allocate|OutOfMemory/i.test(m))
      return tr('Too large to fit in this phone’s memory. Nothing was changed.', 'இந்த அலைபேசியின் நினைவகத்தில் அடங்காத அளவு பெரியது. எதுவும் மாற்றப்படவில்லை.');
    if (/isn’t set up/.test(m)) return tr('Google sign-in isn’t set up for this copy of the app yet (see docs/GOOGLE_DRIVE_SETUP.md).', 'இந்தப் பதிப்புக்கு Google உள்நுழைவு இன்னும் அமைக்கப்படவில்லை.');
    return m || tr('Something went wrong.', 'ஏதோ தவறு நடந்தது.');
  };

  /** What a merge changed, in a line, or null when it changed nothing. */
  const changes = (r: MergeResult): string | null => {
    const said = [
      r.added + r.keptBoth > 0 ? L.restored(r.added, r.keptBoth) : null,
      r.updated > 0
        ? tr(
            r.updated === 1 ? 'Updated 1 page edited on another phone' : `Updated ${r.updated} pages edited on another phone`,
            r.updated === 1 ? 'வேறொரு அலைபேசியில் திருத்திய 1 பக்கம் இங்கே புதுப்பிக்கப்பட்டது' : `வேறொரு அலைபேசியில் திருத்திய ${r.updated} பக்கங்கள் இங்கே புதுப்பிக்கப்பட்டன`,
          )
        : null,
      r.removed > 0
        ? tr(
            r.removed === 1 ? 'Removed 1 page deleted on another phone' : `Removed ${r.removed} pages deleted on another phone`,
            r.removed === 1 ? 'வேறொரு அலைபேசியில் நீக்கிய 1 பக்கம் இங்கும் நீக்கப்பட்டது' : `வேறொரு அலைபேசியில் நீக்கிய ${r.removed} பக்கங்கள் இங்கும் நீக்கப்பட்டன`,
          )
        : null,
    ].filter((x): x is string => !!x);
    return said.length ? said.join('. ') : null;
  };

  const merged = (r: MergeResult, prefix = '') => {
    refreshWidget();
    sealsAfterSave();
    planReminders().catch(() => {});
    return prefix + (changes(r) ?? tr('Nothing new from Drive.', 'Drive-இலிருந்து புதியது எதுவும் இல்லை.'));
  };

  const sync = (withPass?: string) =>
    run(tr('Syncing with Google Drive', 'Google Drive-உடன் ஒத்திசைகிறது'), async () => {
      if (!settings().driveOn) await awayFor(() => connectDrive());
      // A new phone: if this Drive already has a backup, its passphrase opens it and becomes this phone's.
      if (!settings().hasPassphrase) {
        if (await driveCopyExists()) {
          setFirstDrive(true);
          setDrivePass('');
          setAskDrivePass(true);
          return tr('Your Drive has a Kural Heart backup. Enter its passphrase to open it.', 'உங்கள் Drive-இல் Kural Heart காப்பு உள்ளது. அதைத் திறக்க அதன் கடவுச்சொற்றொடரை உள்ளிடுங்கள்.');
        }
        // Looking for a backup that isn't there: say so, and carry on as a new one.
        const lookedFor = path === 'restore';
        setPath('new');
        return lookedFor
          ? tr(
              `There’s no Kural Heart backup in the Drive of ${settings().driveEmail}. If it was another Google account, turn Google Drive off and on again to choose it. Or start a new backup with a passphrase.`,
              `${settings().driveEmail} கணக்கின் Drive-இல் Kural Heart காப்பு இல்லை. வேறொரு Google கணக்கு என்றால், Google Drive-ஐ அணைத்து மீண்டும் இயக்கி அதைத் தேருங்கள். அல்லது கடவுச்சொற்றொடருடன் புதிய காப்பைத் தொடங்குங்கள்.`,
            )
          : tr('Connected. Set a passphrase above to lock your backup; syncing starts then.', 'இணைந்தது. காப்பைப் பூட்ட மேலே கடவுச்சொற்றொடரை அமையுங்கள்; பிறகு ஒத்திசைவு தொடங்கும்.');
      }
      try {
        const r = await syncDrive(withPass);
        planNightly().catch(() => {});
        return merged(r, tr('Synced. ', 'ஒத்திசைந்தது. '));
      } catch (e) {
        if (e instanceof DriveError && e.message === 'passphrase') {
          setDrivePass('');
          setPassError(withPass ? wrongPass() : null);
          setAskDrivePass(true);
          return withPass
            ? tr('That passphrase doesn’t open the Drive copy either.', 'அந்தக் கடவுச்சொற்றொடரும் Drive பிரதியைத் திறக்கவில்லை.')
            : tr('The copy in your Drive is locked with a different passphrase.', 'உங்கள் Drive-இல் உள்ள பிரதி வேறொரு கடவுச்சொற்றொடரால் பூட்டப்பட்டுள்ளது.');
        }
        throw e;
      }
    });

  const switchAccount = () =>
    run(tr('Choosing a Google account', 'Google கணக்கைத் தேர்கிறது'), async () => {
      const email = await awayFor(() => switchDriveAccount());
      const r = await syncDrive();
      planNightly().catch(() => {});
      return merged(r, tr(`Now syncing with ${email}. `, `இப்போது ${email} உடன் ஒத்திசைகிறது. `));
    });

  const changeTitle = tr('Change passphrase', 'கடவுச்சொற்றொடரை மாற்று');
  const startChange = async () => {
    // Whoever holds the unlocked phone mustn't be able to lock the backups away from its owner.
    if ((await canLock()) && !(await authenticate(changeTitle))) return;
    setNext('');
    setNextAgain('');
    setNextWrote(false);
    setChanging(true);
  };
  const closeChange = () => {
    setChanging(false);
    setNext('');
    setNextAgain('');
  };

  /** Lock with the new passphrase, then back up and sync at once, so every copy is locked with it. */
  const change = (fresh: string) =>
    run(changeTitle, async () => {
      // The Drive copy is still locked with the old passphrase: it opens with that one, and goes back up with the new.
      const old = await oneAtATime(async () => {
        const was = await storedPassphrase();
        await setPassphrase(fresh);
        forgetUpload();
        return was;
      });
      const s0 = settings();
      const failed: string[] = [];
      let synced = false;
      let filed = false;
      if (s0.driveOn) {
        try {
          const r = await syncDrive(old);
          merged(r);
          synced = true;
        } catch (e) {
          failed.push(
            tr(
              `The Drive copy couldn’t be locked again yet (${errorText(e)}). Sync again; if asked, enter your old passphrase.`,
              `Drive பிரதியை இன்னும் மீண்டும் பூட்ட இயலவில்லை (${errorText(e)}). மீண்டும் ஒத்திசையுங்கள்; கேட்டால் பழைய கடவுச்சொற்றொடரை உள்ளிடுங்கள்.`,
            ),
          );
        }
      }
      if (s0.backupFolder) {
        try {
          await backupNow();
          filed = true;
        } catch (e) {
          failed.push(tr(`The backup file couldn’t be written yet (${errorText(e)}).`, `காப்புக் கோப்பை இன்னும் எழுத இயலவில்லை (${errorText(e)}).`));
        }
      }
      const what =
        synced && filed
          ? tr('; your Drive copy and backup file are locked with the new one', '; உங்கள் Drive பிரதியும் காப்புக் கோப்பும் புதியதால் பூட்டப்பட்டன')
          : synced
            ? tr('; your Drive copy is locked with the new one', '; உங்கள் Drive பிரதி புதியதால் பூட்டப்பட்டது')
            : filed
              ? tr('; your backup file is locked with the new one', '; உங்கள் காப்புக் கோப்பு புதியதால் பூட்டப்பட்டது')
              : '';
      return [
        tr(`Passphrase changed${what}.`, `கடவுச்சொற்றொடர் மாற்றப்பட்டது${what}.`),
        ...failed,
        tr('Backup files you saved elsewhere before still open only with the old passphrase.', 'முன்பு வேறு இடங்களில் சேமித்த காப்புக் கோப்புகள் பழைய கடவுச்சொற்றொடரால் மட்டுமே திறக்கும்.'),
      ].join(' ');
    });

  const problem = pass && pass.length < 10 ? L.passShort : again && again !== pass ? L.passMismatch : null;
  const nextProblem = next && next.length < 10 ? L.passShort : nextAgain && nextAgain !== next ? L.passMismatch : null;
  const folderName = s.backupFolder ? decodeURIComponent(s.backupFolder).split(/[/:]/).filter(Boolean).pop() : null;

  return (
    <Page
      title={L.backupTitle}
      // The work in progress shows at the foot, in view wherever the page is scrolled (Restore is at the very end).
      footer={
        busy ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ActivityIndicator color={c.primary} />
            <T v="headline" style={{ flex: 1 }}>
              {busy}
            </T>
          </View>
        ) : undefined
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <T v="body" color={c.ink2} style={{ flex: 1 }}>
          {L.backupLede}
        </T>
        <Valluvar state={busy ? 'walking' : 'presenting'} size={116} />
      </View>
      {message ? <Note icon="shield">{message}</Note> : null}

      {way === null ? (
        <>
          <SectionLabel>{tr('Have you backed up Kural Heart before?', 'இதற்கு முன் Kural Heart-ஐக் காப்பு எடுத்திருக்கிறீர்களா?')}</SectionLabel>
          <View style={{ gap: 10 }}>
            <ActionCard
              icon="download"
              title={tr('Yes, bring my journal back', 'ஆம், என் நாட்குறிப்பைத் திரும்பக் கொண்டு வா')}
              sub={tr('From Google Drive or a backup file, made on this phone or another.', 'Google Drive அல்லது காப்புக் கோப்பிலிருந்து; இந்த அலைபேசியிலோ வேறொன்றிலோ எடுத்தது.')}
              onPress={() => setPath('restore')}
            />
            <ActionCard
              icon="lock"
              title={tr('No, start a new backup', 'இல்லை, புதிய காப்பைத் தொடங்கு')}
              sub={tr('Choose a passphrase that locks every copy, then where the copies go.', 'ஒவ்வொரு பிரதியையும் பூட்டும் கடவுச்சொற்றொடரைத் தேருங்கள்; பிறகு பிரதிகள் எங்கே எனத் தேருங்கள்.')}
              onPress={() => setPath('new')}
            />
          </View>
        </>
      ) : null}

      {way === 'restore' ? (
        <>
          <SectionLabel>{tr('Where is your backup?', 'உங்கள் காப்பு எங்கே உள்ளது?')}</SectionLabel>
          <View style={{ gap: 10 }}>
            <ActionCard
              icon="cloud"
              title={tr('In Google Drive', 'Google Drive-இல்')}
              sub={tr('Sign in with the Google account you backed up to.', 'காப்பு எடுத்த Google கணக்கில் உள்நுழையுங்கள்.')}
              onPress={() => !busy && sync()}
            />
            <ActionCard icon="download" title={tr('In a backup file', 'காப்புக் கோப்பில்')} sub={tr('A file saved to a folder or sent to this phone.', 'ஒரு கோப்புறையில் சேமித்த அல்லது இந்த அலைபேசிக்கு அனுப்பிய கோப்பு.')} onPress={pickFile} />
          </View>
          <Note icon="bulb" iconColor={c.primary} style={{ marginTop: 12 }}>
            {tr(
              'You’ll be asked for the passphrase you chose when you made the backup. This phone keeps it, so there’s no new one to choose.',
              'காப்பை உருவாக்கியபோது தேர்ந்த கடவுச்சொற்றொடர் கேட்கப்படும். இந்த அலைபேசி அதையே வைத்துக்கொள்ளும்; புதிதாகத் தேர வேண்டியதில்லை.',
            )}
          </Note>
          <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
            <TextLink label={tr('I don’t have a backup: start a new one', 'என்னிடம் காப்பு இல்லை: புதியதைத் தொடங்கு')} onPress={() => setPath('new')} />
          </View>
        </>
      ) : null}

      {/* A new backup: the passphrase comes first, as every way of backing up is locked with it. */}
      {way === 'new' ? (
        <>
          <SectionLabel>{L.passTitle}</SectionLabel>
          <T v="bodyM" color={c.ink2}>
            {L.passLede}
          </T>
          <Field value={pass} onChangeText={setPass} placeholder={L.passLabel} secret style={{ marginTop: 12 }} />
          <Field value={again} onChangeText={setAgain} placeholder={L.passAgain} secret style={{ marginTop: 10 }} />
          {problem ? (
            <T v="labelM" color={c.heart} style={{ margin: 4 }}>
              {problem}
            </T>
          ) : null}
          <Note icon="bulb" iconColor={c.primary} style={{ marginTop: 10 }}>
            {L.passTip}
          </Note>
          <WrittenDown on={wrote} onPress={() => setWrote(!wrote)} />
          <Button
            label={L.passTurnOn}
            enabled={pass.length >= 10 && pass === again && wrote}
            onPress={() =>
              run(L.passTurnOn, async () => {
                await setPassphrase(pass);
                setPass('');
                setAgain('');
                setSettings({ hasPassphrase: true });
                planNightly().catch(() => {});
                // Whatever was waiting for a passphrase starts now.
                if (settings().driveOn) {
                  const r = await syncDrive();
                  planNightly().catch(() => {});
                  return merged(r, tr('Locked and synced. ', 'பூட்டி ஒத்திசைந்தது. '));
                }
                if (s.backupFolder) {
                  await backupNow();
                  return L.backupDone;
                }
                return tr('Your passphrase is set. Now choose where the backup lives.', 'கடவுச்சொற்றொடர் அமைந்தது. இனி காப்புப் பிரதி எங்கே இருக்க வேண்டும் எனத் தேர்ந்தெடுங்கள்.');
              })
            }
          />
          <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
            <TextLink label={tr('I have a backup already: bring it back', 'என்னிடம் ஏற்கெனவே காப்பு உள்ளது: மீட்டெடு')} onPress={() => setPath('restore')} />
          </View>
        </>
      ) : null}

      {way === 'new' || way === 'set' ? (
        <>
          <SectionLabel>Google Drive</SectionLabel>
          <Group>
            <SwitchRow
              title={s.driveOn ? tr('Syncing with your Google Drive', 'உங்கள் Google Drive-உடன் ஒத்திசைகிறது') : tr('Sync with Google Drive', 'Google Drive-உடன் ஒத்திசை')}
              sub={
                s.driveOn
                  ? `${s.driveEmail} · ${lastLabel(s.lastDriveSync, L, tamil)}`
                  : tr('Sign in once. Every page and photo, locked with your passphrase.', 'ஒருமுறை உள்நுழையவும். ஒவ்வொரு பக்கமும் படமும் உங்கள் கடவுச்சொற்றொடரால் பூட்டப்படும்.')
              }
              divider={false}
              value={s.driveOn}
              onChange={(on) => {
                if (busy) return;
                if (!on) disconnectDrive().then(() => planNightly().catch(() => {}));
                else sync();
              }}
            />
            {s.driveOn ? (
              <>
                <Row title={tr('Sync now', 'இப்போதே ஒத்திசை')} icon="sync" onPress={() => !busy && sync()} />
                <Row
                  title={tr('Use another Google account', 'வேறொரு Google கணக்கைப் பயன்படுத்து')}
                  icon="user"
                  onPress={() => !busy && switchAccount()}
                />
                <Row title={tr('Delete the copy in Drive', 'Drive-இல் உள்ள பிரதியை நீக்கு')} icon="trash" titleColor={c.heart} onPress={() => !busy && setConfirm('drive')} />
              </>
            ) : null}
          </Group>
          <Note style={{ marginTop: 10 }}>
            {tr(
              'Kept in a hidden app folder in your Drive. Google only ever holds a locked file.',
              'உங்கள் Drive-இன் மறைவான செயலிக் கோப்புறையில். Google-இடம் பூட்டிய கோப்பு மட்டுமே.',
            )}
          </Note>

          <SectionLabel>{L.backupWhere}</SectionLabel>
          <Group>
            <Row
              title={folderName ?? L.backupFolder}
              sub={folderName ? tr('Tap to choose another folder', 'வேறு கோப்புறையைத் தேர்ந்தெடுக்கத் தொடவும்') : L.backupFolderSub}
              icon="download"
              divider={false}
              onPress={() => awayFor(() => pickBackupFolder())}
            />
            {s.backupFolder ? (
              <>
                <Row
                  title={tr('Stop using this folder', 'இந்தக் கோப்புறையை நிறுத்து')}
                  onPress={() => {
                    forgetBackupFolder();
                    planNightly().catch(() => {});
                  }}
                />
                <Row title={tr('Delete the backup file in this folder', 'இந்தக் கோப்புறையில் உள்ள பிரதியை நீக்கு')} icon="trash" titleColor={c.heart} onPress={() => setConfirm('folder')} />
              </>
            ) : null}
          </Group>

          {s.hasPassphrase && s.backupFolder ? (
            <Button label={L.backupNow} enabled={!busy} icon="download" style={{ marginTop: 14 }} onPress={() => run(L.backupNow, async () => (await backupNow(), L.backupDone))} />
          ) : null}

          {/* Automatic: one switch for every night, to Drive and to the folder alike. */}
          {s.hasPassphrase && (s.driveOn || s.backupFolder) ? (
            <>
              <SectionLabel>{tr('Automatic backup', 'தானியங்கிக் காப்பு')}</SectionLabel>
              <Group>
                <SwitchRow
                  title={L.backupNightly}
                  sub={
                    s.autoBackup
                      ? lastLabel(Math.max(s.lastBackup, s.lastDriveSync), L, tamil)
                      : tr('Off: back up with Sync now or Back up now', 'அணைந்துள்ளது: இப்போதே ஒத்திசை அல்லது இப்போதே பிரதி எடு')
                  }
                  divider={false}
                  value={s.autoBackup}
                  onChange={(v) => {
                    setSettings({ autoBackup: v });
                    planNightly().catch(() => {});
                  }}
                />
              </Group>
            </>
          ) : null}

          {way === 'set' ? (
            <>
              <SectionLabel>{L.passLabel}</SectionLabel>
              <Group>
                <Row
                  title={tr('Change passphrase', 'கடவுச்சொற்றொடரை மாற்று')}
                  sub={tr('Every copy is locked again with the new one', 'ஒவ்வொரு பிரதியும் புதியதால் மீண்டும் பூட்டப்படும்')}
                  icon="lock"
                  divider={false}
                  onPress={() => !busy && startChange()}
                />
              </Group>
              <SectionLabel>{L.restore}</SectionLabel>
              <ActionCard icon="download" title={tr('Restore from a backup file', 'காப்புக் கோப்பிலிருந்து மீட்டெடு')} sub={L.restoreSub} onPress={pickFile} />
            </>
          ) : null}
        </>
      ) : null}

      <Dialog
        visible={!!confirm}
        title={confirm === 'drive' ? tr('Delete the copy in Drive?', 'Drive பிரதியை நீக்கவா?') : tr('Delete the backup file?', 'பிரதிக் கோப்பை நீக்கவா?')}
        onClose={() => setConfirm(null)}
        actions={[
          { label: L.cancel, onPress: () => setConfirm(null) },
          {
            label: L.delete,
            color: c.heart,
            onPress: () => {
              const which = confirm;
              setConfirm(null);
              if (which === 'drive')
                run(tr('Deleting the Drive copy', 'Drive பிரதியை நீக்குகிறது'), async () => {
                  const had = await deleteDriveCopy();
                  await disconnectDrive();
                  planNightly().catch(() => {});
                  return had
                    ? tr('The copy in Drive is deleted, and Drive sync is off.', 'Drive பிரதி நீக்கப்பட்டது; Drive ஒத்திசைவு அணைக்கப்பட்டது.')
                    : tr('There was no copy in Drive. Drive sync is off.', 'Drive-இல் பிரதி இல்லை. Drive ஒத்திசைவு அணைக்கப்பட்டது.');
                });
              else
                run(tr('Deleting the backup file', 'பிரதிக் கோப்பை நீக்குகிறது'), async () =>
                  deleteFolderBackup()
                    ? tr(
                        'The backup file is deleted. Nightly backups write a new one unless you stop using the folder.',
                        'பிரதிக் கோப்பு நீக்கப்பட்டது. கோப்புறையை நிறுத்தாவிட்டால் இரவுப் பிரதி புதிய ஒன்றை எழுதும்.',
                      )
                    : tr('There was no backup file in that folder.', 'அந்தக் கோப்புறையில் பிரதிக் கோப்பு இல்லை.'),
                );
            },
          },
        ]}>
        <T v="bodyM" color={c.ink2}>
          {confirm === 'drive'
            ? tr(
                'This removes Kural Heart’s locked copy from your Google Drive and turns Drive sync off. Your pages on this phone stay. Other phones that sync will upload a new copy.',
                'இது உங்கள் Google Drive-இலிருந்து Kural Heart-இன் பூட்டிய பிரதியை நீக்கி, Drive ஒத்திசைவை அணைக்கும். இந்த அலைபேசியில் உள்ள பக்கங்கள் அப்படியே இருக்கும். ஒத்திசைக்கும் பிற அலைபேசிகள் புதிய பிரதியைப் பதிவேற்றும்.',
              )
            : tr(
                'This deletes the backup file from your folder. Your pages on this phone stay. It can’t be undone.',
                'இது உங்கள் கோப்புறையிலிருந்து பிரதிக் கோப்பை நீக்கும். இந்த அலைபேசியில் உள்ள பக்கங்கள் அப்படியே இருக்கும். திரும்பப் பெற இயலாது.',
              )}
        </T>
      </Dialog>

      <Dialog
        visible={changing}
        title={changeTitle}
        onClose={closeChange}
        actions={[
          { label: L.cancel, onPress: closeChange },
          {
            label: tr('Change', 'மாற்று'),
            disabled: !(next.length >= 10 && next === nextAgain && nextWrote) || !!busy,
            onPress: () => {
              const p = next;
              closeChange();
              change(p);
            },
          },
        ]}>
        <T v="bodyM" color={c.ink2}>
          {tr(
            'Every copy from now on is locked with the new passphrase, and this phone backs up straight away. Backup files made before keep the old one, so keep that written down too while you have them.',
            'இனி ஒவ்வொரு பிரதியும் புதிய கடவுச்சொற்றொடரால் பூட்டப்படும்; இந்த அலைபேசி உடனே காப்பு எடுக்கும். முன்பு எடுத்த காப்புக் கோப்புகள் பழைய கடவுச்சொற்றொடரிலேயே இருக்கும்; அவை உள்ளவரை அதையும் எழுதி வையுங்கள்.',
          )}
        </T>
        <Field value={next} onChangeText={setNext} placeholder={tr('New passphrase', 'புதிய கடவுச்சொற்றொடர்')} secret style={{ backgroundColor: c.surface2 }} />
        <Field value={nextAgain} onChangeText={setNextAgain} placeholder={L.passAgain} secret style={{ backgroundColor: c.surface2 }} />
        {nextProblem ? (
          <T v="labelM" color={c.heart}>
            {nextProblem}
          </T>
        ) : null}
        <WrittenDown on={nextWrote} onPress={() => setNextWrote(!nextWrote)} />
      </Dialog>

      <Dialog
        visible={askDrivePass}
        title={tr('Open your Drive copy', 'உங்கள் Drive பிரதியைத் திற')}
        onClose={() => (setAskDrivePass(false), setPassError(null))}
        actions={[
          { label: L.cancel, onPress: () => (setAskDrivePass(false), setPassError(null)) },
          {
            label: L.open,
            disabled: !drivePass,
            onPress: () => {
              const p = drivePass;
              setAskDrivePass(false);
              setDrivePass('');
              setPassError(null);
              if (!firstDrive) return sync(p);
              run(tr('Opening your Drive copy', 'உங்கள் Drive பிரதியைத் திறக்கிறது'), async () => {
                try {
                  const hadPages = allEntries().length > 0;
                  const r = await openDriveCopy(p);
                  await setPassphrase(p);
                  setSettings({ hasPassphrase: true });
                  setFirstDrive(false);
                  // The Drive copy already holds everything, locked with this passphrase. Only pages written here
                  // before the restore need to go up, and that happens after the screen says it's done.
                  if (hadPages) syncDrive().catch(() => {}).finally(() => planNightly().catch(() => {}));
                  else {
                    setSettings({ lastDriveSync: Date.now() });
                    planNightly().catch(() => {});
                  }
                  return merged(r, tr('Restored, and this phone now uses that passphrase. ', 'மீட்கப்பட்டது; இந்த அலைபேசி இனி அந்தக் கடவுச்சொற்றொடரைப் பயன்படுத்தும். '));
                } catch (e) {
                  if (e instanceof DriveError && e.message === 'passphrase') {
                    setPassError(wrongPass());
                    setAskDrivePass(true);
                    return null;
                  }
                  throw e;
                }
              });
            },
          },
        ]}>
        <T v="bodyM" color={c.ink2}>
          {firstDrive
            ? tr(
                'Enter the passphrase you chose when you made this backup. Its pages, profile and history come back, and this phone keeps the passphrase.',
                'இந்தக் காப்பை உருவாக்கியபோது தேர்ந்த கடவுச்சொற்றொடரை உள்ளிடுங்கள். பக்கங்களும் சுயவிவரமும் வரலாறும் திரும்பும்; இந்த அலைபேசி அந்தக் கடவுச்சொற்றொடரை வைத்துக்கொள்ளும்.',
              )
            : tr(
                'Enter the passphrase you used when this Drive copy was made. Its pages join this phone’s, and the copy is then locked with this phone’s passphrase.',
                'இந்த Drive பிரதியை உருவாக்கியபோது பயன்படுத்திய கடவுச்சொற்றொடரை உள்ளிடுங்கள். அதன் பக்கங்கள் இங்கே சேரும்; பிறகு பிரதி இந்த அலைபேசியின் கடவுச்சொற்றொடரால் பூட்டப்படும்.',
              )}
        </T>
        <Field
          value={drivePass}
          onChangeText={(v) => (setDrivePass(v), setPassError(null))}
          placeholder={L.passForRestore}
          secret
          style={{ backgroundColor: c.surface2, borderWidth: passError ? 1.5 : 0, borderColor: c.heart }}
        />
        {passError ? (
          <T v="labelM" color={c.heart}>
            {passError}
          </T>
        ) : null}
      </Dialog>

      <Dialog
        visible={!!restoreFile}
        title={L.restore}
        onClose={() => (setRestoreFile(null), setPassError(null))}
        actions={[
          { label: L.cancel, onPress: () => (setRestoreFile(null), setPassError(null)) },
          {
            label: L.open,
            disabled: !restorePass,
            onPress: () => {
              const f = restoreFile;
              const p = restorePass;
              if (!f || busy) return;
              // The dialog closes while the backup opens, so the progress line shows and Open can't start a second
              // restore. A wrong passphrase brings it back, with the error under the field.
              setRestoreFile(null);
              setPassError(null);
              run(L.restoring, async () => {
                let r: MergeResult;
                try {
                  r = await restoreFrom(f, p);
                } catch (e) {
                  if (e instanceof BackupError && /passphrase/i.test(e.message)) {
                    setRestorePass('');
                    setPassError(wrongPass());
                    setRestoreFile(f);
                    return null;
                  }
                  throw e;
                }
                setRestorePass('');
                refreshWidget();
                sealsAfterSave();
                planReminders().catch(() => {});
                // A new phone takes on the passphrase that opened its old backup, rather than asking for a new one.
                if (!settings().hasPassphrase) {
                  await setPassphrase(p);
                  setSettings({ hasPassphrase: true });
                  planNightly().catch(() => {});
                }
                return changes(r) ?? tr('Nothing new in that backup: every page is already here.', 'அந்தக் காப்பில் புதியது இல்லை: எல்லாப் பக்கங்களும் ஏற்கெனவே இங்கே உள்ளன.');
              });
            },
          },
        ]}>
        <Field
          value={restorePass}
          onChangeText={(v) => (setRestorePass(v), setPassError(null))}
          placeholder={L.passForRestore}
          secret
          style={{ backgroundColor: c.surface2, borderWidth: passError ? 1.5 : 0, borderColor: c.heart }}
        />
        {passError ? (
          <T v="labelM" color={c.heart}>
            {passError}
          </T>
        ) : null}
      </Dialog>
    </Page>
  );
}

/** "I have written it down somewhere safe": a tick the person has to give before a passphrase is set. */
function WrittenDown({ on, onPress }: { on: boolean; onPress: () => void }) {
  const { c, L } = useUI();
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: on ? c.primary : c.ink3, backgroundColor: on ? c.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {on ? <Icon name="check" size={16} color={c.onPrimary} stroke={2.4} /> : null}
      </View>
      <T v="bodyM" style={{ flex: 1 }}>
        {L.passWritten}
      </T>
    </Pressable>
  );
}
