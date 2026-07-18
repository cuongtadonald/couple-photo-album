'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Giống useState nhưng tự đồng bộ với sessionStorage.
 * Dữ liệu tồn tại qua F5 / back button, mất khi đóng tab.
 */
export function useSessionState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = sessionStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          if (resolved === null || resolved === undefined) {
            sessionStorage.removeItem(key);
          } else {
            sessionStorage.setItem(key, JSON.stringify(resolved));
          }
        } catch {
          // quota exceeded or SSR — ignore
        }
        return resolved;
      });
    },
    [key]
  );

  // Sync nếu key thay đổi (hiếm nhưng an toàn)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, set] as const;
}

/** Xóa một key khỏi sessionStorage */
export function clearSessionKey(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
