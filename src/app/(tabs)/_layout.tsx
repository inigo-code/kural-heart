import { Tabs } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KolamBand } from '@/ui/kolam';
import { Icon, T } from '@/ui/parts';
import type { IconName } from '@/ui/parts';
import { alpha } from '@/ui/theme';
import { useUI } from '@/ui/ui';

const TABS: {
  name: string;
  icon: IconName;
  label: 'today' | 'kural' | 'journal' | 'journey' | 'settings';
}[] = [
  { name: 'index', icon: 'today', label: 'today' },
  { name: 'kural', icon: 'book', label: 'kural' },
  { name: 'journal', icon: 'journal', label: 'journal' },
  { name: 'journey', icon: 'journey', label: 'journey' },
  { name: 'settings', icon: 'settings', label: 'settings' },
];

type BarProps = {
  state: { index: number; routes: { name: string; key: string }[] };
  navigateToTab: (routeKey: string) => void;
};

function NavBar({ state, navigateToTab }: BarProps) {
  const { c, L, scale } = useUI();
  const insets = useSafeAreaInsets();
  // At the largest text sizes only the open tab keeps its label.
  const big = scale >= 1.3;
  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingBottom: insets.bottom,
      }}>
      <KolamBand height={14} strength={0.9} />
      <View style={{ flexDirection: 'row', height: 76 }}>
        {state.routes.map((r, i) => {
          const tab = TABS.find((t) => t.name === r.name);
          if (!tab) return null;
          const on = state.index === i;
          return (
            <Pressable
              key={r.key}
              onPress={() => navigateToTab(r.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={L[tab.label]}
              style={{ flex: 1, alignItems: 'center', paddingTop: 12 }}>
              <View
                style={{
                  width: 56,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? c.primarySoft : alpha(c.primarySoft, 0),
                  overflow: 'hidden',
                }}>
                <Icon name={tab.icon} color={on ? c.onSoft : c.ink3} />
              </View>
              {!big || on ? (
                <T
                  v="small"
                  allowFontScaling={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  color={on ? c.ink : c.ink3}
                  style={{
                    marginTop: 4,
                    fontSize: 12 * Math.min(scale, 1.15),
                    lineHeight: 16 * Math.min(scale, 1.15),
                  }}>
                  {L[tab.label]}
                </T>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { c, still } = useUI();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(p) => <NavBar {...(p as unknown as BarProps)} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: c.bg },
          animation: still ? 'none' : 'fade',
        }}>
        {TABS.map((t) => (
          <Tabs.Screen key={t.name} name={t.name} />
        ))}
      </Tabs>
      {/* A strip under the status bar, so pages scroll beneath it rather than through the clock. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: c.bg,
        }}
      />
    </View>
  );
}
