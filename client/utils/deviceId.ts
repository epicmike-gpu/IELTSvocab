import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'device_id';
let cached: string | null = null;

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  let id: string | null = null;
  try {
    id = await AsyncStorage.getItem(KEY);
  } catch {
    id = null;
  }
  if (!id) {
    id = generateUuid();
    try {
      await AsyncStorage.setItem(KEY, id);
    } catch {
      // keep in-memory id for this session
    }
  }
  cached = id;
  return id;
}
