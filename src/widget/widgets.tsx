'use no memo';
import { Platform } from 'react-native';
import { registerWidgetTaskHandler, requestWidgetUpdate } from 'react-native-android-widget';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { PERIODS, periodAt, todayKural } from '@/lib/daily';
import { chapterOf, kural } from '@/lib/pack';
import { reloadSettings, settings } from '@/lib/settings';

import { TodayWidget } from './TodayWidget';
import type { WidgetData } from './TodayWidget';

const NAME = 'TodayCouplet';

function data(): WidgetData {
  const s = settings();
  const k = kural(todayKural());
  const ch = chapterOf(k);
  const p = PERIODS[periodAt()];
  const ta = s.tamil;
  return {
    period: ta ? p.ta : `${p.ta} · ${p.en.toLowerCase()}`,
    ref: `${k.n} · ${ta ? ch.ta : ch.en}`,
    a: k.a,
    b: k.b,
    write: ta ? 'இதைப் பற்றி எழுது' : 'Write about this',
    night: p.night,
  };
}

/** Android asks for the widget when it's added, resized, or due a refresh. */
async function taskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== NAME) return;
  if (props.widgetAction === 'WIDGET_ADDED' || props.widgetAction === 'WIDGET_UPDATE' || props.widgetAction === 'WIDGET_RESIZED') {
    reloadSettings();
    props.renderWidget(<TodayWidget d={data()} />);
  }
}

/** Called once from the app's entry (index.ts), before anything else. */
export function registerWidgets() {
  if (Platform.OS === 'android') registerWidgetTaskHandler(taskHandler);
}

export function refreshWidget() {
  if (Platform.OS !== 'android') return;
  requestWidgetUpdate({ widgetName: NAME, renderWidget: () => <TodayWidget d={data()} /> }).catch(() => {});
}
