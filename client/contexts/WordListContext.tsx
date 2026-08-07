import React, { createContext, useContext, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

export interface WordListInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  totalWords: number;
  knownCount: number;
  reviewCount: number;
}

interface WordListContextType {
  currentListId: string;
  currentList: WordListInfo | null;
  lists: WordListInfo[];
  setListId: (id: string) => void;
  refreshLists: () => Promise<void>;
}

const WordListContext = createContext<WordListContextType>({
  currentListId: 'core',
  currentList: null,
  lists: [],
  setListId: (_id: string) => undefined,
  refreshLists: async () => undefined,
});

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export function WordListProvider({ children }: { children: React.ReactNode }) {
  const [currentListId, setCurrentListId] = useState('core');
  const [lists, setLists] = useState<WordListInfo[]>([]);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/word-lists`);
      const data = await res.json();
      setLists(data.lists);
    } catch (e) {
      console.error('Failed to fetch word lists:', e);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchLists();
  }, [fetchLists]));

  const setListId = useCallback((id: string) => {
    setCurrentListId(id);
  }, []);

  const currentList = lists.find(l => l.id === currentListId) || null;

  return (
    <WordListContext.Provider
      value={{ currentListId, currentList, lists, setListId, refreshLists: fetchLists }}
    >
      {children}
    </WordListContext.Provider>
  );
}

export function useWordList() {
  return useContext(WordListContext);
}
