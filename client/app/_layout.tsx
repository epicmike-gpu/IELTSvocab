import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import { PurchaseProvider } from '@/contexts/PurchaseContext';
import { WordListProvider } from '@/contexts/WordListContext';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

export default function RootLayout() {
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
