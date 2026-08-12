import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { useWordList } from '@/contexts/WordListContext';
import { usePurchase, MATERIALS, PurchaseCancelledError } from '@/contexts/PurchaseContext';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

interface ProgressData {
  known: number;
  unknown: number;
  total: number;
}

export default function StatsScreen() {
  const { currentListId, lists, setListId, refreshLists } = useWordList();
  const { isMaterialUnlocked, purchaseMaterial, restorePurchases, getMaterial, resetPurchase } = usePurchase();
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});
  const [loading, setLoading] = useState(true);
  const [purchaseModal, setPurchaseModal] = useState<{ visible: boolean; materialId: string | null }>({ visible: false, materialId: null });
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/v1/learning/progress`);
      const data = await res.json();
      setProgress(data.progress || {});
    } catch (e) {
      console.error('Failed to fetch progress:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchProgress();
    refreshLists();
  }, [fetchProgress, refreshLists]));

  const handleSelectList = (listId: string) => {
    const material = getMaterial(listId);
    if (!isMaterialUnlocked(listId)) {
      setPurchaseModal({ visible: true, materialId: listId });
      return;
    }
    if (material && material.price > 0) {
      setPurchaseModal({ visible: true, materialId: listId });
      return;
    }
    setListId(listId);
  };

  const handlePurchase = async () => {
    if (!purchaseModal.materialId) return;
    
    setPurchasing(true);
    try {
      await purchaseMaterial(purchaseModal.materialId);
      setPurchaseModal({ visible: false, materialId: null });
      Alert.alert('购买成功', '材料已解锁，开始学习吧！');
      setListId(purchaseModal.materialId);
    } catch (error) {
      if (!(error instanceof PurchaseCancelledError)) {
        Alert.alert('购买失败', '请稍后重试');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const count = await restorePurchases();
      if (count > 0) {
        Alert.alert('恢复成功', `已恢复 ${count} 项已购词表`);
        setPurchaseModal({ visible: false, materialId: null });
      } else {
        Alert.alert('未发现购买记录', '当前 Apple ID 没有可恢复的购买');
      }
    } catch {
      Alert.alert('恢复失败', '请检查网络后重试');
    } finally {
      setRestoring(false);
    }
  };

  const currentProgress = progress[currentListId] || { known: 0, unknown: 0, total: 0 };
  const currentList = lists.find(l => l.id === currentListId);
  const totalWords = currentList?.totalWords || 0;
  const learned = currentProgress.total || 0;
  const known = currentProgress.known || 0;
  const unknown = currentProgress.unknown || 0;
  const accuracy = learned > 0 ? Math.round((known / learned) * 100) : 0;
  const progressPercent = totalWords > 0 ? Math.round((learned / totalWords) * 100) : 0;
  const isCompleted = totalWords > 0 && learned >= totalWords;

  const handleResetProgress = (listId: string) => {
    Alert.alert(
      '重新学习',
      '确定要清空该词表的学习记录吗？所有进度将归零。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/v1/learning/reset?listId=${listId}`, {
                method: 'DELETE',
              });
              if (res.ok) {
                Alert.alert('已重置', '学习记录已清空，可以重新开始');
                fetchProgress();
              } else {
                Alert.alert('失败', '重置失败，请稍后重试');
              }
            } catch {
              Alert.alert('失败', '网络错误，请稍后重试');
            }
          },
        },
      ]
    );
  };

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
              {MATERIALS.map((material) => {
                const list = lists.find(l => l.id === material.id);
                if (!list) return null;
                const unlocked = isMaterialUnlocked(material.id);
                return (
                  <ListCard
                    key={material.id}
                    list={list}
                    material={material}
                    progress={progress[material.id]}
                    isSelected={material.id === currentListId}
                    isUnlocked={unlocked}
                    onSelect={() => handleSelectList(material.id)}
                    onReset={() => handleResetProgress(material.id)}
                    isCompleted={progress[material.id]?.total === list.totalWords && list.totalWords > 0}
                  />
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="px-6">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#4ECDC4" />
            </View>
          ) : !isMaterialUnlocked(currentListId) ? (
            <View className="bg-white rounded-3xl p-8 items-center border border-gray-200" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
              <FontAwesome6 name="lock" size={48} color="#999" />
              <Text className="text-foreground text-lg font-semibold mt-4">材料未解锁</Text>
              <Text className="text-muted text-sm mt-2">购买后即可查看学习进度</Text>
            </View>
          ) : (
            <>
              {/* Progress Card */}
              <View className="bg-white rounded-3xl p-5 mb-4 border border-gray-200" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
                <Text className="text-sm text-muted mb-3">学习进度</Text>
                <View className="flex-row items-end gap-2 mb-3">
                  <Text className="text-4xl font-bold text-foreground">{learned}</Text>
                  <Text className="text-muted text-lg mb-1">/ {totalWords} 词</Text>
                </View>
                <View className="h-3 bg-background rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ width: `${progressPercent}%`, backgroundColor: '#87CEEB' }}
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

      {/* Purchase Modal */}
      <Modal
        visible={purchaseModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPurchaseModal({ visible: false, materialId: null })}
      >
        <View className="flex-1 bg-black/70 items-center justify-center p-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-[320px]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 8 }}>
            {purchaseModal.materialId && (() => {
              const material = getMaterial(purchaseModal.materialId);
              if (!material) return null;
              const alreadyUnlocked = isMaterialUnlocked(purchaseModal.materialId);
              return (
                <>
                  <View className="items-center mb-4">
                    <FontAwesome6 name={alreadyUnlocked ? "circle-check" : "crown"} size={40} color={alreadyUnlocked ? "#4ECDC4" : "#FFB347"} />
                    <Text className="text-foreground text-xl font-bold mt-3">{material.name}</Text>
                    <Text className="text-muted text-sm mt-1">{alreadyUnlocked ? '已解锁' : '解锁完整词表'}</Text>
                  </View>

                  <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-muted text-sm">词表内容</Text>
                      <Text className="text-foreground font-semibold">{material.id === 'ielts_sequential' || material.id === 'ielts_random' ? '7956' : '50'} 词</Text>
                    </View>
                    <View className="flex-row justify-between items-center mt-2">
                      <Text className="text-muted text-sm">例句发音</Text>
                      <Text className="text-foreground font-semibold">支持</Text>
                    </View>
                    <View className="flex-row justify-between items-center mt-2">
                      <Text className="text-muted text-sm">学习记录</Text>
                      <Text className="text-foreground font-semibold">云端存储</Text>
                    </View>
                  </View>

                  {alreadyUnlocked ? (
                    <>
                      <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-100 items-center">
                        <FontAwesome6 name="check" size={24} color="#4ECDC4" />
                        <Text className="text-green-700 font-semibold mt-2">此材料已解锁</Text>
                      </View>
                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={() => {
                            setListId(purchaseModal.materialId!);
                            setPurchaseModal({ visible: false, materialId: null });
                          }}
                          className="flex-1 bg-[#6C63FF] rounded-2xl py-3 items-center"
                        >
                          <Text className="text-white font-semibold">开始学习</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setPurchaseModal({ visible: false, materialId: null })}
                          className="flex-1 bg-gray-100 rounded-2xl py-3 items-center"
                        >
                          <Text className="text-muted font-semibold">关闭</Text>
                        </Pressable>
                      </View>
                      <Pressable
                        onPress={() => {
                          resetPurchase(purchaseModal.materialId!);
                          setPurchaseModal({ visible: false, materialId: null });
                          Alert.alert('已重置', '材料已重新锁定');
                        }}
                        className="mt-3 items-center"
                      >
                        <Text className="text-gray-400 text-xs">重新锁定（仅供截图测试）</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <View className="items-center mb-4">
                        <Text className="text-muted text-sm">价格</Text>
                        <Text className="text-foreground text-3xl font-bold">¥{material.price}</Text>
                      </View>
                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={() => setPurchaseModal({ visible: false, materialId: null })}
                          className="flex-1 bg-gray-100 rounded-2xl py-3 items-center"
                        >
                          <Text className="text-muted font-semibold">取消</Text>
                        </Pressable>
                        <Pressable
                          onPress={handlePurchase}
                          disabled={purchasing}
                          className="flex-1 bg-[#6C63FF] rounded-2xl py-3 items-center"
                          style={{ opacity: purchasing ? 0.6 : 1 }}
                        >
                          {purchasing ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text className="text-white font-semibold">立即购买</Text>
                          )}
                        </Pressable>
                      </View>
                      <Pressable
                        onPress={handleRestore}
                        disabled={restoring}
                        className="mt-3 items-center py-1"
                        style={{ opacity: restoring ? 0.5 : 1 }}
                      >
                        {restoring ? (
                          <ActivityIndicator size="small" color="#6C63FF" />
                        ) : (
                          <Text className="text-[#6C63FF] text-sm">恢复购买</Text>
                        )}
                      </Pressable>
                    </>
                  )}
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function ListCard({ list, material, progress, isSelected, isUnlocked, onSelect, onReset, isCompleted }: { 
  list: any;
  material: any;
  progress?: ProgressData;
  isSelected: boolean;
  isUnlocked: boolean;
  onSelect: () => void;
  onReset: () => void;
  isCompleted: boolean;
}) {
  const learned = progress?.total || 0;
  const total = list.totalWords || 0;
  const percent = total > 0 ? Math.round((learned / total) * 100) : 0;

  return (
    <View className="mr-3">
      <Pressable
        onPress={onSelect}
        className={`px-4 py-3 rounded-2xl min-w-[140px] ${isSelected ? 'bg-accent-mint/15 border-2 border-accent-mint' : 'bg-white border border-gray-200'}`}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}
      >
        <View className="flex-row items-center gap-2 mb-1">
          <FontAwesome6 name={list.icon as any} size={14} color={list.color} />
          <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>{list.name}</Text>
          {isCompleted && (
            <View className="bg-green-100 rounded-full px-2 py-0.5">
              <Text className="text-green-700 text-[10px] font-bold">已完成</Text>
            </View>
          )}
        </View>
        <Text className="text-muted text-xs">{total} 词</Text>
        <View className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
          <View className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: isCompleted ? '#4ECDC4' : '#87CEEB' }} />
        </View>
        <Text className="text-xs text-muted mt-1">{percent}%</Text>
        
        {!isUnlocked && (
          <View className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
            <FontAwesome6 name="lock" size={12} color="#fff" />
          </View>
        )}
        {isSelected && isUnlocked && !isCompleted && (
          <View className="absolute top-2 right-2">
            <FontAwesome6 name="circle-check" size={16} color="#4ECDC4" />
          </View>
        )}
        {isCompleted && (
          <View className="absolute top-2 right-2">
            <FontAwesome6 name="trophy" size={16} color="#4ECDC4" />
          </View>
        )}
      </Pressable>
      {isCompleted && isSelected && isUnlocked && (
        <Pressable
          onPress={onReset}
          className="mt-2 bg-orange-50 rounded-xl py-2 items-center border border-orange-200"
        >
          <Text className="text-orange-600 text-xs font-semibold">重新学习</Text>
        </Pressable>
      )}
    </View>
  );
}

function StatCard({ icon, iconColor, label, value }: { icon: string; iconColor: string; label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 items-center border border-gray-200" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}>
      <FontAwesome6 name={icon as any} size={22} color={iconColor} />
      <Text className="text-foreground text-xl font-bold mt-2">{value}</Text>
      <Text className="text-muted text-xs mt-0.5">{label}</Text>
    </View>
  );
}
