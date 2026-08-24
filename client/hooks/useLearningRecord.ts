import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'learning_records';

interface LearningRecord {
  wordId: number;
  wordListId: string;
  status: 'known' | 'unknown';
  timestamp: number;
}

interface ProgressData {
  known: number;
  unknown: number;
  total: number;
}

export function useLearningRecord() {
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      setRecords(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error('Failed to load learning records:', e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const addRecord = useCallback(async (wordId: number, wordListId: string, status: 'known' | 'unknown') => {
    const newRecord: LearningRecord = {
      wordId,
      wordListId,
      status,
      timestamp: Date.now(),
    };
    
    const updated = [...records, newRecord];
    setRecords(updated);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save learning record:', e);
    }
  }, [records]);

  const getProgress = useCallback((wordListId: string): ProgressData => {
    const listRecords = records.filter(r => r.wordListId === wordListId);
    const known = listRecords.filter(r => r.status === 'known').length;
    const unknown = listRecords.filter(r => r.status === 'unknown').length;
    const total = listRecords.length;
    return { known, unknown, total };
  }, [records]);

  const getAllProgress = useCallback((): Record<string, ProgressData> => {
    const progress: Record<string, ProgressData> = {};
    const listIds = [...new Set(records.map(r => r.wordListId))];
    
    for (const listId of listIds) {
      progress[listId] = getProgress(listId);
    }
    
    return progress;
  }, [records, getProgress]);

  const resetProgress = useCallback(async (wordListId: string) => {
    const updated = records.filter(r => r.wordListId !== wordListId);
    setRecords(updated);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to reset learning progress:', e);
    }
  }, [records]);

  const resetAll = useCallback(async () => {
    setRecords([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to reset all learning progress:', e);
    }
  }, []);

  return {
    records,
    loading,
    addRecord,
    getProgress,
    getAllProgress,
    resetProgress,
    resetAll,
  };
}
