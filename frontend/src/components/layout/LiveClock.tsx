'use client';

import { Clock } from 'lucide-react';
import { useNow } from '@/hooks/useNow';
import { usePreferences } from '@/store';
import { getLocale } from '@/translations';
import styles from './LiveClock.module.css';

export function LiveClock() {
  const now = useNow(1000);
  const { timeFormat, language } = usePreferences();
  const locale = getLocale(language);
  const date = now.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: timeFormat === '12h' });

  return (
    <div className={styles.clock} suppressHydrationWarning>
      <Clock size={14} />
      <time dateTime={now.toISOString()} suppressHydrationWarning>
        {date} • {time}
      </time>
    </div>
  );
}
