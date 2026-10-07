'use client';

import Link from 'next/link';
import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { markAllNotificationsRead, markNotificationRead, useMyNotifications, useUnreadCount } from '@/store';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDisclosure } from '@/hooks/useDisclosure';
import { ROUTES } from '@/constants/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import type { NotificationItem } from '@/types';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/animate-ui/primitives/radix/collapsible';
import styles from './NotificationBell.module.css';

const PREVIEW_COUNT = 6;

export function NotificationBell() {
  const router = useRouter();
  const notifications = useMyNotifications();
  const unread = useUnreadCount();
  const { isOpen, toggle, close } = useDisclosure();
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, close, isOpen);

  const open = useCallback(
    (item: NotificationItem) => {
      markNotificationRead(item.id);
      close();
      if (item.link) router.push(item.link);
    },
    [close, router]
  );

  return (
    <Collapsible open={isOpen} onOpenChange={toggle} asChild>
      <div ref={ref} className={styles.wrap}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={`icon-btn ${styles.trigger}`}
            aria-expanded={isOpen}
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          >
            <Bell size={19} />
            {unread > 0 && <span className={styles.count}>{unread > 99 ? '99+' : unread}</span>}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent
          className={styles.panel}
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'top right' }}
        >
          <div className={styles.header}>
            <h3 className="heading-md">Notifications</h3>
            {unread > 0 && (
              <button type="button" className={styles.markAll} onClick={markAllNotificationsRead}>
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <EmptyState compact icon={Inbox} title="You're all caught up" description="New activity that needs your attention will show up here." />
            ) : (
              notifications.slice(0, PREVIEW_COUNT).map((item) => <NotificationRow key={item.id} item={item} onOpen={open} compact />)
            )}
          </div>
          <Link href={ROUTES.notifications} className={styles.footer} onClick={close}>
            View all notifications
          </Link>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
