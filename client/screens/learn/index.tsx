import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWordList } from '@/contexts/WordListContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.50;
const SWIPE_THRESHOLD = 120;

interface Word {
  id: number;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  exampleCn: string;
  difficulty: 1 | 2 | 3;
  wordListId?: string;
  root?: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

const difficultyLabel = (d: number) => {
  if (d === 1) return '基础';
  if (d === 2) return '进阶';
  return '高阶';
};

const difficultyColor = (d: number) => {
  if (d === 1) return '#00B894';
  if (d === 2) return '#6C63FF';
  return '#FF6584';
};

function speakWord(word: string) {
  Speech.speak(word, { language: 'en-GB', rate: 0.85 });
}

function getWordFontSize(word: string): number {
  const len = word.length;
  if (len <= 5) return 48;
  if (len <= 8) return 42;
  if (len <= 12) return 36;
  if (len <= 16) return 30;
  return 26;
}

function WordCard({
  word,
  onSwipeLeft,
  onSwipeRight,
  isTop,
}: {
  word: Word;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipProgress = useSharedValue(0);
  const [enrichedWord, setEnrichedWord] = useState<Word>(word);
  const [isEnriching, setIsEnriching] = useState(false);

  useEffect(() => {
    setEnrichedWord(word);
    setIsFlipped(false);
    flipProgress.value = 0;

    if (isTop && (!word.phonetic || !word.example)) {
      setIsEnriching(true);
      const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
      fetch(`${BASE_URL}/api/v1/words/${word.id}/enrich?wordListId=${word.wordListId || ''}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.word) {
            setEnrichedWord(prev => ({ ...prev, ...data.word }));
          }
        })
        .catch(() => {})
        .finally(() => setIsEnriching(false));
    }
  }, [word.id, isTop]);

  const panGesture = Gesture.Pan()
    .enabled(isTop && !isFlipped)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 280 }, (finished) => {
          if (finished) runOnJS(onSwipeRight)();
        });
        translateY.value = withTiming(40, { duration: 280 });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 280 }, (finished) => {
          if (finished) runOnJS(onSwipeLeft)();
        });
        translateY.value = withTiming(40, { duration: 280 });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value * 0.08}deg` },
    ],
  }));

  const rightOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.8, 1], 'clamp') }],
  }));

  const leftOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0.8], 'clamp') }],
  }));

  const backCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(Math.abs(translateX.value), [0, SWIPE_THRESHOLD], [1, 0.95], 'clamp') },
    ],
    opacity: interpolate(Math.abs(translateX.value), [0, SWIPE_THRESHOLD], [0, 0.6], 'clamp'),
  }));

  const frontOpacity = useAnimatedStyle(() => ({
    opacity: 1 - flipProgress.value,
  }));

  const backOpacity = useAnimatedStyle(() => ({
    opacity: flipProgress.value,
  }));

  const handleFlip = () => {
    const newVal = isFlipped ? 0 : 1;
    flipProgress.value = withTiming(newVal, { duration: 300 });
    setIsFlipped(!isFlipped);
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          isTop ? cardStyle : backCardStyle,
          { zIndex: isTop ? 10 : 1 },
        ]}
      >
        {/* Front face */}
        <Animated.View style={[styles.cardFace, frontOpacity]}>
          <View style={styles.difficultyBadge}>
            <View
              style={[
                styles.difficultyDot,
                { backgroundColor: difficultyColor(word.difficulty) },
              ]}
            />
            <Text style={[styles.difficultyText, { color: difficultyColor(word.difficulty) }]}>
              {difficultyLabel(word.difficulty)}
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text 
              style={[styles.wordText, { fontSize: getWordFontSize(word.word) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {word.word}
            </Text>
            <Text style={styles.phoneticText}>{enrichedWord.phonetic || (isTop && isEnriching ? '加载音标...' : word.phonetic)}</Text>
            <Text style={styles.posText}>{word.pos}</Text>
            {isTop && (
              <Pressable
                onPress={() => speakWord(word.word)}
                style={styles.speakerBtn}
              >
                <FontAwesome6 name="volume-high" size={15} color="#6C63FF" />
                <Text style={styles.speakerText}>听发音</Text>
              </Pressable>
            )}
            <Text style={styles.tapHint}>点击卡片翻转查看释义</Text>
          </View>

          {/* Swipe overlays */}
          <Animated.View style={[styles.swipeOverlay, rightOverlayStyle]}>
            <View style={styles.overlayCircle}>
              <FontAwesome6 name="check" size={32} color="#00B894" />
            </View>
            <Text style={[styles.overlayText, { color: '#00B894' }]}>认识</Text>
          </Animated.View>

          <Animated.View style={[styles.swipeOverlay, leftOverlayStyle]}>
            <View style={styles.overlayCircle}>
              <FontAwesome6 name="xmark" size={32} color="#FF6B6B" />
            </View>
            <Text style={[styles.overlayText, { color: '#FF6B6B' }]}>不认识</Text>
          </Animated.View>
        </Animated.View>

        {/* Back face */}
        <Animated.View style={[styles.cardFace, styles.cardBack, backOpacity]}>
          <View style={styles.backContent}>
            <Text style={styles.backWord}>{word.word}</Text>
            <Text style={styles.backPhonetic}>{enrichedWord.phonetic || word.phonetic}</Text>
            <Pressable
              onPress={() => speakWord(word.word)}
              style={styles.speakerBtn}
            >
              <FontAwesome6 name="volume-high" size={15} color="#6C63FF" />
              <Text style={styles.speakerText}>听发音</Text>
            </Pressable>
            <View style={styles.divider} />
            <Text style={styles.backPos}>{word.pos}</Text>
            <Text style={styles.backMeaning}>{enrichedWord.meaning || word.meaning}</Text>
            <View style={styles.exampleBox}>
              <Text style={styles.exampleText}>{enrichedWord.example || word.example || (isTop && isEnriching ? '正在生成例句...' : '')}</Text>
              <Text style={styles.exampleCnText}>{enrichedWord.exampleCn || word.exampleCn}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Tap to flip overlay - only when not flipped and is top card */}
        {isTop && !isFlipped && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleFlip}
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export default function LearnScreen() {
  const { currentListId, currentList } = useWordList();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allDone, setAllDone] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/words/batch?listId=${currentListId}&offset=0&limit=10`);
      const data = await res.json();
      setWords(data.words);
      setCurrentIndex(0);
      setAllDone(data.words.length === 0);
      
      // 按需生成缺失的音标和例句
      const needGen = data.words.filter((w: Word) => !w.phonetic || !w.example).slice(0, 3);
      needGen.forEach((w: Word) => {
        fetch(`${BASE_URL}/api/v1/words/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            wordId: w.id,
            listId: currentListId,
            word: w.word,
          }),
        }).then(async (r) => {
          if (r.ok) {
            const enriched = await r.json();
            setWords(prev => prev.map(pw =>
              pw.id === w.id
                ? { ...pw, phonetic: enriched.phonetic || pw.phonetic, example: enriched.example || pw.example, exampleCn: enriched.exampleCn || pw.exampleCn, meaning: enriched.meaning || pw.meaning }
                : pw
            ));
          }
        }).catch(() => {});
      });
    } catch {
      setAllDone(true);
    } finally {
      setLoading(false);
    }
  }, [currentListId]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const handleNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setAllDone(true);
    }
  }, [currentIndex, words.length]);

  const handleKnown = useCallback(() => {
    if (isAnimating) return;
    const word = words[currentIndex];
    if (!word) return;
    setIsAnimating(true);
    setSessionCount((c) => c + 1);
    // 使用新的学习记录 API
    fetch(`${BASE_URL}/api/v1/learning/record`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        wordId: word.id, 
        wordListId: currentListId, 
        status: 'known' 
      }),
    }).catch(() => { /* ignore */ });
    handleNext();
    setTimeout(() => setIsAnimating(false), 300);
  }, [words, currentIndex, handleNext, currentListId, isAnimating]);

  const handleUnknown = useCallback(() => {
    if (isAnimating) return;
    const word = words[currentIndex];
    if (!word) return;
    setIsAnimating(true);
    setSessionCount((c) => c + 1);
    // 使用新的学习记录 API
    fetch(`${BASE_URL}/api/v1/learning/record`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        wordId: word.id, 
        wordListId: currentListId, 
        status: 'unknown' 
      }),
    }).catch(() => { /* ignore */ });
    handleNext();
    setTimeout(() => setIsAnimating(false), 300);
  }, [words, currentIndex, handleNext, currentListId, isAnimating]);

  const handleLoadMore = () => {
    setAllDone(false);
    fetchWords();
  };

  const visibleWords = words.slice(currentIndex, currentIndex + 2).reverse();

  if (loading) {
    return (
      <Screen safeAreaEdges={['left', 'right', 'bottom']} backgroundColor="#F0F0F3">
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>加载单词中...</Text>
        </View>
      </Screen>
    );
  }

  if (allDone) {
    return (
      <Screen safeAreaEdges={['left', 'right', 'bottom']} backgroundColor="#F0F0F3">
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
          <View style={styles.doneCard}>
            <View style={styles.doneIconWrap}>
              <FontAwesome6 name="trophy" size={48} color="#6C63FF" />
            </View>
            <Text style={styles.doneTitle}>恭喜！全部学完 🎉</Text>
            <Text style={styles.doneSubtitle}>
              本轮已学习 {sessionCount} 个单词，全部完成！
            </Text>
            <Pressable onPress={handleLoadMore} style={styles.doneBtnWrap}>
              <LinearGradient
                colors={['#6C63FF', '#896BFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.doneBtn}
              >
                <Text style={styles.doneBtnText}>继续学习</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={async () => {
              try {
                const baseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
                await fetch(`${baseUrl}/api/v1/learning/reset?listId=${currentListId}`, {
                  method: 'DELETE',
                });
                handleLoadMore();
              } catch (e) {
                console.error('Reset failed:', e);
              }
            }} style={{ marginTop: 12, padding: 8 }}>
              <Text style={{ fontSize: 14, color: '#B2BEC3' }}>重新学习</Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <Screen safeAreaEdges={['left', 'right', 'bottom']} backgroundColor="#F0F0F3">
        <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{currentList?.name || '雅思词汇'}</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                {currentIndex + 1} / {words.length}
              </Text>
            </View>
          </View>

          {/* Card Stack */}
          <View style={styles.cardStack}>
            {visibleWords.map((word, index) => (
              <WordCard
                key={`${word.id}-${currentIndex + index}`}
                word={word}
                onSwipeLeft={handleUnknown}
                onSwipeRight={handleKnown}
                isTop={index === visibleWords.length - 1}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleUnknown}
              style={({ pressed }) => [
                styles.actionBtnWrap,
                pressed && styles.actionBtnPressed,
              ]}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionBtn}
              >
                <FontAwesome6 name="xmark" size={28} color="#FFF" />
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleKnown}
              style={({ pressed }) => [
                styles.actionBtnWrap,
                pressed && styles.actionBtnPressed,
              ]}
            >
              <LinearGradient
                colors={['#00B894', '#2ED8A8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionBtn}
              >
                <FontAwesome6 name="check" size={28} color="#FFF" />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Hint */}
          <Text style={styles.hintText}>
            左滑不认识 · 右滑认识 · 点击卡片翻转
          </Text>
        </View>
      </Screen>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#F0F0F3',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#636E72',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    width: '100%',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3436',
  },
  progressBadge: {
    backgroundColor: 'rgba(108,99,255,0.10)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C63FF',
  },

  // Card Stack
  cardStack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    position: 'absolute',
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(108,99,255,0.25)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  cardBack: {
    shadowColor: 'rgba(108,99,255,0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },

  // Front face
  difficultyBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108,99,255,0.08)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  wordText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#2D3436',
    textAlign: 'center',
    letterSpacing: 1,
  },
  phoneticText: {
    fontSize: 18,
    color: '#636E72',
    marginTop: 8,
  },
  speakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108,99,255,0.10)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 16,
    gap: 6,
  },
  speakerText: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '600',
  },
  posText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
    marginTop: 12,
    backgroundColor: 'rgba(108,99,255,0.08)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  tapHint: {
    fontSize: 13,
    color: '#B2BEC3',
    marginTop: 20,
  },

  // Swipe overlays
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  overlayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  overlayText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },

  // Back face
  backContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#F0F0F3',
    borderRadius: 24,
  },
  backWord: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3436',
  },
  backPhonetic: {
    fontSize: 16,
    color: '#636E72',
    marginTop: 4,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#6C63FF',
    borderRadius: 1,
    marginVertical: 16,
  },
  backPos: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  backMeaning: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 16,
  },
  exampleBox: {
    backgroundColor: '#E8E8EB',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  exampleText: {
    fontSize: 14,
    color: '#2D3436',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  exampleCnText: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 8,
    lineHeight: 20,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
    gap: 24,
  },
  actionBtnWrap: {},
  actionBtnPressed: { opacity: 0.85, transform: [{ scale: 0.95 }] },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  hintText: {
    fontSize: 13,
    color: '#B2BEC3',
    textAlign: 'center',
    paddingBottom: 12,
  },

  // Done screen
  doneCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 32,
    shadowColor: 'rgba(108,99,255,0.25)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
    marginHorizontal: 32,
  },
  doneIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(108,99,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 8,
  },
  doneSubtitle: {
    fontSize: 15,
    color: '#636E72',
    marginBottom: 28,
  },
  doneBtnWrap: { borderRadius: 9999, overflow: 'hidden' },
  doneBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
