import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import * as Updates from 'expo-updates';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import { PurchaseProvider } from '@/contexts/PurchaseContext';
import { WordListProvider } from '@/contexts/WordListContext';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

export default function RootLayout() {
  const lastCheckRef = useRef(0);
  useEffect(() => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) return;
    let checking = false;
    const check = async () => {
      if (checking || Date.now() - lastCheckRef.current < 60000) return;
      checking = true;
      lastCheckRef.current = Date.now();
      try {
        const res = await Updates.checkForUpdateAsync();
        if (res.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {}
      checking = false;
    };
    check();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, []);

  return (
    <Provider>
      <PurchaseProvider>
        <WordListProvider>
          <Stack
            screenOptions={{
              animation: 'slide_from_right',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              headerShown: false
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
          <Toast />
        </WordListProvider>
      </PurchaseProvider>
    </Provider>
  );
}
