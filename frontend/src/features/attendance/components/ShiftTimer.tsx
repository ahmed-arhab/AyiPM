'use client';

import { useNow } from '@/hooks/useNow';
import { formatDuration, secondsSince } from '@/lib/date';
import styles from './ShiftTimer.module.css';

export function ShiftTimer({ since }: { since: string }) {
  const now = useNow(1000);
  return (
    <span className={styles.timer} aria-live="off">
      <span className={styles.pulse} aria-hidden />
      {formatDuration(secondsSince(since, now))}
    </span>
  );
}
