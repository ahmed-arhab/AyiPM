import { useCallback, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { NotificationItem } from '@/types';
import {
  DEFAULT_NOTIFICATION_FILTERS,
  countByCategory,
  filterNotifications,
  type NotificationFilterState,
} from '../utils';

export type UpdateNotificationFilter = <K extends keyof NotificationFilterState>(key: K, value: NotificationFilterState[K]) => void;

export function useNotificationFilters(items: NotificationItem[]) {
  const [filters, setFilters] = useState<NotificationFilterState>(DEFAULT_NOTIFICATION_FILTERS);
  const { category, priority, unreadOnly } = filters;
  const query = useDebouncedValue(filters.query, 200);

  const counts = useMemo(() => countByCategory(items), [items]);
  const filtered = useMemo(
    () => filterNotifications(items, { category, priority, unreadOnly, query }),
    [items, category, priority, unreadOnly, query]
  );

  const update = useCallback<UpdateNotificationFilter>((key, value) => setFilters((f) => ({ ...f, [key]: value })), []);
  const reset = useCallback(() => setFilters(DEFAULT_NOTIFICATION_FILTERS), []);
  const filterKey = `${category}|${priority}|${unreadOnly}|${query}`;

  return { filters, update, reset, filterKey, counts, filtered };
}
