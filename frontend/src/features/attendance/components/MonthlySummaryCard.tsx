import { memo } from 'react';
import { Avatar } from '@/components/ui';
import type { Employee } from '@/types';
import type { MonthlySummaryRow } from '../utils';
import styles from './MonthlySummaryCard.module.css';

interface MonthlySummaryCardProps {
  employee: Employee;
  row: MonthlySummaryRow;
}

export const MonthlySummaryCard = memo(function MonthlySummaryCard({ employee, row }: MonthlySummaryCardProps) {
  const counts = [
    { label: 'Present', value: row.present, tone: styles.success },
    { label: 'Late', value: row.late, tone: styles.warning },
    { label: 'Half day', value: row.halfDay, tone: styles.warning },
    { label: 'Leave', value: row.leave, tone: styles.info },
  ];
  return (
    <div className={styles.card}>
      <div className={styles.person}>
        <Avatar name={employee.name} src={employee.avatar} size={36} />
        <div className={styles.personText}>
          <span className={styles.name}>{employee.name}</span>
          <span className={styles.meta}>{employee.designation}</span>
        </div>
      </div>
      <div className={styles.counts}>
        {counts.map((c) => (
          <div key={c.label} className={styles.count}>
            <span className={styles.countLabel}>{c.label}</span>
            <span className={`${styles.countValue} ${c.tone}`}>{c.value}</span>
          </div>
        ))}
      </div>
      <div className={styles.total}>
        <span>Total hours</span>
        <strong>{row.hours.toFixed(1)} hrs</strong>
      </div>
    </div>
  );
});
