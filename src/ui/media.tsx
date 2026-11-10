import { RecordingPresets, createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { awayFor } from '@/lib/lock';
import { addMediaFile, closeMedia, openMedia } from '@/lib/photos';

import { Dialog } from './common';
import { Icon, T, TextLink } from './parts';
import { alpha } from './theme';
import { toast } from './toast';
import { useUI } from './ui';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * A voice note on a page: play and pause, how far along, and (while writing) remove. The player is made when Play is
 * first tapped, from the note's temporary plain copy, after setting the audio mode for playback; the same way the
 * couplet recordings played (a player from the hook, waiting for "loaded", could stay silent on some phones).
 */
export function AudioNote({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const { c, tr } = useUI();
  const player = useRef<AudioPlayer | null>(null);
  const [opening, setOpening] = useState(false);
  const [st, setSt] = useState({ playing: false, at: 0, length: 0 });
  // Let go of the player when the note leaves the screen.
  useEffect(
    () => () => {
      try {
        player.current?.remove();
      } catch {}
      player.current = null;
    },
    [],
  );
  const toggle = async () => {
    const p0 = player.current;
    if (p0) {
      if (p0.playing) p0.pause();
      else {
        if (p0.duration && p0.currentTime >= p0.duration - 0.2) await p0.seekTo(0);
        p0.play();
      }
      return;
    }
    setOpening(true);
    const uri = await openMedia(id, 'm4a');
    if (!uri) {
      setOpening(false);
      return toast(tr('This voice note can’t be opened.', 'இந்தக் குரல் குறிப்பைத் திறக்க இயலவில்லை.'));
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldRouteThroughEarpiece: false }).catch(() => {});
    const p = createAudioPlayer({ uri });
    p.loop = false;
    player.current = p;
    p.addListener('playbackStatusUpdate', (s) => {
      // At the end it stops and stays there; the next tap starts again from the top (see above). Seeking back to the
      // start here made Android play it again, over and over.
      if (s.didJustFinish) {
        p.pause();
        setSt({ playing: false, at: s.duration || s.currentTime, length: s.duration || 0 });
        return;
      }
      setSt({ playing: s.playing, at: s.currentTime, length: s.duration || 0 });
    });
    setOpening(false);
    p.play();
  };
  const progress = st.length ? Math.min(1, st.at / st.length) : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingRight: 14, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={st.playing ? tr('Pause voice note', 'குரல் குறிப்பை நிறுத்து') : tr('Play voice note', 'குரல் குறிப்பை இயக்கு')}
        style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 23, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.93 : 1 }] })}>
        {opening ? <ActivityIndicator color={c.onPrimary} /> : <Icon name={st.playing ? 'stop' : 'play'} size={20} color={c.onPrimary} fill />}
      </Pressable>
      <View style={{ flex: 1, gap: 7 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="mic" size={15} color={c.primary} />
          <T v="label">{tr('Voice note', 'குரல் குறிப்பு')}</T>
        </View>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: alpha(c.ink3, 0.22), overflow: 'hidden' }}>
          <View style={{ width: `${progress * 100}%`, height: 4, backgroundColor: c.primary }} />
        </View>
      </View>
      <T v="labelM" color={c.ink3}>
        {st.length ? `${mmss(st.at)} / ${mmss(st.length)}` : st.playing ? mmss(st.at) : ''}
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

/**
 * A video on a page, played right there: a compact card until tapped, then the player at the page's width, sized to
 * the clip, with its own controls (and their full-screen button, for anyone who wants it).
 */
export function VideoNote({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const { c, tr } = useUI();
  const [uri, setUri] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [ratio, setRatio] = useState(16 / 9);
  const player = useVideoPlayer(uri ? { uri } : null, (p) => {
    p.loop = false;
    p.play();
  });
  useEffect(() => {
    const sub = player.addListener('videoTrackChange', ({ videoTrack }) => {
      const s = videoTrack?.size;
      if (s && s.width && s.height) setRatio(s.width / s.height);
    });
    return () => sub.remove();
  }, [player]);
  // The plain copy is only for the player; it goes when the page does.
  useEffect(() => () => closeMedia(`${id}.mp4`), [id]);
  const open = async () => {
    setOpening(true);
    const u = await openMedia(id, 'mp4');
    setOpening(false);
    if (!u) return toast(tr('This video can’t be opened.', 'இந்தக் காணொளியைத் திறக்க இயலவில்லை.'));
    setUri(u);
  };
  const remove = onRemove ? (
    <Pressable
      onPress={onRemove}
      hitSlop={8}
      accessibilityLabel={tr('Remove video', 'காணொளியை நீக்கு')}
      style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(20,16,12,0.55)', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="close" size={16} color="#F6F2EA" />
    </Pressable>
  ) : null;
  if (!uri)
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingRight: 14, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
        <Pressable
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={tr('Play video', 'காணொளியை இயக்கு')}
          style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 23, backgroundColor: c.isNight ? c.surface3 : '#1E1A16', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.93 : 1 }] })}>
          {opening ? <ActivityIndicator color="#F6F2EA" /> : <Icon name="play" size={20} color="#F6F2EA" fill />}
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="video" size={16} color={c.primary} />
          <T v="label">{tr('Video', 'காணொளி')}</T>
        </View>
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={tr('Remove video', 'காணொளியை நீக்கு')}>
            <Icon name="close" size={18} color={c.ink3} />
          </Pressable>
        ) : null}
      </View>
    );
  return (
    <View style={{ borderRadius: 22, overflow: 'hidden', backgroundColor: '#000000', aspectRatio: Math.max(0.75, Math.min(16 / 9, ratio)) }}>
      <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} />
      {remove ? <View style={{ position: 'absolute', top: 8, right: 8 }}>{remove}</View> : null}
    </View>
  );
}

/** A video in the media grid, as a tile that opens the player. */
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
