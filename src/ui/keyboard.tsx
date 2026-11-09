import { useEffect, useRef, useState } from 'react';
import type { ComponentRef, ReactNode } from 'react';
import { Keyboard, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * A screen that makes room for the keyboard (as in Watch Heart): Android apps draw edge to edge, so the window no
 * longer shrinks for the keyboard. This measures how far the keyboard covers the view and pads that much.
 * [inset] is bottom padding the screen already keeps for the navigation bar; the keyboard covers it, so it isn't
 * added twice.
 */
export function KeyboardSafe({ style, children, inset = 0 }: { style?: StyleProp<ViewStyle>; children: ReactNode; inset?: number }) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [room, setRoom] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      ref.current?.measureInWindow((_x, y, _w, h) => setRoom(Math.max(0, y + h - e.endCoordinates.screenY - inset)));
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setRoom(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [inset]);
  return (
    <View ref={ref} style={[{ flex: 1 }, style, room > 0 && { paddingBottom: room }]}>
      {children}
    </View>
  );
}
