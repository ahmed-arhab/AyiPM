import { useMemo, useState } from 'react';

export function usePagination<T>(items: T[], pageSize = 20, resetKey?: unknown) {
  const [requestedPage, setPage] = useState(1);
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  if (!Object.is(lastResetKey, resetKey)) {
    setLastResetKey(resetKey);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);

  return { page, pageCount, pageItems, setPage, total: items.length, pageSize };
}
