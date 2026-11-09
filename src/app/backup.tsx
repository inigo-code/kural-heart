import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { sealsAfterSave } from '@/lib/actions';
import { planNightly } from '@/lib/background';
import { backupNow, deleteFolderBackup, forgetBackupFolder, pickBackupFile, pickBackupFolder, restoreFrom } from '@/lib/backup';
import { setPassphrase } from '@/lib/crypto';
import { DriveError, connectDrive, deleteDriveCopy, disconnectDrive, switchDriveAccount, syncDrive } from '@/lib/drive';
import type { MergeResult } from '@/lib/journal';
import { awayFor } from '@/lib/lock';
import { setSettings, settings, useSettings } from '@/lib/settings';
import { Dialog, Field, lastLabel } from '@/ui/common';
import { Button, Group, Icon, Note, Page, Row, SectionLabel, SwitchRow, T } from '@/ui/parts';
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
  const [confirm, setConfirm] = useState<null | 'drive' | 'folder'>(null);

  const run = async (label: string, work: () => Promise<string>) => {
    setBusy(label);
    setMessage(null);
    try {
      setMessage(await work());
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const errorText = (e: unknown): string => {
    const m = e instanceof Error ? e.message : String(e);
    if (e instanceof DriveError && m === 'cancelled') return tr('Google Drive wasn’t connected.', 'Google Drive இணைக்கப்படவில்லை.');
    if (/Network request failed/i.test(m)) return tr('No connection. Try again when you’re online.', 'இணைப்பு இல்லை. இணையத்தில் இருக்கும்போது மீண்டும் முயலுங்கள்.');
    if (/isn’t set up/.test(m)) return tr('Google sign-in isn’t set up for this copy of the app yet (see docs/GOOGLE_DRIVE_SETUP.md).', 'இந்தப் பதிப்புக்கு Google உள்நுழைவு இன்னும் அமைக்கப்படவில்லை.');
    return m || tr('Something went wrong.', 'ஏதோ தவறு நடந்தது.');
  };

  const merged = (r: MergeResult, prefix = '') => {
    refreshWidget();
    sealsAfterSave();
    return prefix + (r.added + r.keptBoth > 0 ? L.restored(r.added, r.keptBoth) : tr('Nothing new from Drive.', 'Drive-இலிருந்து புதியது எதுவும் இல்லை.'));
  };

  const sync = (withPass?: string) =>
    run(tr('Syncing with Google Drive', 'Google Drive-உடன் ஒத்திசைகிறது'), async () => {
      if (!settings().driveOn) await awayFor(() => connectDrive());
      try {
        const r = await syncDrive(withPass);
        planNightly().catch(() => {});
        return merged(r, tr('Synced. ', 'ஒத்திசைந்தது. '));
      } catch (e) {
        if (e instanceof DriveError && e.message === 'passphrase') {
          setDrivePass('');
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

  const problem = pass && pass.length < 10 ? L.passShort : again && again !== pass ? L.passMismatch : null;
  const folderName = s.backupFolder ? decodeURIComponent(s.backupFolder).split(/[/:]/).filter(Boolean).pop() : null;

  return (
    <Page title={L.backupTitle}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <T v="body" color={c.ink2} style={{ flex: 1 }}>
          {L.backupLede}
        </T>
        <Valluvar state={busy ? 'walking' : 'presenting'} size={146} />
      </View>
      {busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 }}>
          <ActivityIndicator color={c.primary} />
          <T v="headline" style={{ flex: 1 }}>
            {busy}
          </T>
        </View>
      ) : null}
      {message ? <Note icon="shield">{message}</Note> : null}

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
            if (!on) disconnectDrive().then(() => planNightly().catch(() => {}));
            else if (!s.hasPassphrase) setMessage(tr('Set a passphrase below first.', 'முதலில் கீழே கடவுச்சொற்றொடரை அமைக்கவும்.'));
            else sync();
          }}
        />
        {s.driveOn ? (
          <>
            <Row title={tr('Sync now', 'இப்போதே ஒத்திசை')} icon="sync" onPress={() => !busy && sync()} />
            <Row
              title={tr('Use another Google account', 'வேறொரு Google கணக்கைப் பயன்படுத்து')}
              sub={tr('Sign out of this one and choose or add another', 'இதிலிருந்து வெளியேறி வேறொன்றைத் தேர்ந்தெடு அல்லது சேர்')}
              icon="user"
              onPress={() => !busy && switchAccount()}
            />
            <Row title={tr('Delete the copy in Drive', 'Drive-இல் உள்ள பிரதியை நீக்கு')} icon="trash" titleColor={c.heart} onPress={() => !busy && setConfirm('drive')} />
          </>
        ) : null}
      </Group>
      <Note style={{ marginTop: 10 }}>
        {tr(
          'Kural Heart uses a private app folder in your Drive that you can’t see in the Drive app. Google only ever holds a locked file.',
          'உங்கள் Drive-இல் Drive செயலியில் தெரியாத ஒரு தனிக் கோப்புறையைப் பயன்படுத்துகிறது. Google-இடம் பூட்டிய கோப்பு மட்டுமே இருக்கும்.',
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
        {s.hasPassphrase && s.backupFolder ? (
          <SwitchRow
            title={L.backupNightly}
            sub={lastLabel(s.lastBackup, L, tamil)}
            value={s.backupNightly}
            onChange={(v) => {
              setSettings({ backupNightly: v });
              planNightly().catch(() => {});
            }}
          />
        ) : null}
        {s.backupFolder ? (
          <>
            <Row
              title={tr('Stop using this folder', 'இந்தக் கோப்புறையை நிறுத்து')}
              sub={tr('The backup file already there stays', 'அங்குள்ள பிரதிக் கோப்பு அப்படியே இருக்கும்')}
              onPress={() => {
                forgetBackupFolder();
                planNightly().catch(() => {});
              }}
            />
            <Row title={tr('Delete the backup file in this folder', 'இந்தக் கோப்புறையில் உள்ள பிரதியை நீக்கு')} icon="trash" titleColor={c.heart} onPress={() => setConfirm('folder')} />
          </>
        ) : null}
      </Group>
      <Note style={{ marginTop: 12 }}>{L.backupPromise}</Note>

      {!s.hasPassphrase ? (
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
          <Pressable onPress={() => setWrote(!wrote)} accessibilityRole="checkbox" accessibilityState={{ checked: wrote }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
            <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: wrote ? c.primary : c.ink3, backgroundColor: wrote ? c.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {wrote ? <Icon name="check" size={16} color={c.onPrimary} stroke={2.4} /> : null}
            </View>
            <T v="bodyM" style={{ flex: 1 }}>
              {L.passWritten}
            </T>
          </Pressable>
          <Button
            label={L.passTurnOn}
            enabled={pass.length >= 10 && pass === again && wrote}
            onPress={() =>
              run(L.passTurnOn, async () => {
                await setPassphrase(pass);
                setPass('');
                setAgain('');
                setSettings({ hasPassphrase: true });
                if (s.backupFolder) {
                  await backupNow();
                  return L.backupDone;
                }
                return L.backupFolder;
              })
            }
          />
        </>
      ) : s.backupFolder ? (
        <Button label={L.backupNow} enabled={!busy} style={{ marginTop: 16 }} onPress={() => run(L.backupNow, async () => (await backupNow(), L.backupDone))} />
      ) : null}

      <SectionLabel>{L.restore}</SectionLabel>
      <T v="bodyM" color={c.ink2}>
        {L.restoreSub}
      </T>
      <Button
        label={L.restore}
        tonal
        enabled={!busy}
        style={{ marginTop: 10 }}
        onPress={async () => {
          const f = await awayFor(() => pickBackupFile()).catch(() => null);
          if (f) {
            setRestorePass('');
            setRestoreFile(f);
          }
        }}
      />

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
                'இது உங்கள் Google Drive-இலிருந்து Kural Heart-இன் பூட்டிய பிரதியை நீக்கி, Drive ஒத்திசைவை அணைக்கும். இந்த அலைபேசியில் உள்ள பக்கங்கள் அப்படியே இருக்கும்.',
              )
            : tr(
                'This deletes the backup file from your folder. Your pages on this phone stay. It can’t be undone.',
                'இது உங்கள் கோப்புறையிலிருந்து பிரதிக் கோப்பை நீக்கும். இந்த அலைபேசியில் உள்ள பக்கங்கள் அப்படியே இருக்கும். திரும்பப் பெற இயலாது.',
              )}
        </T>
      </Dialog>

      <Dialog
        visible={askDrivePass}
        title={tr('Open your Drive copy', 'உங்கள் Drive பிரதியைத் திற')}
        onClose={() => setAskDrivePass(false)}
        actions={[
          { label: L.cancel, onPress: () => setAskDrivePass(false) },
          {
            label: L.open,
            disabled: !drivePass,
            onPress: () => {
              const p = drivePass;
              setAskDrivePass(false);
              setDrivePass('');
              sync(p);
            },
          },
        ]}>
        <T v="bodyM" color={c.ink2}>
          {tr(
            'Enter the passphrase you used when this Drive copy was made. Its pages join this phone’s, and the copy is then locked with this phone’s passphrase.',
            'இந்த Drive பிரதியை உருவாக்கியபோது பயன்படுத்திய கடவுச்சொற்றொடரை உள்ளிடுங்கள். அதன் பக்கங்கள் இங்கே சேரும்; பிறகு பிரதி இந்த அலைபேசியின் கடவுச்சொற்றொடரால் பூட்டப்படும்.',
          )}
        </T>
        <Field value={drivePass} onChangeText={setDrivePass} placeholder={L.passForRestore} secret style={{ backgroundColor: c.surface2 }} />
      </Dialog>

      <Dialog
        visible={!!restoreFile}
        title={L.restore}
        onClose={() => setRestoreFile(null)}
        actions={[
          { label: L.cancel, onPress: () => setRestoreFile(null) },
          {
            label: L.open,
            disabled: !restorePass,
            onPress: () => {
              const f = restoreFile;
              const p = restorePass;
              setRestoreFile(null);
              setRestorePass('');
              if (f)
                run(L.restoring, async () => {
                  const r = await restoreFrom(f, p);
                  refreshWidget();
                  sealsAfterSave();
                  return r.added + r.keptBoth > 0 ? L.restored(r.added, r.keptBoth) : tr('Nothing new in that backup: every page is already here.', 'அந்தக் காப்பில் புதியது இல்லை: எல்லாப் பக்கங்களும் ஏற்கெனவே இங்கே உள்ளன.');
                });
            },
          },
        ]}>
        <Field value={restorePass} onChangeText={setRestorePass} placeholder={L.passForRestore} secret style={{ backgroundColor: c.surface2 }} />
      </Dialog>
    </Page>
  );
}
