import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './AuthNotice.module.css';

interface AuthNoticeProps {
  icon: LucideIcon;
  title?: ReactNode;
  tone?: 'info' | 'success' | 'warning';
  action?: ReactNode;
  children: ReactNode;
}

export function AuthNotice({ icon: Icon, title, tone = 'info', action, children }: AuthNoticeProps) {
  return (
    <div className={cn(styles.notice, styles[tone])} role="note">
      <span className={styles.icon} aria-hidden>
        <Icon size={18} />
      </span>
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        <div className={styles.text}>{children}</div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  );
}
