import type { LucideIcon } from 'lucide-react';
import { ProgressBar } from '@/components/ui';
import { useT } from '@/translations';
import { percent } from '@/lib/format';
import styles from './LeaveBalanceCard.module.css';

interface LeaveBalanceCardProps {
  label: string;
  icon: LucideIcon;
  accent: string;
  total: number;
  used: number;
  pending: number;
}

export function LeaveBalanceCard({ label, icon: Icon, accent, total, used, pending }: LeaveBalanceCardProps) {
  const { t, formatNumber } = useT();
  const remaining = Math.max(0, total - used);
  const translatedLabel = t(label);

  return (
    <div className={`card ${styles.card}`} style={{ borderTopColor: accent }}>
      <div className={styles.top}>
        <span className="heading-sm">{translatedLabel}</span>
        <Icon size={18} color={accent} />
      </div>
      <div className={styles.value}>
        {formatNumber(remaining)}
        <span className={styles.of}>{t(' / {total} days left', { total: formatNumber(total) })}</span>
      </div>
      <ProgressBar value={percent(used, total)} label={`${translatedLabel} ${t('Used').toLowerCase()}`} color={accent} />
      <div className={styles.meta}>
        <span>
          {used === 0
            ? t('0 days used this year')
            : t(used === 1 ? '{count} day used this year' : '{count} days used this year', { count: formatNumber(used) })}
        </span>
        {pending > 0 && (
          <span className={styles.pending}>
            {t(pending === 1 ? '{count} day pending' : '{count} days pending', { count: formatNumber(pending) })}
          </span>
        )}
      </div>
    </div>
  );
}
