'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useT } from '@/translations';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  icon: LucideIcon;
  hint?: ReactNode;
  accent?: string;
}

export function StatCard({ label, value, icon: Icon, hint, accent = 'var(--primary)' }: StatCardProps) {
  const { t, formatNumber } = useT();
  const displayLabel = typeof label === 'string' ? t(label) : label;
  const displayHint = typeof hint === 'string' ? t(hint) : hint;
  const displayValue = typeof value === 'number' ? formatNumber(value) : typeof value === 'string' ? t(value) : value;

  return (
    <div className={`card ${styles.stat}`} style={{ borderTopColor: accent }}>
      <div className={styles.top}>
        <span className="heading-sm">{displayLabel}</span>
        <Icon size={18} color={accent} />
      </div>
      <div className={styles.value}>{displayValue}</div>
      {hint && <div className="subtext">{displayHint}</div>}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
