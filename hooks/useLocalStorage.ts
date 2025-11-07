import { useState, useEffect } from 'react';
import { getLocalStorage, setLocalStorage } from '@/utils/storage';

/**
 * Custom hook for persisting state in localStorage
 * Similar to useState but syncs with localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getLocalStorage(key, initialValue);
  });

  // Update localStorage when state changes
  useEffect(() => {
    setLocalStorage(key, storedValue);
  }, [key, storedValue]);

  // Wrapper for setState that also updates localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function (like regular useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
