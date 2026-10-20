import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AuthHeader } from './AuthHeader';
import styles from './AuthCard.module.css';

interface AuthCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  wide?: boolean;
  footer?: ReactNode;
  logoOnMobileOnly?: boolean;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, icon, wide, footer, logoOnMobileOnly, children }: AuthCardProps) {
  return (
    <section className={cn('auth-card', wide && 'auth-card-wide')}>
      <AuthHeader title={title} subtitle={subtitle} icon={icon} logoOnMobileOnly={logoOnMobileOnly} />
      <div className={styles.body}>{children}</div>
      {footer}
    </section>
  );
}
