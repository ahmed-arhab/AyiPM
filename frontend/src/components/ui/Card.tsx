import type { HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article';
  padding?: 'none' | 'sm' | 'md';
  interactive?: boolean;
}

export function Card({ as: Tag = 'div', padding = 'md', interactive, className, ...rest }: CardProps) {
  return (
    <Tag
      className={cn('card', padding === 'none' && styles.flush, padding === 'sm' && styles.compact, interactive && styles.interactive, className)}
      {...rest}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function CardHeader({ title, description, icon: Icon, actions }: CardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        {Icon && (
          <span className={styles.icon}>
            <Icon size={18} />
          </span>
        )}
        <div>
          <h2 className="heading-md">{title}</h2>
          {description && <p className="subtext">{description}</p>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
