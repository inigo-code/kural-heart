import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { closeMedia, openMedia } from '@/lib/photos';
import { IconButton, T } from '@/ui/parts';
import { useUI } from '@/ui/ui';

/** A page's video, opened from its sealed copy into a temporary file only while it plays. */
export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { L, tr } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [uri, setUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    openMedia(id, 'mp4').then((u) => {
      if (!live) return;
      if (u) setUri(u);
      else setFailed(true);
    });
    return () => {
      live = false;
      closeMedia(`${id}.mp4`);
    };
  }, [id]);
  const player = useVideoPlayer(uri ? { uri } : null, (p) => {
    p.loop = false;
    p.play();
  });
  return (
    <View style={{ flex: 1, backgroundColor: '#000000', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
        <View style={{ marginLeft: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
          <IconButton name="close" label={L.close} color="#FFFFFF" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {uri ? (
          <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls />
        ) : failed ? (
          <T v="body" color="#FFFFFF">
            {tr('This video can’t be opened.', 'இந்தக் காணொளியைத் திறக்க இயலவில்லை.')}
          </T>
        ) : (
          <ActivityIndicator color="#FFFFFF" />
        )}
      </View>
    </View>
  );
}
