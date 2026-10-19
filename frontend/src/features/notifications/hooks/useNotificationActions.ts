import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clearNotifications, deleteNotification, markAllNotificationsRead, markNotificationRead } from '@/store';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useToast } from '@/components/feedback/ToastProvider';
import { pluralize } from '@/lib/format';
import type { NotificationItem } from '@/types';

export function useNotificationActions(total: number) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();

  const open = useCallback(
    (item: NotificationItem) => {
      if (!item.read) markNotificationRead(item.id);
      if (item.link) router.push(item.link);
    },
    [router]
  );

  const toggleRead = useCallback((item: NotificationItem) => markNotificationRead(item.id, !item.read), []);

  const remove = useCallback(
    (item: NotificationItem) => {
      deleteNotification(item.id);
      toast.info('Notification deleted');
    },
    [toast]
  );

  const markAllRead = useCallback(() => {
    markAllNotificationsRead();
    toast.success('All notifications marked as read');
  }, [toast]);

  const clearAll = useCallback(async () => {
    const ok = await confirm({
      title: 'Clear all notifications?',
      message: `This permanently removes ${pluralize(total, 'notification')} from your inbox. This can't be undone.`,
      confirmLabel: 'Clear all',
      tone: 'danger',
    });
    if (!ok) return;
    clearNotifications();
    toast.success('Notifications cleared');
  }, [confirm, toast, total]);

  return { open, toggleRead, remove, markAllRead, clearAll };
}
