'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/translations';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, compact, className }: EmptyStateProps) {
  const { t } = useT();
  const displayTitle = typeof title === 'string' ? t(title) : title;
  const displayDescription = typeof description === 'string' ? t(description) : description;

  return (
    <div className={cn(styles.empty, compact && styles.compact, className)}>
      <span className={styles.icon}>
        <Icon size={compact ? 20 : 26} />
      </span>
      <h3 className={styles.title}>{displayTitle}</h3>
      {description && <p className={styles.description}>{displayDescription}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
