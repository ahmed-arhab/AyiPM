import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import styles from './SummaryTile.module.css';

interface SummaryTileProps {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number;
  hint?: string;
}

export function SummaryTile({ href, icon: Icon, label, value, hint }: SummaryTileProps) {
  return (
    <Link href={href} className={styles.tile}>
      <Icon size={16} className={styles.icon} />
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </Link>
  );
}
