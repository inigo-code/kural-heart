import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { tabTop } from '@/lib/tabTop';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KolamBand } from '@/ui/kolam';
import { Icon, T } from '@/ui/parts';
import type { IconName } from '@/ui/parts';
import { F, alpha } from '@/ui/theme';
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
  const { c, L, scale, tamil } = useUI();
  const router = useRouter();
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
        {state.routes.map((r) => {
          const tab = TABS.find((t) => t.name === r.name);
          if (!tab) return null;
          const on = state.routes[state.index]?.name === r.name;
          return (
            <Pressable
              key={r.key}
              onPress={() => {
                if (!on) return navigateToTab(r.key);
                // Tapped again: back to the top (and out of Insights to Journey itself).
                if (r.name === 'journey') router.navigate('/journey');
                tabTop(r.name);
              }}
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
                <Icon name={tab.icon} color={on ? c.onSoft : c.ink2} stroke={on ? 2.2 : 1.8} />
              </View>
              {!big || on ? (
                <T
                  v="small"
                  allowFontScaling={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  color={on ? c.ink : c.ink2}
                  style={{
                    // The whole tab's width, so a long Tamil word in bold isn't cut short.
                    alignSelf: 'stretch',
                    textAlign: 'center',
                    marginTop: 4,
                    paddingHorizontal: 2,
                    fontFamily: on ? F.sansBold : F.sansMedium,
                    fontSize: (tamil ? 11 : 12) * Math.min(scale, 1.15),
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
        backBehavior="history"
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
