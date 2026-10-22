'use client';

import { Bell, CheckCheck, Inbox, RotateCcw, SearchX, Trash2 } from 'lucide-react';
import { useMyNotifications, useUnreadCount } from '@/store';
import { usePagination } from '@/hooks/usePagination';
import { Button, Card, EmptyState, PageHeader, Pagination } from '@/components/ui';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { useNotificationFilters } from '../hooks/useNotificationFilters';
import { NOTIFICATIONS_PAGE_SIZE } from '../utils';
import { NotificationFilterBar } from './NotificationFilterBar';
import { NotificationList } from './NotificationList';
import { NotificationPreferencesHint } from './NotificationPreferencesHint';
import { NotificationStats } from './NotificationStats';
import { useT } from '@/translations';
import styles from './NotificationsView.module.css';

export function NotificationsView() {
  const { t, formatNumber } = useT();
  const notifications = useMyNotifications();
  const unread = useUnreadCount();
  const { filters, update, reset, filterKey, counts, filtered } = useNotificationFilters(notifications);
  const { page, pageCount, pageItems, setPage, total, pageSize } = usePagination(filtered, NOTIFICATIONS_PAGE_SIZE, filterKey);
  const { open, toggleRead, remove, markAllRead, clearAll } = useNotificationActions(notifications.length);
  const hasAny = notifications.length > 0;

  return (
    <div className="page-container">
      <PageHeader
        icon={Bell}
        title="Notifications"
        description={
          unread > 0
            ? t('You have {count} unread notifications. Task handoffs, leave reviews, attendance and project updates land here.', {
                count: formatNumber(unread),
              })
            : t("You're all caught up. Task handoffs, leave reviews, attendance and project updates land here.")
        }
        actions={
          <>
            <Button variant="secondary" size="sm" icon={CheckCheck} onClick={markAllRead} disabled={unread === 0}>
              {t('Mark all read')}
            </Button>
            <Button variant="ghost" size="sm" icon={Trash2} onClick={clearAll} disabled={!hasAny}>
              {t('Clear all')}
            </Button>
          </>
        }
      />

      {hasAny && <NotificationStats items={notifications} unread={unread} />}
      {hasAny && <NotificationFilterBar filters={filters} counts={counts} unread={unread} onChange={update} />}

      <Card padding="none">
        {!hasAny ? (
          <EmptyState
            icon={Inbox}
            title="No notifications yet"
            description="When someone assigns you a task, reviews your leave, or updates a project you're on, it will show up here."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No notifications match your filters"
            description="Try a different search term, category or priority, or turn off Unread only."
            action={
              <Button variant="secondary" size="sm" icon={RotateCcw} onClick={reset}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <>
            <NotificationList items={pageItems} onOpen={open} onToggleRead={toggleRead} onDelete={remove} />
            <div className={styles.pagination}>
              <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      <NotificationPreferencesHint />
    </div>
  );
}
