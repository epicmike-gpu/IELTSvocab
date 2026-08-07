import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Stats {
  todayLearned: number;
  todayKnown: number;
  todayUnknown: number;
  totalKnown: number;
  totalReview: number;
  totalWords: number;
  streak: number;
  last7Days: { date: string; learned: number }[];
}

function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  subtitle,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <FontAwesome6 name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/stats`);
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Screen safeAreaEdges={['left', 'right', 'bottom']} backgroundColor="#F0F0F3">
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </Screen>
    );
  }

  if (!stats) return null;

  const progressPercent = stats.totalWords > 0
    ? Math.round((stats.totalKnown / stats.totalWords) * 100)
    : 0;

  const maxLearned = Math.max(...stats.last7Days.map((d) => d.learned), 1);

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']} backgroundColor="#F0F0F3">
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>学习统计</Text>
          {stats.streak > 0 && (
            <View style={styles.streakBadge}>
              <FontAwesome6 name="fire" size={14} color="#FF6584" />
              <Text style={styles.streakText}>连续 {stats.streak} 天</Text>
            </View>
          )}
        </View>

        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>总体进度</Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.max(progressPercent, 2)}%` },
              ]}
            />
          </View>
          <View style={styles.progressStats}>
            <Text style={styles.progressDetail}>
              已掌握 {stats.totalKnown} / {stats.totalWords} 词
            </Text>
            <Text style={styles.progressDetail}>
              待复习 {stats.totalReview} 词
            </Text>
          </View>
        </View>

        {/* Today Stats */}
        <Text style={styles.sectionTitle}>今日学习</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="book-open"
            iconColor="#6C63FF"
            iconBg="rgba(108,99,255,0.12)"
            label="已学习"
            value={stats.todayLearned}
          />
          <StatCard
            icon="check"
            iconColor="#00B894"
            iconBg="rgba(0,184,148,0.12)"
            label="认识"
            value={stats.todayKnown}
          />
          <StatCard
            icon="xmark"
            iconColor="#FF6584"
            iconBg="rgba(255,101,132,0.12)"
            label="不认识"
            value={stats.todayUnknown}
          />
          <StatCard
            icon="fire"
            iconColor="#FDCB6E"
            iconBg="rgba(253,203,110,0.15)"
            label="连续天数"
            value={stats.streak}
            subtitle="天"
          />
        </View>

        {/* 7-Day Chart */}
        <Text style={styles.sectionTitle}>近 7 天学习量</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            {stats.last7Days.map((day, index) => {
              const barHeight = (day.learned / maxLearned) * 100;
              return (
                <View key={index} style={styles.chartBarWrap}>
                  <Text style={styles.chartValue}>
                    {day.learned > 0 ? day.learned : ''}
                  </Text>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: Math.max(barHeight, 4),
                        backgroundColor:
                          day.learned > 0 ? '#6C63FF' : '#E8E8EB',
                      },
                    ]}
                  />
                  <Text style={styles.chartLabel}>{day.date}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F3',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3436',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,101,132,0.10)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6584',
  },

  // Progress card
  progressCard: {
    marginHorizontal: 24,
    backgroundColor: '#F0F0F3',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6C63FF',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E8E8EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 5,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressDetail: {
    fontSize: 13,
    color: '#636E72',
  },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    paddingHorizontal: 28,
    marginBottom: 12,
    marginTop: 4,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    marginHorizontal: '1.5%',
    backgroundColor: '#F0F0F3',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3436',
  },
  statSubtitle: {
    fontSize: 13,
    color: '#B2BEC3',
    marginTop: 2,
  },

  // Chart
  chartCard: {
    marginHorizontal: 24,
    backgroundColor: '#F0F0F3',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
  },
  chartBarWrap: {
    alignItems: 'center',
    flex: 1,
  },
  chartValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C63FF',
    marginBottom: 4,
  },
  chartBar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#B2BEC3',
    marginTop: 6,
  },
});
