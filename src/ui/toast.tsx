import { useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from './parts';
import { useUI } from './ui';

// A quiet message at the foot of the screen, with an optional action (Undo).

type Toast = { id: number; text: string; action?: { label: string; run: () => void } };

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

export function toast(text: string, action?: Toast['action']) {
  current = { id: nextId++, text, action };
  listeners.forEach((l) => l());
}

function clear(id: number) {
  if (current?.id === id) {
    current = null;
    listeners.forEach((l) => l());
  }
}

export function ToastHost({ lift = 0 }: { lift?: number }) {
  const t = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => current,
  );
  const { c } = useUI();
  const insets = useSafeAreaInsets();
  const [, force] = useState(0);
  useEffect(() => {
    if (!t) return;
    const timer = setTimeout(() => clear(t.id), t.action ? 6000 : 2800);
    return () => clearTimeout(timer);
  }, [t]);
  if (!t) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 + lift }}>
      <View
        accessibilityLiveRegion="polite"
        style={{ backgroundColor: c.ink, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', elevation: 6 }}>
        <T v="bodyM" color={c.bg} style={{ flex: 1 }}>
          {t.text}
        </T>
        {t.action ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              t.action?.run();
              clear(t.id);
              force((n) => n + 1);
            }}>
            <T v="label" color={c.isNight ? c.primary : c.primarySoft}>
              {t.action.label}
            </T>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
