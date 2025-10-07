import { useState, useCallback, useRef } from 'react';
import { SPACING, TIMING } from '@/constants/theme';

// Compatible UUID generation function
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface HistoryState<T> {
  value: T;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  set: (newValue: T, saveToHistory?: boolean) => void;
  reset: () => void;
  getHistory: () => HistoryEntry<T>[];
  goToVersion: (index: number) => void;
}

interface HistoryEntry<T> {
  value: T;
  timestamp: number;
  id: string;
}

export function useHistory<T>(initialValue: T, maxHistory: number = SPACING.maxHistory): HistoryState<T> {
  const [history, setHistory] = useState<HistoryEntry<T>[]>([
    {
      value: initialValue,
      timestamp: Date.now(),
      id: generateId()
    }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const value = history[currentIndex]?.value ?? initialValue;
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const set = useCallback((newValue: T, saveToHistory: boolean = true) => {
    if (!saveToHistory) {
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[currentIndex] = {
          ...newHistory[currentIndex],
          value: newValue
        };
        return newHistory;
      });
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        const newHistory = prev.slice(0, currentIndex + 1);
        
        const lastEntry = newHistory[newHistory.length - 1];
        if (JSON.stringify(lastEntry.value) === JSON.stringify(newValue)) {
          return prev;
        }

        newHistory.push({
          value: newValue,
          timestamp: Date.now(),
          id: generateId()
        });

        if (newHistory.length > maxHistory) {
          newHistory.shift();
          return newHistory;
        }

        return newHistory;
      });
      setCurrentIndex(prev => {
        const newHistory = history.slice(0, prev + 1);
        if (JSON.stringify(newHistory[newHistory.length - 1].value) === JSON.stringify(newValue)) {
          return prev;
        }
        return Math.min(prev + 1, maxHistory - 1);
      });
    }, TIMING.debounce.save);
  }, [currentIndex, history, maxHistory]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canRedo]);

  const reset = useCallback(() => {
    setHistory([{
      value: initialValue,
      timestamp: Date.now(),
      id: generateId()
    }]);
    setCurrentIndex(0);
  }, [initialValue]);

  const getHistory = useCallback(() => {
    return history;
  }, [history]);

  const goToVersion = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      setCurrentIndex(index);
    }
  }, [history.length]);

  return {
    value,
    canUndo,
    canRedo,
    undo,
    redo,
    set,
    reset,
    getHistory,
    goToVersion
  };
}