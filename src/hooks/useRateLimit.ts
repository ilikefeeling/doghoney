import { useState, useEffect, useCallback } from 'react';

const LIMIT_COUNT = 3;
const STORAGE_KEY = 'trunkfit_daily_usage';

interface UsageData {
  date: string;
  count: number;
}

export function useRateLimit(isLoggedIn: boolean) {
  const [usageCount, setUsageCount] = useState<number>(0);
  const [isLimitReached, setIsLimitReached] = useState<boolean>(false);

  useEffect(() => {
    // Check usage from local storage
    const today = new Date().toISOString().split('T')[0];
    const storedStr = localStorage.getItem(STORAGE_KEY);
    
    let currentUsage = 0;

    if (storedStr) {
      try {
        const stored: UsageData = JSON.parse(storedStr);
        if (stored.date === today) {
          currentUsage = stored.count;
        } else {
          // Date changed, reset
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        }
      } catch (e) {
        // Invalid data
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
    }

    setUsageCount(currentUsage);
    
    // Logged in users bypass the limit for now, or you could apply a higher limit.
    if (!isLoggedIn && currentUsage >= LIMIT_COUNT) {
      setIsLimitReached(true);
    } else {
      setIsLimitReached(false);
    }
  }, [isLoggedIn]);

  const incrementUsage = useCallback((): boolean => {
    // Logged-in users always succeed (unlimited for now)
    if (isLoggedIn) return true;

    const today = new Date().toISOString().split('T')[0];
    const storedStr = localStorage.getItem(STORAGE_KEY);
    let currentUsage = 0;
    
    if (storedStr) {
      try {
        const stored: UsageData = JSON.parse(storedStr);
        if (stored.date === today) {
          currentUsage = stored.count;
        }
      } catch (e) {}
    }

    if (currentUsage >= LIMIT_COUNT) {
      setIsLimitReached(true);
      return false; // Cannot proceed
    }

    const newCount = currentUsage + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
    setUsageCount(newCount);
    
    if (newCount >= LIMIT_COUNT) {
      setIsLimitReached(true);
    }

    return true; // OK to proceed
  }, [isLoggedIn]);

  return { usageCount, isLimitReached, incrementUsage, LIMIT_COUNT };
}
