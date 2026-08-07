import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import * as Speech from 'expo-speech';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface ReviewWord {
  id: number;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  exampleCn: string;
  difficulty: 1 | 2 | 3;
  reviewCount: number;
  lastReviewed: number;
}

function ReviewItem({
  item,
  expanded,
  onToggle,
  onKnown,
}: {
  item: ReviewWord;
  expanded: boolean;
  onToggle: () => void;
  onKnown: () => void;
}) {
  return (
    <View style={styles.itemCard}>
      <Pressable onPress={onToggle} style={styles.itemHeader}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemWord}>{item.word}</Text>
          <Text style={styles.itemPhonetic}>{item.phonetic}</Text>
        </View>
        <View style={styles.itemRight}>
          <View style={styles.reviewCountBadge}>
            <Text style={styles.reviewCountText}>×{item.reviewCount}</Text>
          </View>
          <FontAwesome6
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#B2BEC3"
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.itemDetail}>
          <View style={styles.detailRow}>
            <Text style={styles.detailPos}>{item.pos}</Text>
            <Text style={styles.detailMeaning}>{item.meaning}</Text>
          </View>
          <Pressable
            onPress={() => Speech.speak(item.word, { language: 'en-GB', rate: 0.85 })}
            style={styles.speakerBtn}
          >
            <FontAwesome6 name="volume-high" size={14} color="#6C63FF" />
            <Text style={styles.speakerText}>听发音</Text>
          </Pressable>
          <View style={styles.exampleBox}>
            <Text style={styles.exampleText}>{item.example}</Text>
            <Text style={styles.exampleCnText}>{item.exampleCn}</Text>
          </View>
          <Pressable onPress={onKnown} style={styles.knownBtnWrap}>
            <View style={styles.knownBtn}>
              <FontAwesome6 name="check" size={14} color="#00B894" />
              <Text style={styles.knownBtnText}>已掌握</Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function ReviewScreen() {
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/review`);
        const data = await res.json();
        if (!cancelled) setWords(data.words);
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleKnown = async (id: number) => {
    try {
      await fetch(`${BASE_URL}/api/v1/review/${id}/known`, { method: 'POST' });
      setWords((prev) => prev.filter((w) => w.id !== id));
    } catch {}
  };

  const renderItem = ({ item }: { item: ReviewWord }) => (
    <ReviewItem
      item={item}
      expanded={expandedId === item.id}
      onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
      onKnown={() => handleKnown(item.id)}
    />
  );

  if (loading) {
    return (
      <Screen safeAreaEdges={['left', 'right', 'bottom']} backgroundColor="#F0F0F3">
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']} backgroundColor="#F0F0F3">
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>复习本</Text>
          <View style={styles.countBadge}>
            <FontAwesome6 name="book" size={12} color="#FF6584" />
            <Text style={styles.countText}>{words.length} 个单词</Text>
          </View>
        </View>

        {words.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <FontAwesome6 name="circle-check" size={48} color="#00B894" />
            </View>
            <Text style={styles.emptyTitle}>太棒了!</Text>
            <Text style={styles.emptySubtitle}>
              复习本是空的，说明你都认识这些单词
            </Text>
          </View>
        ) : (
          <FlatList
            data={words}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3436',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,101,132,0.10)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6584',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  itemCard: {
    backgroundColor: '#F0F0F3',
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  itemLeft: {
    flex: 1,
  },
  itemWord: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  itemPhonetic: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewCountBadge: {
    backgroundColor: 'rgba(255,101,132,0.10)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reviewCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6584',
  },
  itemDetail: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  detailPos: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '600',
  },
  detailMeaning: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  speakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108,99,255,0.08)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 5,
  },
  speakerText: {
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '600',
  },
  exampleBox: {
    backgroundColor: '#E8E8EB',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  exampleText: {
    fontSize: 13,
    color: '#2D3436',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  exampleCnText: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 6,
    lineHeight: 18,
  },
  knownBtnWrap: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  knownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,184,148,0.10)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  knownBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B894',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,184,148,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
