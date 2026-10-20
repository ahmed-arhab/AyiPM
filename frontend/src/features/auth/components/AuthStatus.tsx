import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './AuthStatus.module.css';

interface AuthStatusProps {
  icon: LucideIcon;
  title: ReactNode;
  tone?: 'success' | 'danger';
  children?: ReactNode;
  actions?: ReactNode;
}

export function AuthStatus({ icon: Icon, title, tone = 'success', children, actions }: AuthStatusProps) {
  return (
    <div className="auth-success-card" role="status">
      <span className={cn('auth-success-icon-wrap', tone === 'danger' && styles.danger)} aria-hidden>
        <Icon size={30} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {children && <div className={styles.message}>{children}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
