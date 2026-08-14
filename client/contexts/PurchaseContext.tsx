import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Purchase } from 'expo-iap';

export interface MaterialInfo {
  id: string;
  // App Store Connect 里的内购商品 ID，缺省时与词库 id 相同（顺序/乱序版在 ASC 建品时带了包名前缀）
  productId?: string;
  name: string;
  price: number;
  isFree: boolean;
}

export const MATERIALS: MaterialInfo[] = [
  { id: 'core', name: '核心词汇', price: 0, isFree: true },
  { id: 'academic', name: '学术词汇', price: 0, isFree: true },
  { id: 'advanced', name: '高级词汇', price: 0, isFree: true },
  { id: 'ielts_sequential', productId: 'com.mikelu.ieltsvocab.sequential', name: '雅思 8000 词 (顺序版)', price: 6, isFree: false },
  { id: 'ielts_random', productId: 'com.mikelu.ieltsvocab.random', name: '雅思 8000 词 (乱序版)', price: 6, isFree: false },
  { id: 'ielts_frequency', name: '雅思 8000 词 (词频排序版)', price: 6, isFree: false },
  { id: 'ielts_root', name: '雅思 8000 词 (词根归类版)', price: 6, isFree: false },
];

const STORAGE_KEY = 'purchased_materials';
const MATERIAL_ID_BY_PRODUCT = new Map(MATERIALS.map(m => [m.productId ?? m.id, m.id]));
// expo-iap 没有 web 实现，web 预览保留模拟购买；iOS 走真实 StoreKit
const IAP_SUPPORTED = Platform.OS === 'ios';

export class PurchaseCancelledError extends Error {
  constructor() {
    super('cancelled');
    this.name = 'PurchaseCancelledError';
  }
}

interface PurchaseContextType {
  purchasedMaterials: Set<string>;
  isMaterialUnlocked: (materialId: string) => boolean;
  purchaseMaterial: (materialId: string) => Promise<void>;
  restorePurchases: () => Promise<number>;
  getMaterial: (materialId: string) => MaterialInfo | undefined;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [purchasedMaterials, setPurchasedMaterials] = useState<Set<string>>(new Set());
  const pendingRef = useRef(new Map<string, { resolve: () => void; reject: (e: Error) => void }>());

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setPurchasedMaterials(new Set(JSON.parse(stored)));
      } catch (error) {
        console.error('Failed to load purchased materials:', error);
      }
    })();
  }, []);

  const addPurchased = useCallback((materialId: string) => {
    setPurchasedMaterials(prev => {
      if (prev.has(materialId)) return prev;
      const next = new Set(prev);
      next.add(materialId);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch((e) => console.warn('save purchases failed:', e));
      return next;
    });
  }, []);

  // iOS：初始化 StoreKit 连接并监听购买事件（requestPurchase 的结果通过事件回调）
  useEffect(() => {
    if (!IAP_SUPPORTED) return;

    let listeners: { remove: () => void }[] = [];
    let active = true;

    (async () => {
      try {
        const iap = await import('expo-iap');
        if (!active) return;
        await iap.initConnection();

        listeners = [
          iap.purchaseUpdatedListener(async (purchase: Purchase) => {
            const materialId = MATERIAL_ID_BY_PRODUCT.get(purchase.productId);
            try {
              await iap.finishTransaction({ purchase, isConsumable: false });
            } catch (e) {
              console.warn('finishTransaction failed:', e);
            }
            if (materialId) {
              addPurchased(materialId);
              pendingRef.current.get(materialId)?.resolve();
              pendingRef.current.delete(materialId);
            }
          }),
          iap.purchaseErrorListener((error) => {
            const err = String(error.code) === 'user-cancelled'
              ? new PurchaseCancelledError()
              : new Error(error.message || 'purchase failed');
            pendingRef.current.forEach(p => p.reject(err));
            pendingRef.current.clear();
          }),
        ];
      } catch (e) {
        console.warn('IAP init failed:', e);
      }
    })();

    return () => {
      active = false;
      listeners.forEach(l => l.remove());
      import('expo-iap').then(iap => iap.endConnection()).catch((e) => console.warn('endConnection failed:', e));
    };
  }, [addPurchased]);

  const isMaterialUnlocked = (materialId: string): boolean => {
    const material = MATERIALS.find(m => m.id === materialId);
    if (!material) return false;
    if (material.isFree) return true;
    return purchasedMaterials.has(materialId);
  };

  const purchaseMaterial = async (materialId: string): Promise<void> => {
    const material = MATERIALS.find(m => m.id === materialId);
    if (!material || material.isFree) return;

    if (!IAP_SUPPORTED) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addPurchased(materialId);
      return;
    }

    const iap = await import('expo-iap');
    const sku = material.productId ?? material.id;
    await new Promise<void>((resolve, reject) => {
      pendingRef.current.set(materialId, { resolve, reject });
      iap.requestPurchase({
        request: { apple: { sku } },
        type: 'in-app',
      }).catch((e: unknown) => {
        pendingRef.current.delete(materialId);
        reject(e instanceof Error ? e : new Error(String(e)));
      });
    });
  };

  const restorePurchases = async (): Promise<number> => {
    if (!IAP_SUPPORTED) return 0;
    const iap = await import('expo-iap');
    const purchases = await iap.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
    let restored = 0;
    for (const purchase of purchases) {
      const materialId = MATERIAL_ID_BY_PRODUCT.get(purchase.productId);
      if (!materialId) continue;
      try {
        await iap.finishTransaction({ purchase, isConsumable: false });
      } catch {}
      addPurchased(materialId);
      restored++;
    }
    return restored;
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
        restorePurchases,
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
