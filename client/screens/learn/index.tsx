import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Animated as RNAnimated,
  Easing as RNEasing,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  interpolate,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Path, Circle } from 'react-native-svg';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWordList, type WordListInfo } from '@/contexts/WordListContext';
import { usePurchase, PurchaseCancelledError } from '@/contexts/PurchaseContext';
import { getDeviceId } from '@/utils/deviceId';
import { BACKEND_BASE_URL } from '@/utils/backend';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.50;
const SWIPE_THRESHOLD = 120;

let zapSound: Audio.Sound | null = null;
async function preloadZapSound() {
  if (zapSound) return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/lightning.wav'),
    );
    zapSound = sound;
  } catch {
    zapSound = null;
  }
}
let flipSound: Audio.Sound | null = null;
async function preloadFlipSound() {
  if (flipSound) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/flip.wav'),
    );
    flipSound = sound;
  } catch {
    flipSound = null;
  }
}
function playFlip() {
  flipSound?.replayAsync().catch(() => undefined);
}
function playZap() {
  zapSound?.replayAsync().catch(() => undefined);
}
let thunderSound: Audio.Sound | null = null;
async function preloadThunderSound() {
  if (thunderSound) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/thunder.wav'),
    );
    thunderSound = sound;
  } catch {
    thunderSound = null;
  }
}
function playThunder() {
  thunderSound?.replayAsync().catch(() => undefined);
}
let rainSound: Audio.Sound | null = null;
async function preloadRainSound() {
  if (rainSound) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/rain.wav'),
    );
    rainSound = sound;
  } catch {
    rainSound = null;
  }
}
function playRain() {
  rainSound?.replayAsync().catch(() => undefined);
}
let achievementSound: Audio.Sound | null = null;
async function preloadAchievementSound() {
  if (achievementSound) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/achievement.wav'),
    );
    achievementSound = sound;
  } catch {
    achievementSound = null;
  }
}
function playAchievement() {
  achievementSound?.replayAsync().catch(() => undefined);
}
let chargeSound: Audio.Sound | null = null;
async function preloadChargeSound() {
  if (chargeSound) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/charge.wav'),
    );
    chargeSound = sound;
  } catch {
    chargeSound = null;
  }
}
function playCharge() {
  chargeSound?.replayAsync().catch(() => undefined);
}
function stopCharge() {
  chargeSound?.stopAsync().catch(() => undefined);
}

const AnimCircle = RNAnimated.createAnimatedComponent(Circle);
const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R;

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

const BASE_URL = BACKEND_BASE_URL;

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

async function recordWord(wordId: number, wordListId: string, status: 'known' | 'unknown') {
  try {
    await fetch(`${BASE_URL}/api/v1/learning/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': await getDeviceId(),
      },
      body: JSON.stringify({ wordId, wordListId, status }),
    });
  } catch {
    // ignore
  }
}

function getWordFontSize(word: string): number {
  const len = word.length;
  if (len <= 5) return 48;
  if (len <= 8) return 42;
  if (len <= 12) return 36;
  if (len <= 16) return 30;
  return 26;
}

const BOLT_PATH = 'M 74 0 L 50 132 L 72 210 L 42 348 L 64 430 L 38 560';
const BOLT_FORK_PATH = 'M 72 210 L 112 296 L 104 318';

function LightningBolt({ progress, epic }: { progress: SharedValue<number>; epic: boolean }) {
  const boltStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: Math.max(progress.value, 0.001) },
      { translateY: (1 - progress.value) * (-CARD_HEIGHT / 2) },
    ],
    opacity: progress.value,
  }));

  if (epic) {
    return (
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }, boltStyle]}
      >
        <Svg width={240} height={CARD_HEIGHT} viewBox="0 0 150 560" preserveAspectRatio="xMidYMid slice">
          <Path d={BOLT_PATH} stroke="rgba(108,99,255,0.45)" strokeWidth={52} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Path d={BOLT_PATH} stroke="#FFD60A" strokeWidth={26} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Path d={BOLT_PATH} stroke="#FFB800" strokeWidth={16} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Path d={BOLT_PATH} stroke="#FFFFFF" strokeWidth={8} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Path d={BOLT_FORK_PATH} stroke="#FFD60A" strokeWidth={15} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Path d={BOLT_FORK_PATH} stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }, boltStyle]}
    >
      <Svg width={150} height={CARD_HEIGHT} viewBox="0 0 150 560" preserveAspectRatio="xMidYMid slice">
        <Path d={BOLT_PATH} stroke="rgba(108,99,255,0.35)" strokeWidth={30} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Path d={BOLT_PATH} stroke="#FFD60A" strokeWidth={13} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Path d={BOLT_PATH} stroke="#FFB800" strokeWidth={8} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Path d={BOLT_PATH} stroke="#FFFFFF" strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

function RainDrop({ t, offset, left, len, width }: { t: SharedValue<number>; offset: number; left: number; len: number; width: number }) {
  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ((t.value * 620 + offset) % 620) - 60 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.rainDrop, dropStyle, { left, height: len, width }]}
    />
  );
}

const RAIN_DROPS = Array.from({ length: 9 }, (_, i) => i);

function WordCard({
  word,
  onSwipeLeft,
  onSwipeRight,
  isTop,
  splitTrigger,
  leftTrigger,
  triggerLeft,
  underReveal,
  epic,
  onSplitStart,
}: {
  word: Word;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  splitTrigger: number;
  leftTrigger: number;
  triggerLeft: () => void;
  underReveal: boolean;
  epic: boolean;
  onSplitStart: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  // rain-sink shared values（左滑"雨沉"退场）
  const cloudOp = useSharedValue(0);
  const cloudScale = useSharedValue(0.5);
  const cloud2Op = useSharedValue(0);
  const rainT = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);
  useEffect(() => {
    setIsFlipped(false);
    spinAnim.value = 0;
    containerOp.value = 1;
    cloudOp.value = 0;
    cloudScale.value = 0.5;
    cloud2Op.value = 0;
    rainT.value = 0;
  }, [word.id]);

  // split-card state
  const [splitting, setSplitting] = useState(false);
  const splittingRef = useRef(false);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (commitTimerRef.current) clearTimeout(commitTimerRef.current); }, []);
  const lastTriggerRef = useRef(splitTrigger);
  // rain-sink state
  const [sinking, setSinking] = useState(false);
  const sinkingRef = useRef(false);
  const sinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (sinkTimerRef.current) clearTimeout(sinkTimerRef.current); }, []);
  const lastLeftRef = useRef(leftTrigger);
  const halfLX = useSharedValue(0);
  const halfLY = useSharedValue(0);
  const halfLRot = useSharedValue(0);
  const halfRX = useSharedValue(0);
  const halfRY = useSharedValue(0);
  const halfRRot = useSharedValue(0);
  const boltP = useSharedValue(0);
  const flashOp = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const containerOp = useSharedValue(1);
  const triggerImpact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    if (epic) playThunder(); else playZap();
  }, [epic]);

  const propsRef = useRef({ onSwipeRight, onSwipeLeft });
  propsRef.current = { onSwipeRight, onSwipeLeft };

  const startSink = useCallback(() => {
    if (sinkingRef.current || splittingRef.current || !isTop) return;
    sinkingRef.current = true;
    setSinking(true);
    playRain();
    cloudOp.value = withTiming(1, { duration: 140 });
    cloudScale.value = withSpring(1, { damping: 12 });
    cloud2Op.value = withDelay(120, withTiming(0.7, { duration: 160 }));
    rainT.value = withTiming(1.7, { duration: 640, easing: Easing.linear });
    translateX.value = withDelay(150, withTiming(-SCREEN_WIDTH * 0.52, { duration: 520, easing: Easing.in(Easing.quad) }));
    translateY.value = withDelay(150, withTiming(150, { duration: 520, easing: Easing.in(Easing.quad) }));
    containerOp.value = withDelay(300, withTiming(0, { duration: 400 }));
    sinkTimerRef.current = setTimeout(() => {
      sinkingRef.current = false;
      setSinking(false);
      propsRef.current.onSwipeLeft();
    }, 700);
  }, [isTop, translateX, translateY, containerOp, cloudOp, cloudScale, cloud2Op, rainT]);

  useEffect(() => {
    if (leftTrigger !== lastLeftRef.current) {
      lastLeftRef.current = leftTrigger;
      if (leftTrigger > 0 && isTop) startSink();
    }
  }, [leftTrigger, isTop, startSink]);

  const cloudMainStyle = useAnimatedStyle(() => ({
    opacity: cloudOp.value,
    transform: [{ scale: cloudScale.value }],
  }));
  const cloudSecondStyle = useAnimatedStyle(() => ({
    opacity: cloud2Op.value,
    transform: [{ scale: cloudScale.value * 0.62 }],
  }));

  const startSplit = useCallback(() => {
    if (splittingRef.current || !isTop) return;
    splittingRef.current = true;
    // 翻转态在 iOS 真机上劈卡渲染不可见，统一翻回正面劈
    if (isFlipped) {
      setIsFlipped(false);
      spinAnim.value = 0;
    }
    setSplitting(true);
    onSplitStart();
    translateX.value = withTiming(0, { duration: 100 });
    translateY.value = withTiming(0, { duration: 100 });
    boltP.value = withDelay(110, withSequence(
      withTiming(1, { duration: 90, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) runOnJS(triggerImpact)();
      }),
      withTiming(0, { duration: 320 }),
    ));
    if (epic) {
      flashOp.value = withDelay(200, withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(0.35, { duration: 90 }),
        withTiming(0.75, { duration: 60 }),
        withTiming(0, { duration: 340 }),
      ));
      shakeX.value = withDelay(200, withSequence(
        withTiming(-16, { duration: 55 }),
        withTiming(13, { duration: 55 }),
        withTiming(-9, { duration: 50 }),
        withTiming(7, { duration: 45 }),
        withTiming(-4, { duration: 40 }),
        withTiming(0, { duration: 35 }),
      ));
    } else {
      flashOp.value = withDelay(200, withSequence(
        withTiming(0.9, { duration: 45 }),
        withTiming(0, { duration: 220 }),
      ));
      shakeX.value = withDelay(200, withSequence(
        withTiming(-7, { duration: 40 }),
        withTiming(6, { duration: 45 }),
        withTiming(-3, { duration: 40 }),
        withTiming(0, { duration: 30 }),
      ));
    }
    const flyDur = epic ? 640 : 430;
    const flyDist = epic ? 210 : 130;
    const flyRot = epic ? 21 : 14;
    const flyY = epic ? 96 : 56;
    const fly = { duration: flyDur, easing: Easing.out(Easing.quad) };
    // 容器整体渐隐替代两半各自渐隐：露出的永远是 under 卡/背景，不会露出空白卡壳
    containerOp.value = withDelay(205, withTiming(0, { duration: flyDur, easing: Easing.in(Easing.quad) }));
    halfLX.value = withDelay(205, withTiming(-flyDist, fly));
    halfLY.value = withDelay(205, withTiming(flyY, fly));
    halfLRot.value = withDelay(205, withTiming(-flyRot, fly));
    halfRX.value = withDelay(205, withTiming(flyDist, fly));
    halfRY.value = withDelay(205, withTiming(flyY, fly));
    halfRRot.value = withDelay(205, withTiming(flyRot, fly));
    commitTimerRef.current = setTimeout(() => {
      splittingRef.current = false;
      propsRef.current.onSwipeRight();
    }, epic ? 920 : 660);
  }, [isTop, isFlipped, epic, onSplitStart, triggerImpact, translateX, translateY, boltP, flashOp, shakeX, containerOp, halfLX, halfLY, halfLRot, halfRX, halfRY, halfRRot]);

  useEffect(() => {
    if (splitTrigger !== lastTriggerRef.current) {
      lastTriggerRef.current = splitTrigger;
      if (splitTrigger > 0 && isTop) startSplit();
    }
  }, [splitTrigger, isTop, startSplit]);

  const panGesture = Gesture.Pan()
    .enabled(isTop && !splitting && !sinking)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(startSplit)();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(triggerLeft)();
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
    opacity: underReveal ? 1 : interpolate(Math.abs(translateX.value), [0, SWIPE_THRESHOLD], [0, 0.6], 'clamp'),
  }));

  const splitContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + shakeX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value * 0.08}deg` },
    ],
  }));

  const leftHalfStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: halfLX.value },
      { translateY: halfLY.value },
      { rotate: `${halfLRot.value}deg` },
    ],
  }));

  const rightHalfStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: halfRX.value },
      { translateY: halfRY.value },
      { rotate: `${halfRRot.value}deg` },
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOp.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOp.value,
  }));

  const spinAnim = useSharedValue(0);

  const cardSpinStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${spinAnim.value}deg` }],
  }));

  const doFlip = useCallback(() => {
    setIsFlipped((v) => !v);
    spinAnim.value = -90;
    spinAnim.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.ease) });
  }, []);

  const handleFlip = useCallback(() => {
    if (splitting) return;
    playFlip();
    spinAnim.value = withTiming(90, { duration: 190, easing: Easing.in(Easing.ease) }, (finished) => {
      if (finished) runOnJS(doFlip)();
    });
  }, [splitting, doFlip]);

  const frontFace = (
    <Pressable
      onPress={handleFlip}
      disabled={!isTop}
      style={{ flex: 1 }}
    >
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
        <Text style={styles.phoneticText}>{word.phonetic || (isTop ? '加载音标...' : '')}</Text>
        <Text style={styles.posText}>{word.pos}</Text>
        <Pressable
          onPress={(e) => {
          e.stopPropagation();
          speakWord(word.word);
        }}
          disabled={!isTop}
          style={[styles.speakerBtn, !isTop && styles.speakerHidden]}
        >
          <FontAwesome6 name="volume-high" size={15} color="#6C63FF" />
          <Text style={styles.speakerText}>听发音</Text>
        </Pressable>
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
    </Pressable>
  );

  const backFace = (
    <Pressable
      onPress={handleFlip}
      disabled={!isTop}
      style={[styles.backContent, { flex: 1 }]}
    >
      <Text style={styles.backWord}>{word.word}</Text>
      <Text style={styles.backPhonetic}>{word.phonetic}</Text>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          speakWord(word.word);
        }}
        style={styles.speakerBtn}
      >
        <FontAwesome6 name="volume-high" size={15} color="#6C63FF" />
        <Text style={styles.speakerText}>听发音</Text>
      </Pressable>
      <View style={styles.divider} />
      <Text style={styles.backPos}>{word.pos}</Text>
      <Text style={styles.backMeaning}>{word.meaning}</Text>
      <View style={styles.exampleBox}>
        <Text style={styles.exampleText}>{word.example || (isTop ? '正在生成例句...' : '')}</Text>
        <Text style={styles.exampleCnText}>{word.exampleCn}</Text>
      </View>
    </Pressable>
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          isTop ? cardStyle : backCardStyle,
          { zIndex: isTop ? 10 : 1 },
          containerStyle,
        ]}
      >
        {splitting ? (
          <Animated.View style={[styles.halfContainer, splitContainerStyle]}>
            <Animated.View style={[styles.halfLeft, leftHalfStyle]}>
              <View style={styles.halfInner} pointerEvents="none">
                <Animated.View style={styles.cardFace}>{frontFace}</Animated.View>
              </View>
            </Animated.View>
            <Animated.View style={[styles.halfRight, rightHalfStyle]}>
              <View style={[styles.halfInner, styles.halfInnerRight]} pointerEvents="none">
                <Animated.View style={styles.cardFace}>{frontFace}</Animated.View>
              </View>
            </Animated.View>
            <LightningBolt progress={boltP} epic={epic} />
            <Animated.View pointerEvents="none" style={[styles.flashLayer, flashStyle]} />
          </Animated.View>
        ) : (
          <>
            <Animated.View
              pointerEvents="none"
              style={[styles.cardShadowLayer, cardSpinStyle, { zIndex: 1 }]}
            />
            <Animated.View style={[styles.cardFace, cardSpinStyle, { zIndex: 2 }]}>
              <Pressable onPress={handleFlip} disabled={!isTop} style={StyleSheet.absoluteFill}>
                {isFlipped ? backFace : frontFace}
              </Pressable>
            </Animated.View>
          </>
        )}
        {sinking && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 30 }]}>
            {RAIN_DROPS.map((i) => (
              <RainDrop
                key={i}
                t={rainT}
                offset={i * 68.9}
                left={(i / RAIN_DROPS.length) * CARD_WIDTH + (i % 3) * 8}
                len={14 + (i % 4) * 5}
                width={2 + (i % 2)}
              />
            ))}
            <Animated.View style={[styles.rainCloud, cloudMainStyle]}>
              <FontAwesome6 name="cloud-showers-heavy" size={38} color="#5C6B8A" />
            </Animated.View>
            <Animated.View style={[styles.rainCloud, styles.rainCloudSmall, cloudSecondStyle]}>
              <FontAwesome6 name="cloud-showers-heavy" size={24} color="#7E90B5" />
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

function ListDrawer({
  visible,
  onClose,
  lists,
  currentListId,
  onSelect,
  purchasingId,
  onPurchase,
  onRestore,
  restoring,
}: {
  visible: boolean;
  onClose: () => void;
  lists: WordListInfo[];
  currentListId: string;
  onSelect: (listId: string) => void;
  purchasingId: string | null;
  onPurchase: (listId: string) => void;
  onRestore: () => void;
  restoring: boolean;
}) {
  const { isMaterialUnlocked, getMaterial } = usePurchase();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.drawerMask}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Pressable style={[styles.drawerPanel, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.drawerHandle} />
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>选择学习材料</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <FontAwesome6 name="xmark" size={18} color="#B2BEC3" />
            </Pressable>
          </View>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {lists.map((list) => {
              const unlocked = isMaterialUnlocked(list.id);
              const material = getMaterial(list.id);
              const selected = list.id === currentListId;
              const busy = purchasingId === list.id;
              return (
                <Pressable
                  key={list.id}
                  onPress={() => (unlocked ? onSelect(list.id) : onPurchase(list.id))}
                  disabled={busy || restoring}
                  style={({ pressed }) => [
                    styles.drawerItem,
                    selected && styles.drawerItemSelected,
                    pressed && { opacity: 0.65 },
                  ]}
                >
                  <View style={[styles.drawerItemIcon, { backgroundColor: `${list.color}1A` }]}>
                    <FontAwesome6 name={list.icon as never} size={16} color={list.color} />
                  </View>
                  <View style={styles.drawerItemMain}>
                    <Text style={styles.drawerItemName} numberOfLines={1}>{list.name}</Text>
                    <Text style={styles.drawerItemProgress}>已学 {list.knownCount} / {list.totalWords}</Text>
                  </View>
                  {busy ? (
                    <ActivityIndicator size="small" color="#6C63FF" />
                  ) : !unlocked ? (
                    <View style={styles.lockBadge}>
                      <FontAwesome6 name="lock" size={11} color="#E89B00" />
                      <Text style={styles.lockBadgeText}>¥{material?.price ?? 6}</Text>
                    </View>
                  ) : selected ? (
                    <FontAwesome6 name="circle-check" size={22} color="#6C63FF" />
                  ) : (
                    <View style={styles.radioCircle} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable onPress={onRestore} disabled={restoring} style={styles.restoreBtn}>
            {restoring ? (
              <ActivityIndicator size="small" color="#B2BEC3" />
            ) : (
              <Text style={styles.restoreText}>恢复购买</Text>
            )}
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}

export default function LearnScreen() {
  const { currentListId, lists, setListId, refreshLists } = useWordList();
  const { purchaseMaterial, restorePurchases } = usePurchase();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allDone, setAllDone] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const insets = useSafeAreaInsets();
  const generatingRef = useRef<Set<number>>(new Set());

  // 完成页奖杯圆环充能（RN Animated 驱动 SVG，release 稳定）
  const ICON_WRAP = 104;
  const ringAnim = useRef(new RNAnimated.Value(0)).current;
  const trophyScale = useSharedValue(1);
  const glowOp = useSharedValue(0);
  const firedRef = useRef(false);
  const ringOffset = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_C, 0],
  });
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOp.value,
    transform: [{ scale: interpolate(glowOp.value, [0, 0.9], [0.75, 1.4], 'clamp') }],
  }));
  const trophyScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));
  const onChargeDone = useCallback(() => {
    playAchievement();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    trophyScale.value = withSequence(
      withTiming(1.22, { duration: 140, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 9 }),
    );
    glowOp.value = withSequence(
      withTiming(0.9, { duration: 120 }),
      withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) }),
    );
  }, [trophyScale, glowOp]);
  useEffect(() => {
    if (!allDone) {
      firedRef.current = false;
      stopCharge();
      ringAnim.setValue(0);
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;
    ringAnim.setValue(0);
    playCharge();
    RNAnimated.timing(ringAnim, {
      toValue: 1,
      duration: 2600,
      easing: RNEasing.inOut(RNEasing.quad),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onChargeDone();
    });
  }, [allDone, ringAnim, onChargeDone]);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    generatingRef.current.clear();
    try {
      const res = await fetch(`${BASE_URL}/api/v1/words/batch?listId=${currentListId}&offset=0&limit=10`, {
        headers: { 'x-device-id': await getDeviceId() },
      });
      const data = await res.json();
      setWords(data.words);
      setCurrentIndex(0);
      setAllDone(data.words.length === 0);
    } catch {
      setAllDone(true);
    } finally {
      setLoading(false);
    }
  }, [currentListId]);

  useEffect(() => {
    preloadZapSound();
    preloadThunderSound();
    preloadRainSound();
    preloadFlipSound();
    preloadAchievementSound();
    preloadChargeSound();
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // Pre-generate phonetics/examples for upcoming cards (current + 5 ahead)
  useEffect(() => {
    if (words.length === 0) return;

    const PRELOAD_AHEAD = 6;
    const MAX_CONCURRENT = 3;
    const upcoming = words.slice(currentIndex, currentIndex + PRELOAD_AHEAD);
    const needGen = upcoming.filter(
      w => (!w.phonetic || !w.example) && !generatingRef.current.has(w.id)
    );
    if (needGen.length === 0) return;

    needGen.forEach(w => generatingRef.current.add(w.id));

    const queue = [...needGen];
    const workers = Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, async () => {
      while (queue.length > 0) {
        const w = queue.shift()!;
        try {
          const res = await fetch(`${BASE_URL}/api/v1/words/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wordId: w.id, listId: currentListId, word: w.word }),
          });
          if (res.ok) {
            const enriched = await res.json();
            if (enriched.phonetic || enriched.example) {
              setWords(prev =>
                prev.map(pw =>
                  pw.id === w.id
                    ? {
                        ...pw,
                        phonetic: enriched.phonetic || pw.phonetic,
                        example: enriched.example || pw.example,
                        exampleCn: enriched.exampleCn || pw.exampleCn,
                        meaning: enriched.meaning || pw.meaning,
                      }
                    : pw
                )
              );
            }
          }
        } catch {
          // Will retry on next index change
        } finally {
          generatingRef.current.delete(w.id);
        }
      }
    });
    Promise.all(workers);
  }, [currentIndex, words, currentListId]);

  const handleNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setAllDone(true);
    }
  }, [currentIndex, words.length]);

  const [splitTrigger, setSplitTrigger] = useState(0);
  const [leftTrigger, setLeftTrigger] = useState(0);

  const triggerSplit = useCallback(() => {
    if (isAnimating) return;
    const word = words[currentIndex];
    if (!word) return;
    setIsAnimating(true);
    setSplitTrigger((c) => c + 1);
  }, [words, currentIndex, isAnimating, splitTrigger]);

  const commitKnown = useCallback(() => {
    const word = words[currentIndex];
    if (word) {
      setSessionCount((c) => c + 1);
      recordWord(word.id, currentListId, 'known');
    }
    handleNext();
    setIsAnimating(false);
  }, [words, currentIndex, handleNext, currentListId]);

  const handleKnown = useCallback(() => {
    triggerSplit();
  }, [triggerSplit]);

  const handleUnknown = useCallback(() => {
    if (isAnimating) return;
    const word = words[currentIndex];
    if (!word) return;
    setIsAnimating(true);
    setLeftTrigger((c) => c + 1);
  }, [words, currentIndex, isAnimating]);

  const commitUnknown = useCallback(() => {
    const word = words[currentIndex];
    if (word) {
      setSessionCount((c) => c + 1);
      recordWord(word.id, currentListId, 'unknown');
    }
    handleNext();
    setIsAnimating(false);
  }, [words, currentIndex, handleNext, currentListId]);

  // 按钮自身跟手拖动：乌云向左/闪电向右各一套位移（共享会导致另一颗按钮跟着撞上来）
  const unknownDragX = useSharedValue(0);
  const unknownDragY = useSharedValue(0);
  const knownDragX = useSharedValue(0);
  const knownDragY = useSharedValue(0);
  const unknownMoveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: unknownDragX.value }, { translateY: unknownDragY.value }],
  }));
  const knownMoveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knownDragX.value }, { translateY: knownDragY.value }],
  }));
  const unknownPan = Gesture.Pan()
    .enabled(!isAnimating && !loading && !allDone)
    .minDistance(12)
    .onUpdate((e) => {
      unknownDragX.value = Math.min(e.translationX, 0);
      unknownDragY.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      unknownDragY.value = withSpring(0);
      if (e.translationX < -SWIPE_THRESHOLD) {
        unknownDragX.value = withTiming(0, { duration: 90 });
        runOnJS(handleUnknown)();
      } else {
        unknownDragX.value = withSpring(0);
      }
    });
  const knownPan = Gesture.Pan()
    .enabled(!isAnimating && !loading && !allDone)
    .minDistance(12)
    .onUpdate((e) => {
      knownDragX.value = Math.max(e.translationX, 0);
      knownDragY.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      knownDragY.value = withSpring(0);
      if (e.translationX > SWIPE_THRESHOLD) {
        knownDragX.value = withTiming(0, { duration: 90 });
        runOnJS(handleKnown)();
      } else {
        knownDragX.value = withSpring(0);
      }
    });

  const handleLoadMore = () => {
    setAllDone(false);
    fetchWords();
  };

  const openDrawer = useCallback(() => {
    refreshLists();
    setDrawerVisible(true);
  }, [refreshLists]);

  const handleDrawerSelect = useCallback((listId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setListId(listId);
    setDrawerVisible(false);
  }, [setListId]);

  const handleDrawerPurchase = useCallback(async (listId: string) => {
    setPurchasingId(listId);
    try {
      await purchaseMaterial(listId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setListId(listId);
      setDrawerVisible(false);
    } catch (error) {
      if (!(error instanceof PurchaseCancelledError)) {
        Alert.alert('购买失败', '请稍后重试');
      }
    } finally {
      setPurchasingId(null);
    }
  }, [purchaseMaterial, setListId]);

  const handleDrawerRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const count = await restorePurchases();
      if (count > 0) {
        Alert.alert('恢复成功', `已恢复 ${count} 项已购材料`);
      } else {
        Alert.alert('未发现购买记录', '当前 Apple ID 没有可恢复的购买');
      }
    } catch {
      Alert.alert('恢复失败', '请检查网络后重试');
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases]);

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
            <Animated.View style={trophyScaleStyle}>
              <View style={styles.doneIconWrap}>
                <Svg width={ICON_WRAP} height={ICON_WRAP} style={StyleSheet.absoluteFill}>
                  <Circle cx={ICON_WRAP / 2} cy={ICON_WRAP / 2} r={RING_R} stroke="rgba(255,184,0,0.18)" strokeWidth={7} fill="none" />
                  <AnimCircle
                    cx={ICON_WRAP / 2}
                    cy={ICON_WRAP / 2}
                    r={RING_R}
                    stroke="#FFB800"
                    strokeWidth={7}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={RING_C}
                    strokeDashoffset={ringOffset}
                    transform={`rotate(-90 ${ICON_WRAP / 2} ${ICON_WRAP / 2})`}
                  />
                </Svg>
                <FontAwesome6 name="trophy" size={44} color="#FFB800" />
                <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glowRing, glowStyle]} />
              </View>
            </Animated.View>
            <Text style={styles.doneTitle}>All Done!</Text>
            <Text style={styles.doneSubtitle}>
              Learned {sessionCount} words this round
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
                const baseUrl = BACKEND_BASE_URL;
                await fetch(`${baseUrl}/api/v1/learning/reset?listId=${currentListId}`, {
                  method: 'DELETE',
                  headers: { 'x-device-id': await getDeviceId() },
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
            <Pressable
              onPress={openDrawer}
              hitSlop={8}
              style={({ pressed }) => [styles.headerTitleWrap, pressed && { opacity: 0.6 }]}
            >
              <FontAwesome6 name="book-open" size={22} color="#6C63FF" />
              <FontAwesome6 name="chevron-down" size={13} color="#B2BEC3" />
            </Pressable>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                {currentIndex + 1} / {words.length}
              </Text>
            </View>
          </View>

          {/* Card Stack */}
          <View style={styles.cardStack}>
            {visibleWords.map((word, index) => {
              const globalIdx = currentIndex + (visibleWords.length - 1 - index);
              return (
                <WordCard
                  key={`${word.id}-${currentIndex + index}`}
                  word={word}
                  onSwipeLeft={commitUnknown}
                  onSwipeRight={commitKnown}
                  isTop={index === visibleWords.length - 1}
                  splitTrigger={splitTrigger}
                  leftTrigger={leftTrigger}
                  triggerLeft={handleUnknown}
                  onSplitStart={() => setIsAnimating(true)}
                  underReveal={index === 0}
                  epic={(globalIdx + 1) % 10 === 0}
                />
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <GestureDetector gesture={unknownPan}>
              <Animated.View style={unknownMoveStyle}>
                <Pressable
                  onPress={handleUnknown}
                  style={({ pressed }) => [
                    styles.actionBtnWrap,
                    pressed && styles.actionBtnPressed,
                  ]}
                >
                  <View style={styles.actionShadow}>
                    <LinearGradient
                      colors={['#5C6B8A', '#7E90B5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionBtn}
                    >
                      <FontAwesome6 name="cloud-showers-heavy" size={26} color="#FFF" />
                    </LinearGradient>
                  </View>
                </Pressable>
              </Animated.View>
            </GestureDetector>

            <GestureDetector gesture={knownPan}>
              <Animated.View style={knownMoveStyle}>
                <Pressable
                  onPress={handleKnown}
                  style={({ pressed }) => [
                    styles.actionBtnWrap,
                    pressed && styles.actionBtnPressed,
                  ]}
                >
                  <View style={styles.actionShadow}>
                    <LinearGradient
                      colors={['#F5A300', '#FFC94D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionBtn}
                    >
                      <FontAwesome6 name="bolt" size={30} color="#FFF" />
                    </LinearGradient>
                  </View>
                </Pressable>
              </Animated.View>
            </GestureDetector>
          </View>

          {/* Hint */}
          <Text style={styles.hintText}>
            左滑不认识 · 右滑认识 · 点击卡片翻转
          </Text>
        </View>

        <ListDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          lists={lists}
          currentListId={currentListId}
          onSelect={handleDrawerSelect}
          purchasingId={purchasingId}
          onPurchase={handleDrawerPurchase}
          onRestore={handleDrawerRestore}
          restoring={restoring}
        />
      </Screen>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  halfContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  halfLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    overflow: 'hidden',
  },
  halfRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    overflow: 'hidden',
  },
  halfInner: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CARD_WIDTH,
    height: '100%',
  },
  halfInnerRight: {
    left: -CARD_WIDTH / 2,
  },
  flashLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
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
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBadge: {
    backgroundColor: 'rgba(108,99,255,0.10)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexShrink: 0,
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
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  // 阴影承载层：必须在 card 容器层（cardFace/half* 都有 overflow hidden，放里面会被裁到只剩四角漏阴影）
  cardShadowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    backfaceVisibility: 'hidden',
    shadowColor: '#2B2350',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 14,
  },
  cardBack: {
    shadowColor: 'rgba(108,99,255,0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },

  // Rain-sink overlay（左滑"雨沉"）
  rainCloud: {
    position: 'absolute',
    top: -8,
    left: CARD_WIDTH / 2 - 36,
    width: 72,
    alignItems: 'center',
  },
  rainCloudSmall: {
    top: 34,
    left: CARD_WIDTH / 2 + 26,
  },
  rainDrop: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
    backgroundColor: 'rgba(92,107,138,0.5)',
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
  speakerHidden: {
    opacity: 0,
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
  // 按钮阴影挂在静态外壳 View 上（LinearGradient 原生实现不透传；只留 legacy shadow）
  actionShadow: {
    borderRadius: 32,
    shadowColor: '#2B2350',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: '#B2BEC3',
    textAlign: 'center',
    paddingBottom: 12,
  },

  // Material drawer
  drawerMask: {
    flex: 1,
    backgroundColor: 'rgba(43,35,80,0.45)',
    justifyContent: 'flex-end',
  },
  drawerPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '72%',
  },
  drawerHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E4E4EC',
    marginBottom: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2350',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  drawerItemSelected: {
    borderColor: 'rgba(108,99,255,0.35)',
    backgroundColor: 'rgba(108,99,255,0.06)',
  },
  drawerItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemMain: {
    flex: 1,
    gap: 2,
  },
  drawerItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2B2350',
  },
  drawerItemProgress: {
    fontSize: 12,
    color: '#9A9AB0',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,184,0,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lockBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E89B00',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D8D8E4',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 2,
  },
  restoreText: {
    fontSize: 13,
    color: '#9A9AB0',
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
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(108,99,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  glowRing: {
    borderRadius: 52,
    borderWidth: 3,
    borderColor: 'rgba(255,184,0,0.55)',
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
