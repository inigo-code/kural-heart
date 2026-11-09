import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import { STRINGS } from '@/i18n/strings';
import type { Strings } from '@/i18n/strings';
import { PERIODS, periodAt } from '@/lib/daily';
import type { Period } from '@/lib/daily';
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
  scale: number;
};

const Ctx = createContext<UI | null>(null);

/** The six times of day change the greeting and, on Auto, the theme; checked once a minute. */
function usePeriod(): Period {
  const [p, setP] = useState<Period>(() => periodAt());
  useEffect(() => {
    const t = setInterval(() => setP(periodAt()), 60_000);
    return () => clearInterval(t);
  }, []);
  return p;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const s = useSettings();
  const period = usePeriod();
  const [systemStill, setSystemStill] = useState(false);
  useColorScheme();
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemStill).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemStill);
    return () => sub.remove();
  }, []);
  const night = s.theme === 'midnight' || (s.theme === 'auto' && PERIODS[period].night);
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
      scale,
    };
  }, [night, s.accent, s.tamil, s.textScale, s.reduceMotion, systemStill, period]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI(): UI {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUI outside UIProvider');
  return v;
}

export type { Variant };
