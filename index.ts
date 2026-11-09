// The app's entry: Expo Router, plus the home-screen widget's handler and the nightly task, which Android can call
// with the app closed (so they have to be registered here, not inside a screen).
import 'expo-router/entry';

import { defineNightly } from '@/lib/background';
import { registerWidgets } from '@/widget/widgets';

registerWidgets();
defineNightly();
