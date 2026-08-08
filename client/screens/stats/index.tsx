import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { useWordList } from '@/contexts/WordListContext';
import { useAuth } from '@/contexts/AuthContext';

const BASE_URL = '';

interface ProgressData {
  known: number;
  unknown: number;
  total: number;
}

export default function StatsScreen() {
  const { currentListId, lists, setListId, refreshLists } = useWordList();
  const { token } = useAuth();
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/v1/learning/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProgress(data.progress || {});
    } catch (e) {
      console.error('Failed to fetch progress:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    fetchProgress();
    refreshLists();
  }, [fetchProgress, refreshLists]));

  const handleSelectList = (listId: string) => {
    setListId(listId);
  };

  const currentProgress = progress[currentListId] || { known: 0, unknown: 0, total: 0 };
  const currentList = lists.find(l => l.id === currentListId);
  const totalWords = currentList?.totalWords || 0;
  const learned = currentProgress.total || 0;
  const known = currentProgress.known || 0;
  const unknown = currentProgress.unknown || 0;
  const accuracy = learned > 0 ? Math.round((known / learned) * 100) : 0;
  const progressPercent = totalWords > 0 ? Math.round((learned / totalWords) * 100) : 0;

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Text className="text-3xl font-bold text-foreground">学习统计</Text>
          <Text className="text-sm text-muted mt-1">选择词表，查看学习进度</Text>
        </View>

        {/* Word List Selector */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-muted mb-3">选择词表</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                progress={progress[list.id]}
                isSelected={list.id === currentListId}
                onSelect={() => handleSelectList(list.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Stats Cards */}
        <View className="px-6">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#4ECDC4" />
            </View>
          ) : (
            <>
              {/* Progress Card */}
              <View className="bg-card-bg rounded-3xl p-5 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
                <Text className="text-sm text-muted mb-3">学习进度</Text>
                <View className="flex-row items-end gap-2 mb-3">
                  <Text className="text-4xl font-bold text-foreground">{learned}</Text>
                  <Text className="text-muted text-lg mb-1">/ {totalWords} 词</Text>
                </View>
                <View className="h-3 bg-background rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-accent-mint rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
                <Text className="text-sm text-muted mt-2">{progressPercent}% 完成</Text>
              </View>

              {/* Stats Grid */}
              <View className="flex-row gap-3 mb-4">
                <StatCard
                  icon="check-circle"
                  iconColor="#4ECDC4"
                  label="认识"
                  value={String(known)}
                />
                <StatCard
                  icon="times-circle"
                  iconColor="#FF6B6B"
                  label="不认识"
                  value={String(unknown)}
                />
                <StatCard
                  icon="bullseye"
                  iconColor="#FFB347"
                  label="正确率"
                  value={`${accuracy}%`}
                />
              </View>

              {/* Tips */}
              <View className="bg-accent-mint/10 rounded-3xl p-4 flex-row items-center gap-3">
                <FontAwesome6 name="lightbulb" size={20} color="#4ECDC4" />
                <Text className="text-foreground/80 text-sm flex-1">
                  坚持每天学习，记忆更牢固！
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function ListCard({ list, progress, isSelected, onSelect }: { 
  list: any; 
  progress?: ProgressData;
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const learned = progress?.total || 0;
  const total = list.totalWords || 0;
  const percent = total > 0 ? Math.round((learned / total) * 100) : 0;

  return (
    <Pressable
      onPress={onSelect}
      className={`px-4 py-3 rounded-2xl min-w-[140px] ${isSelected ? 'bg-accent-mint/15 border-2 border-accent-mint' : 'bg-card-bg border-2 border-transparent'}`}
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
    >
      <View className="flex-row items-center gap-2 mb-1">
        <FontAwesome6 name={list.icon as any} size={14} color={list.color} />
        <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>{list.name}</Text>
      </View>
      <Text className="text-muted text-xs">{total} 词</Text>
      <View className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
        <View className="h-full bg-accent-mint rounded-full" style={{ width: `${percent}%` }} />
      </View>
      <Text className="text-xs text-muted mt-1">{percent}%</Text>
      {isSelected && (
        <View className="absolute top-2 right-2">
          <FontAwesome6 name="check-circle" size={16} color="#4ECDC4" />
        </View>
      )}
    </Pressable>
  );
}

function StatCard({ icon, iconColor, label, value }: { icon: string; iconColor: string; label: string; value: string }) {
  return (
    <View className="flex-1 bg-card-bg rounded-2xl p-4 items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <FontAwesome6 name={icon as any} size={22} color={iconColor} />
      <Text className="text-foreground text-xl font-bold mt-2">{value}</Text>
      <Text className="text-muted text-xs mt-0.5">{label}</Text>
    </View>
  );
}
