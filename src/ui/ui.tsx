import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AccessibilityInfo, AppState, useColorScheme } from 'react-native';

import { STRINGS } from '@/i18n/strings';
import type { Strings } from '@/i18n/strings';
import { periodAt } from '@/lib/daily';
import type { Period } from '@/lib/daily';
import { today } from '@/lib/dates';
import type { Day } from '@/lib/dates';
import { useSettings } from '@/lib/settings';

import { Ivory, Midnight, typeScale, withAccent } from './theme';
import type { Colors, Variant } from './theme';

export type UI = {
  c: Colors;
  type: ReturnType<typeof typeScale>;
  tamil: boolean;
  L: Strings;
  /** A string in the lead language. */
  tr: (en: string, ta: string) => string;
  /** True when motion should stop: the app's Reduce motion setting or the system's. */
  still: boolean;
  period: Period;
  /** Today's date (see useToday). */
  day: Day;
  scale: number;
};

const Ctx = createContext<UI | null>(null);

/**
 * The six times of day change the greeting and the sky in Valluvar's arch, and the day itself changes the couplet
 * and the date. Both are checked once a minute and on coming back to the app; each changes, and redraws, only when
 * it actually moves on.
 */
function useClock(): { period: Period; day: Day } {
  const [p, setP] = useState<Period>(() => periodAt());
  const [day, setDay] = useState<Day>(() => today());
  useEffect(() => {
    const check = () => {
      setP(periodAt());
      setDay(today());
    };
    const t = setInterval(check, 60_000);
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, []);
  return { period: p, day };
}

export function UIProvider({ children }: { children: ReactNode }) {
  const s = useSettings();
  const { period, day } = useClock();
  const [systemStill, setSystemStill] = useState(false);
  // Auto follows the phone's own light or dark setting, so the app always matches the system's splash and bars.
  const scheme = useColorScheme();
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemStill).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemStill);
    return () => sub.remove();
  }, []);
  const night = s.theme === 'midnight' || (s.theme === 'auto' && scheme === 'dark');
  const value = useMemo<UI>(() => {
    const scale = s.textScale / 100;
    const L = STRINGS[s.tamil ? 'ta' : 'en'];
    return {
      c: withAccent(night ? Midnight : Ivory, s.accent),
      type: typeScale(s.tamil, scale),
      tamil: s.tamil,
      L,
      tr: (en, ta) => (s.tamil ? ta : en),
      still: s.reduceMotion || systemStill,
      period,
      day,
      scale,
    };
  }, [night, s.accent, s.tamil, s.textScale, s.reduceMotion, systemStill, period, day]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI(): UI {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUI outside UIProvider');
  return v;
}

/** Today, as it changes: at midnight with the app open, or on coming back to it on a later day. */
export function useToday(): Day {
  return useUI().day;
}

export type { Variant };
