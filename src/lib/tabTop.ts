// Tapping the tab you are already on takes its page back to the top (the Android and iOS habit); other tabs keep
// their place. Each tab's screen registers how to scroll itself; the tab bar calls it.

import { useEffect } from 'react';

const handlers = new Map<string, () => void>();

/** Register [scrollToTop] for the tab named [name] while the screen is mounted. */
export function useTabTop(name: string, scrollToTop: () => void) {
  useEffect(() => {
    handlers.set(name, scrollToTop);
    return () => {
      if (handlers.get(name) === scrollToTop) handlers.delete(name);
    };
  }, [name, scrollToTop]);
}

/** The open tab was tapped again. */
export function tabTop(name: string) {
  handlers.get(name)?.();
}
