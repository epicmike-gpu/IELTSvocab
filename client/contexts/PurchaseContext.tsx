import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MaterialInfo {
  id: string;
  name: string;
  price: number;
  isFree: boolean;
}

export const MATERIALS: MaterialInfo[] = [
  { id: 'core', name: '核心词汇', price: 0, isFree: true },
  { id: 'academic', name: '学术词汇', price: 0, isFree: true },
  { id: 'advanced', name: '高级词汇', price: 0, isFree: true },
  { id: 'ielts_sequential', name: '雅思 8000 词 (顺序版)', price: 6, isFree: false },
  { id: 'ielts_random', name: '雅思 8000 词 (乱序版)', price: 6, isFree: false },
];

const STORAGE_KEY = 'purchased_materials';

interface PurchaseContextType {
  purchasedMaterials: Set<string>;
  isMaterialUnlocked: (materialId: string) => boolean;
  purchaseMaterial: (materialId: string) => Promise<void>;
  getMaterial: (materialId: string) => MaterialInfo | undefined;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [purchasedMaterials, setPurchasedMaterials] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPurchasedMaterials();
  }, []);

  const loadPurchasedMaterials = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids = JSON.parse(stored);
        setPurchasedMaterials(new Set(ids));
      }
    } catch (error) {
      console.error('Failed to load purchased materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isMaterialUnlocked = (materialId: string): boolean => {
    const material = MATERIALS.find(m => m.id === materialId);
    if (!material) return false;
    if (material.isFree) return true;
    return purchasedMaterials.has(materialId);
  };

  const purchaseMaterial = async (materialId: string): Promise<void> => {
    const material = MATERIALS.find(m => m.id === materialId);
    if (!material || material.isFree) return;

    // 模拟购买流程
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newPurchased = new Set(purchasedMaterials);
    newPurchased.add(materialId);
    setPurchasedMaterials(newPurchased);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...newPurchased]));
    } catch (error) {
      console.error('Failed to save purchased materials:', error);
    }
  };

  const getMaterial = (materialId: string): MaterialInfo | undefined => {
    return MATERIALS.find(m => m.id === materialId);
  };

  return (
    <PurchaseContext.Provider
      value={{
        purchasedMaterials,
        isMaterialUnlocked,
        purchaseMaterial,
        getMaterial,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
}
