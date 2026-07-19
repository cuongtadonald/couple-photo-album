'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'seen_items';

function loadSeen(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSeen(map: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // quota exceeded — ignore
  }
}

/**
 * Trả về trạng thái đã xem / chưa xem cho một danh sách item.
 *
 * Mỗi key = `${type}:${id}` (vd "album:3", "letter:12", "event:7")
 *
 * badge(id):
 *   'new'    — tạo trong vòng 7 ngày VÀ chưa xem
 *   'unseen' — tạo quá 7 ngày   VÀ chưa xem
 *   null     — đã xem
 */
export function useSeen(type: 'album' | 'letter' | 'event') {
  const [seen, setSeen] = useState<Record<string, number>>({});

  useEffect(() => {
    setSeen(loadSeen());
  }, []);

  const markSeen = useCallback(
    (id: number) => {
      setSeen((prev) => {
        const next = { ...prev, [`${type}:${id}`]: Date.now() };
        saveSeen(next);
        return next;
      });
    },
    [type]
  );

  const badge = useCallback(
    (id: number, createdAt: string): 'new' | 'unseen' | null => {
      const key = `${type}:${id}`;
      if (seen[key]) return null; // already seen
      const created = new Date(createdAt.includes('T') ? createdAt : createdAt.replace(' ', 'T'));
      const ageMs = Date.now() - created.getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      return ageMs <= sevenDaysMs ? 'new' : 'unseen';
    },
    [seen, type]
  );

  return { badge, markSeen };
}
