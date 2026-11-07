// A starter Aha app: the fonts, the 390 x 844 Figma frame scaled to any phone, and one example screen.
// Replace <Example /> with the screen you're building.
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { C, FONT_FILES } from './src/theme';
import { FitStage } from './src/stage';
import { Booked } from './src/screens/Booked';

function Example() {
  const date = new Date(Date.now() + 2 * 86400000);
  return (
    <Booked
      pro={{ name: 'Placeholder Name', gender: 'woman' }}
      booking={{ date, inDays: 2, time: '6:30 pm', minutes: 50, mode: 'online', pay: 'eap', fee: 0 }}
      onDone={() => {}}
    />
  );
}

export default function App() {
  const [fonts] = useFonts(FONT_FILES);
  if (!fonts) return <View style={{ flex: 1, backgroundColor: C.backgroundPrimary }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <FitStage>
          <Example />
        </FitStage>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
