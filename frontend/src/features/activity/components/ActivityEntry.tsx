import { memo } from 'react';
import { Clock } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { ROLE_LABELS } from '@/constants/roles';
import { cn } from '@/lib/cn';
import type { ActivityLogItem } from '@/types';
import { ENTITY_META } from '../utils';
import styles from './ActivityEntry.module.css';

interface ActivityEntryProps {
  item: ActivityLogItem;
  time: string;
  avatar?: string;
}

export const ActivityEntry = memo(function ActivityEntry({ item, time, avatar }: ActivityEntryProps) {
  const meta = ENTITY_META[item.entityType] ?? ENTITY_META.settings;
  const Icon = meta.icon;
  return (
    <li className={styles.entry}>
      <span className={cn(styles.icon, styles[item.entityType])} title={meta.label}>
        <Icon size={16} />
      </span>
      <div className={styles.body}>
        <div className={styles.head}>
          <span className={styles.actor}>
            <Avatar name={item.actorName} src={avatar} size={22} />
            <span className={styles.actorName}>{item.actorName}</span>
            <span className={styles.role}>{ROLE_LABELS[item.actorRole] ?? item.actorRole}</span>
          </span>
          <time className={styles.time} dateTime={item.createdAt}>
            <Clock size={12} />
            {time}
          </time>
        </div>
        <p className={styles.summary}>
          <span className={styles.action}>{item.action}</span> <strong className={styles.entity}>{item.entityName}</strong>
        </p>
        {item.details && <p className={styles.details}>{item.details}</p>}
      </div>
    </li>
  );
});
