'use client';

import { useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { Card, SearchInput, SegmentedControl, Select, Switch, type SegmentOption } from '@/components/ui';
import { NOTIFICATION_CATEGORY } from '@/constants/status';
import type { UpdateNotificationFilter } from '../hooks/useNotificationFilters';
import {
  NOTIFICATION_CATEGORIES,
  PRIORITY_OPTIONS,
  type CategoryFilter,
  type NotificationFilterState,
} from '../utils';
import { CATEGORY_ICONS } from './NotificationRow';
import styles from './NotificationFilterBar.module.css';

interface NotificationFilterBarProps {
  filters: NotificationFilterState;
  counts: Record<CategoryFilter, number>;
  unread: number;
  onChange: UpdateNotificationFilter;
}

export function NotificationFilterBar({ filters, counts, unread, onChange }: NotificationFilterBarProps) {
  const categoryOptions = useMemo<SegmentOption<CategoryFilter>[]>(
    () => [
      { value: 'all', label: 'All', count: counts.all, icon: Inbox },
      ...NOTIFICATION_CATEGORIES.map((c) => ({
        value: c,
        label: NOTIFICATION_CATEGORY[c].label,
        count: counts[c],
        icon: CATEGORY_ICONS[c],
      })),
    ],
    [counts]
  );

  return (
    <Card padding="sm" className={styles.panel}>
      <div className={styles.topRow}>
        <SegmentedControl
          label="Filter by category"
          size="sm"
          options={categoryOptions}
          value={filters.category}
          onChange={(value) => onChange('category', value)}
        />
        <div className={styles.unreadToggle}>
          <Switch
            label={`Unread only (${unread})`}
            checked={filters.unreadOnly}
            onChange={(checked) => onChange('unreadOnly', checked)}
          />
        </div>
      </div>
      <div className={styles.searchRow}>
        <SearchInput
          value={filters.query}
          onChange={(value) => onChange('query', value)}
          placeholder="Search by title or message…"
          aria-label="Search notifications"
        />
        <Select
          className={styles.priority}
          options={PRIORITY_OPTIONS}
          value={filters.priority}
          onChange={(value) => onChange('priority', value)}
          aria-label="Filter by priority"
        />
      </div>
    </Card>
  );
}
