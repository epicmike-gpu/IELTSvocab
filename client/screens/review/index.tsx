import { Screen } from '@/components/Screen';
import { useWordList } from '@/contexts/WordListContext';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { FontAwesome6 } from '@expo/vector-icons';
import { getDeviceId } from '@/utils/deviceId';

if (Platform.OS === 'web') {
  // @ts-ignore
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    // @ts-ignore
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

interface ReviewWord {
  id: number;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  exampleCn: string;
  difficulty: 1 | 2 | 3;
}

function WordItem({ item, onRemove }: { item: ReviewWord; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const speak = () => {
    Speech.speak(item.word, { language: 'en-GB', rate: 0.85 });
  };

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View className="bg-card-bg rounded-3xl mb-3 overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
      <Pressable onPress={toggle} className="p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-xl font-bold text-text-primary">{item.word}</Text>
              <Text className="text-sm text-text-secondary">{item.phonetic}</Text>
            </View>
            <Text className="text-text-secondary text-sm" numberOfLines={1}>
              {item.pos} {item.meaning}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <FontAwesome6
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#9E8FA8"
            />
          </View>
        </View>
      </Pressable>

      {expanded && (
        <View className="px-4 pb-4 border-t border-divider pt-3">
          <View className="flex-row items-center gap-2 mb-3">
            <Pressable onPress={speak} className="bg-accent-mint/15 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
              <FontAwesome6 name="volume-up" size={12} color="#4ECDC4" />
              <Text className="text-accent-mint text-xs font-medium">听发音</Text>
            </Pressable>
          </View>
          <Text className="text-text-primary text-base leading-6 mb-3">{item.meaning}</Text>
          {item.example && (
            <View className="bg-background rounded-2xl p-3 mb-3">
              <Text className="text-text-primary text-sm leading-6 italic">{item.example}</Text>
              <Text className="text-text-secondary text-sm leading-5 mt-1">{item.exampleCn}</Text>
            </View>
          )}
          <Pressable
            onPress={onRemove}
            className="bg-accent-coral/15 py-3 rounded-2xl flex-row items-center justify-center gap-2"
          >
            <FontAwesome6 name="check-circle" size={14} color="#FF6B6B" />
            <Text className="text-accent-coral font-semibold text-sm">已掌握，移除</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const { currentListId, currentList } = useWordList();
  const [reviewWords, setReviewWords] = useState<ReviewWord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/learning/review?listId=${currentListId}`, {
        headers: { 'x-device-id': await getDeviceId() },
      });
      const data = await res.json();
      setReviewWords(data.words || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentListId]);

  useFocusEffect(
    useCallback(() => {
      fetchReview();
    }, [fetchReview])
  );

  const handleRemove = async (wordId: number) => {
    try {
      await fetch(`${BASE_URL}/api/v1/learning/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': await getDeviceId(),
        },
        body: JSON.stringify({
          wordId,
          wordListId: currentListId,
          status: 'known'
        }),
      });
      setReviewWords((prev) => prev.filter((w) => w.id !== wordId));
    } catch {
      // ignore
    }
  };

  return (
    <Screen>
      <View className="flex-1 px-5" style={{ paddingTop: insets.top + 4 }}>
        <Text className="text-2xl font-bold text-text-primary mb-1">复习本</Text>
        <Text className="text-text-secondary text-sm mb-4">
          {currentList?.name} · {reviewWords.length} 个待复习
        </Text>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4ECDC4" />
          </View>
        ) : reviewWords.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="bg-background rounded-full w-20 h-20 items-center justify-center mb-4">
              <FontAwesome6 name="check-circle" size={32} color="#4ECDC4" />
            </View>
            <Text className="text-text-primary text-lg font-semibold mb-2">太棒了！</Text>
            <Text className="text-text-secondary text-center px-8">
              暂无需要复习的单词
            </Text>
          </View>
        ) : (
          <FlatList
            data={reviewWords}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <WordItem item={item} onRemove={() => handleRemove(item.id)} />
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
