import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { useWordList, WordListInfo } from '@/contexts/WordListContext';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface StatsData {
  todayLearned: number;
  todayKnown: number;
  todayUnknown: number;
  totalKnown: number;
  totalReview: number;
  totalWords: number;
  streak: number;
  last7Days: { date: string; learned: number }[];
}

export default function StatsScreen() {
  const { currentListId, lists, setListId, refreshLists } = useWordList();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/v1/stats?listId=${currentListId}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    } finally {
      setLoading(false);
    }
  }, [currentListId]);

  useFocusEffect(useCallback(() => {
    fetchStats();
    refreshLists();
  }, [fetchStats, refreshLists]));

  const handleSelectList = (listId: string) => {
    setListId(listId);
  };

  const progress = stats ? (stats.totalWords > 0 ? Math.round(((stats.totalKnown + stats.totalReview) / stats.totalWords) * 100) : 0) : 0;
  const accuracy = stats && (stats.totalKnown + stats.totalReview) > 0
    ? Math.round((stats.totalKnown / (stats.totalKnown + stats.totalReview)) * 100)
    : 0;

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
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
              {lists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  isSelected={list.id === currentListId}
                  onSelect={() => handleSelectList(list.id)}
                />
              ))}
              {lists.length === 0 && (
                <View className="px-4 py-8 items-center">
                  <ActivityIndicator color="#6C63FF" />
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        ) : stats ? (
          <>
            {/* Today Stats */}
            <View className="px-6 mb-6">
              <Text className="text-sm font-semibold text-muted mb-3">今日学习</Text>
              <View className="bg-card rounded-3xl p-5 border border-border">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-4xl font-bold text-foreground">{stats.todayLearned}</Text>
                    <Text className="text-sm text-muted mt-1">今日已学</Text>
                  </View>
                  <View className="w-16 h-16 rounded-full bg-accent/10 items-center justify-center">
                    <FontAwesome6 name="fire" size={28} color="#6C63FF" />
                  </View>
                </View>
                <View className="flex-row gap-4 pt-3 border-t border-border">
                  <View className="flex-1 items-center">
                    <Text className="text-xl font-bold text-primary">{stats.todayKnown}</Text>
                    <Text className="text-xs text-muted mt-0.5">认识</Text>
                  </View>
                  <View className="w-px bg-border" />
                  <View className="flex-1 items-center">
                    <Text className="text-xl font-bold text-danger">{stats.todayUnknown}</Text>
                    <Text className="text-xs text-muted mt-0.5">不认识</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Overall Progress */}
            <View className="px-6 mb-6">
              <Text className="text-sm font-semibold text-muted mb-3">总体进度</Text>
              <View className="bg-card rounded-3xl p-5 border border-border">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-4xl font-bold text-foreground">{progress}%</Text>
                    <Text className="text-sm text-muted mt-1">
                      {stats.totalKnown + stats.totalReview} / {stats.totalWords} 词
                    </Text>
                  </View>
                  <View className="w-16 h-16 rounded-full bg-accent/10 items-center justify-center">
                    <FontAwesome6 name="chart-line" size={28} color="#6C63FF" />
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="h-3 bg-border rounded-full overflow-hidden mb-4">
                  <View
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </View>

                <View className="flex-row gap-4 pt-3 border-t border-border">
                  <View className="flex-1 items-center">
                    <Text className="text-xl font-bold text-primary">{stats.totalKnown}</Text>
                    <Text className="text-xs text-muted mt-0.5">已掌握</Text>
                  </View>
                  <View className="w-px bg-border" />
                  <View className="flex-1 items-center">
                    <Text className="text-xl font-bold text-warning">{stats.totalReview}</Text>
                    <Text className="text-xs text-muted mt-0.5">待复习</Text>
                  </View>
                  <View className="w-px bg-border" />
                  <View className="flex-1 items-center">
                    <Text className="text-xl font-bold text-foreground">{accuracy}%</Text>
                    <Text className="text-xs text-muted mt-0.5">正确率</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Streak */}
            <View className="px-6 mb-6">
              <Text className="text-sm font-semibold text-muted mb-3">连续学习</Text>
              <View className="bg-card rounded-3xl p-5 border border-border flex-row items-center gap-4">
                <View className="w-14 h-14 rounded-full bg-warning/10 items-center justify-center">
                  <FontAwesome6 name="trophy" size={24} color="#F5A623" />
                </View>
                <View>
                  <Text className="text-3xl font-bold text-foreground">{stats.streak}</Text>
                  <Text className="text-sm text-muted mt-0.5">天连续学习</Text>
                </View>
              </View>
            </View>

            {/* 7-Day Chart */}
            <View className="px-6 mb-6">
              <Text className="text-sm font-semibold text-muted mb-3">近 7 天</Text>
              <View className="bg-card rounded-3xl p-5 border border-border">
                <View className="flex-row justify-between items-end h-32">
                  {stats.last7Days.map((day, index) => {
                    const maxLearned = Math.max(...stats.last7Days.map(d => d.learned), 1);
                    const height = Math.max((day.learned / maxLearned) * 100, 4);
                    return (
                      <View key={index} className="flex-1 items-center gap-2">
                        <Text className="text-xs font-medium text-foreground">{day.learned}</Text>
                        <View
                          className="w-6 bg-accent rounded-t-lg"
                          style={{ height: `${height}%` }}
                        />
                        <Text className="text-xs text-muted">{day.date}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ListCard({ list, isSelected, onSelect }: { list: WordListInfo; isSelected: boolean; onSelect: () => void }) {
  return (
    <Pressable
      onPress={onSelect}
      className={`rounded-2xl p-4 border-2 min-w-[160px] ${
        isSelected ? 'border-accent bg-accent/5' : 'border-border bg-card'
      }`}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: `${list.color}20` }}
        >
          <FontAwesome6
            name={list.icon as any}
            size={14}
            color={list.color}
          />
        </View>
        <Text className="text-sm font-semibold text-foreground flex-1">{list.name}</Text>
      </View>
      <Text className="text-xs text-muted mb-2" numberOfLines={2}>{list.description}</Text>
      <View className="flex-row gap-3">
        <Text className="text-xs text-muted">
          <Text className="font-semibold text-foreground">{list.totalWords}</Text> 词
        </Text>
        <Text className="text-xs text-muted">
          <Text className="font-semibold text-primary">{list.knownCount}</Text> 已学
        </Text>
      </View>
      {isSelected && (
        <View className="absolute top-2 right-2">
          <FontAwesome6 name="circle-check" size={16} color="#6C63FF" />
        </View>
      )}
    </Pressable>
  );
}
