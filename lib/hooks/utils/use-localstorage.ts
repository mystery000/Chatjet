import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] => {
  const [isMounted, setIsMounted] = useState(false);

  const isServer = typeof window === 'undefined';
  const useEffectFn = !isServer ? useLayoutEffect : useEffect;

  useEffectFn(() => {
    setIsMounted(true);
  }, []);

  const [storedValue, setStoredValue] = useState<T | undefined>(initialValue);

  useEffectFn(() => {
    if (typeof window === 'undefined') {
      return setStoredValue(initialValue);
    }

    try {
      const item = localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (e) {
      console.error('Error getting value from localStorage', e);
      return setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (e) {
        console.error('Error writing value to localStorage', e);
      }
    },
    [key, storedValue],
  );

  return [
    !isMounted || typeof storedValue === 'undefined'
      ? initialValue
      : storedValue,
    setValue,
  ];
};
