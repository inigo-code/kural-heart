import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { awayFor } from '@/lib/lock';
import { addMediaFile, openMedia } from '@/lib/photos';

import { Dialog } from './common';
import { Icon, T, TextLink } from './parts';
import { alpha } from './theme';
import { toast } from './toast';
import { useUI } from './ui';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** A voice note on a page: play and pause, how far along, and (while writing) remove. */
export function AudioNote({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const { c, tr } = useUI();
  const [uri, setUri] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);
  const wantPlay = useRef(false);
  useEffect(() => {
    if (uri && wantPlay.current && status.isLoaded) {
      wantPlay.current = false;
      player.play();
    }
  }, [uri, status.isLoaded, player]);
  const toggle = async () => {
    if (!uri) {
      setOpening(true);
      const u = await openMedia(id, 'm4a');
      setOpening(false);
      if (!u) return toast(tr('This voice note can’t be opened.', 'இந்தக் குரல் குறிப்பைத் திறக்க இயலவில்லை.'));
      wantPlay.current = true;
      setUri(u);
      return;
    }
    if (status.playing) player.pause();
    else {
      if (status.duration && status.currentTime >= status.duration - 0.2) player.seekTo(0);
      player.play();
    }
  };
  const progress = status.duration ? Math.min(1, status.currentTime / status.duration) : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingRight: 12, borderRadius: 22, backgroundColor: c.surface2 }}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? tr('Pause voice note', 'குரல் குறிப்பை நிறுத்து') : tr('Play voice note', 'குரல் குறிப்பை இயக்கு')}
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
        {opening ? <ActivityIndicator color={c.onPrimary} /> : <Icon name={status.playing ? 'stop' : 'play'} size={20} color={c.onPrimary} fill />}
      </Pressable>
      <View style={{ flex: 1, gap: 6 }}>
        <T v="label">{tr('Voice note', 'குரல் குறிப்பு')}</T>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: alpha(c.ink3, 0.25), overflow: 'hidden' }}>
          <View style={{ width: `${progress * 100}%`, height: 4, backgroundColor: c.primary }} />
        </View>
      </View>
      <T v="labelM" color={c.ink3}>
        {status.duration ? `${mmss(status.currentTime)} / ${mmss(status.duration)}` : ''}
      </T>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={tr('Remove voice note', 'குரல் குறிப்பை நீக்கு')}>
          <Icon name="close" size={18} color={c.ink3} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** A dialog that records one voice note, up to five minutes, and hands back its sealed id. */
export function VoiceRecorder({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: (id: string) => void }) {
  const { c, tr } = useUI();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [ms, setMs] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      const st = recorder.getStatus();
      setMs(st.durationMillis);
      if (st.durationMillis >= 5 * 60 * 1000) stop();
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);
  async function start() {
    const ok = await awayFor(() => requestRecordingPermissionsAsync());
    if (!ok.granted) return toast(tr('Kural Heart needs the microphone to record.', 'பதிவு செய்ய ஒலிவாங்கி அனுமதி தேவை.'));
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setMs(0);
    setRecording(true);
  }
  async function stop() {
    setRecording(false);
    setSaving(true);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (recorder.uri) onSaved(await addMediaFile(recorder.uri));
    } catch {
      toast(tr('The recording didn’t save.', 'பதிவு சேமிக்கப்படவில்லை.'));
    }
    setSaving(false);
    onClose();
  }
  const cancel = async () => {
    if (recording) {
      setRecording(false);
      await recorder.stop().catch(() => {});
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
    onClose();
  };
  return (
    <Dialog visible={visible} title={tr('Voice note', 'குரல் குறிப்பு')} onClose={cancel}>
      <View style={{ alignItems: 'center', gap: 16, paddingVertical: 8 }}>
        <T v="display">{mmss(ms / 1000)}</T>
        <Pressable
          onPress={recording ? stop : start}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={recording ? tr('Stop and keep', 'நிறுத்திச் சேமி') : tr('Start recording', 'பதிவைத் தொடங்கு')}
          style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: recording ? c.heart : c.primary, alignItems: 'center', justifyContent: 'center' }}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : recording ? (
            <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FFFFFF' }} />
          ) : (
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.onPrimary }} />
          )}
        </Pressable>
        <T v="labelM" color={c.ink3} style={{ textAlign: 'center' }}>
          {recording
            ? tr('Recording. Tap to stop and keep it.', 'பதிவாகிறது. நிறுத்திச் சேமிக்கத் தொடவும்.')
            : tr('Up to five minutes, kept locked on this phone like your pages.', 'ஐந்து நிமிடம் வரை, உங்கள் பக்கங்களைப் போலப் பூட்டி வைக்கப்படும்.')}
        </T>
        <TextLink label={tr('Cancel', 'ரத்து')} color={c.ink3} onPress={cancel} />
      </View>
    </Dialog>
  );
}

/** A video on a page, as a tile that opens the player. */
export function VideoTile({ id, size = 96, onRemove }: { id: string; size?: number; onRemove?: () => void }) {
  const { c, tr } = useUI();
  const router = useRouter();
  return (
    <View>
      <Pressable
        onPress={() => router.push({ pathname: '/video/[id]', params: { id } })}
        accessibilityRole="button"
        accessibilityLabel={tr('Play video', 'காணொளியை இயக்கு')}
        style={{ width: size, height: size, borderRadius: 16, backgroundColor: '#1E1A16', borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: alpha('#FFFFFF', 0.9), alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="play" size={18} color="#1E1A16" fill />
        </View>
      </Pressable>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityLabel={tr('Remove video', 'காணொளியை நீக்கு')}
          style={{ position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(30,26,22,0.6)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={16} color="#F6F2EA" />
        </Pressable>
      ) : null}
    </View>
  );
}
