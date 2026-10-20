import type { ReactNode } from 'react';
import { AuthShowcase } from './AuthShowcase';
import styles from './AuthSplitLayout.module.css';

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.split}>
      <AuthShowcase />
      <div className={styles.formSide}>{children}</div>
    </div>
  );
}
