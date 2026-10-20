import type { ReactNode } from 'react';
import styles from './SettingRow.module.css';

interface SettingRowProps {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function SettingRow({ label, hint, children }: SettingRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
