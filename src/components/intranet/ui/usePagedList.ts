"use client";

import { useEffect, useState } from "react";

/**
 * Client-side "show more" pagination. Filter first, then pass the filtered
 * list here. The visible window resets to one page whenever `resetKey`
 * changes (e.g. search text + role filter).
 */
export function usePagedList<T>(items: T[], pageSize: number, resetKey: string) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [resetKey, pageSize]);

  const visible = items.slice(0, visibleCount);
  const remaining = Math.max(items.length - visible.length, 0);
  const showMore = () => setVisibleCount((c) => c + pageSize);

  return { visible, total: items.length, shown: visible.length, remaining, showMore };
}
