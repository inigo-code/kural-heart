import { Stack } from 'expo-router';

import { useUI } from '@/ui/ui';

/** Journey and the pages under it (Insights), so the tab bar stays below them. */
export default function JourneyLayout() {
  const { c, still } = useUI();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: still ? 'none' : 'slide_from_right' }} />;
}
