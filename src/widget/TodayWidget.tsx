'use no memo';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

// Today's couplet on the home screen (4 by 2). It never shows journal text: a home screen is seen by anyone holding
// the phone. Couplets are flush left, as on the leaf.

export type WidgetData = { period: string; ref: string; a: string; b: string; write: string; night: boolean };

export function TodayWidget({ d }: { d: WidgetData }) {
  const ink = '#2B1E10';
  const note = '#6A4B22';
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        borderRadius: 22,
        backgroundGradient: { from: '#F3E7C6', to: '#E7D4A2', orientation: 'TOP_BOTTOM' },
        paddingHorizontal: 18,
        paddingVertical: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
      <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', justifyContent: 'space-between' }}>
        <TextWidget text={d.period} style={{ fontSize: 13, color: '#B4492A', fontFamily: 'AnekTamil-SemiBold' }} maxLines={1} />
        <TextWidget text={d.ref} style={{ fontSize: 13, color: note, fontFamily: 'AnekTamil-SemiBold' }} maxLines={1} />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
        <TextWidget text={d.a} style={{ fontSize: 17, color: ink, fontFamily: 'AnekTamil-Couplet', textAlign: 'left' }} maxLines={1} truncate="END" />
        <TextWidget text={d.b} style={{ fontSize: 17, color: ink, fontFamily: 'AnekTamil-Couplet', textAlign: 'left' }} maxLines={1} truncate="END" />
      </FlexWidget>
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'kuralheart://write' }}
        style={{ backgroundColor: '#B4492A', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 }}>
        <TextWidget text={d.write} style={{ fontSize: 13, color: '#FFF8F2', fontFamily: 'AnekTamil-SemiBold' }} />
      </FlexWidget>
    </FlexWidget>
  );
}
