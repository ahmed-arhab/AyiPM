import { NOTIFICATION_CATEGORY } from '@/constants/status';
import { byNewest } from '@/lib/date';
import { matchesQuery } from '@/lib/format';
import type { SelectOption } from '@/components/ui/Form';
import type { NotificationCategory, NotificationItem, NotificationPriority } from '@/types';

export const NOTIFICATIONS_PAGE_SIZE = 15;

export type CategoryFilter = NotificationCategory | 'all';
export type PriorityFilter = NotificationPriority | 'all';

export interface NotificationFilterState {
  category: CategoryFilter;
  priority: PriorityFilter;
  unreadOnly: boolean;
  query: string;
}

export const DEFAULT_NOTIFICATION_FILTERS: NotificationFilterState = {
  category: 'all',
  priority: 'all',
  unreadOnly: false,
  query: '',
};

export const NOTIFICATION_CATEGORIES = Object.keys(NOTIFICATION_CATEGORY) as NotificationCategory[];

export const PRIORITY_OPTIONS: SelectOption<PriorityFilter>[] = [
  { value: 'all', label: 'All priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

export function filterNotifications(items: NotificationItem[], filters: NotificationFilterState): NotificationItem[] {
  const { category, priority, unreadOnly, query } = filters;
  return items
    .filter(
      (n) =>
        (category === 'all' || n.category === category) &&
        (priority === 'all' || n.priority === priority) &&
        (!unreadOnly || !n.read) &&
        matchesQuery(query, n.title, n.message)
    )
    .sort(byNewest);
}

export function countByCategory(items: NotificationItem[]): Record<CategoryFilter, number> {
  const counts = { all: items.length } as Record<CategoryFilter, number>;
  NOTIFICATION_CATEGORIES.forEach((c) => (counts[c] = 0));
  items.forEach((n) => (counts[n.category] = (counts[n.category] ?? 0) + 1));
  return counts;
}
