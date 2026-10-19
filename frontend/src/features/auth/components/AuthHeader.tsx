import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import styles from './AuthHeader.module.css';

interface AuthHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  logoOnMobileOnly?: boolean;
}

export function AuthHeader({ title, subtitle, icon: Icon, logoOnMobileOnly }: AuthHeaderProps) {
  return (
    <header className="auth-header">
      <div className={logoOnMobileOnly ? `${styles.logo} ${styles.mobileOnly}` : styles.logo}>
        <BrandLogo size="lg" />
      </div>
      {Icon && (
        <span className="auth-header-icon" aria-hidden>
          <Icon size={22} />
        </span>
      )}
      <h1 className="auth-title">{title}</h1>
      {subtitle && <p className="auth-subtitle">{subtitle}</p>}
    </header>
  );
}
