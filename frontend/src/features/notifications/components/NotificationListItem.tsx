'use client';

import { memo } from 'react';
import { Check, Mail, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';
import type { NotificationItem } from '@/types';
import { NotificationRow } from './NotificationRow';

export type NotificationHandler = (item: NotificationItem) => void;

interface NotificationListItemProps {
  item: NotificationItem;
  onOpen: NotificationHandler;
  onToggleRead: NotificationHandler;
  onDelete: NotificationHandler;
}

export const NotificationListItem = memo(function NotificationListItem({ item, onOpen, onToggleRead, onDelete }: NotificationListItemProps) {
  return (
    <NotificationRow
      item={item}
      onOpen={onOpen}
      actions={
        <>
          <IconButton
            icon={item.read ? Mail : Check}
            label={item.read ? 'Mark as unread' : 'Mark as read'}
            size={16}
            onClick={() => onToggleRead(item)}
          />
          <IconButton icon={Trash2} label="Delete notification" size={16} onClick={() => onDelete(item)} />
        </>
      }
    />
  );
});
