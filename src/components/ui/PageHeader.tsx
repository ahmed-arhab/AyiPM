'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useT } from '@/translations';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, eyebrow, actions, back }: PageHeaderProps) {
  const { t } = useT();
  const displayTitle = typeof title === 'string' ? t(title) : title;
  const displayDescription = typeof description === 'string' ? t(description) : description;

  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {back}
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h1 className={`heading-xl ${styles.title}`}>
          {Icon && <Icon size={28} className={styles.icon} />}
          <span>{displayTitle}</span>
        </h1>
        {description && <p className="subtext">{displayDescription}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
