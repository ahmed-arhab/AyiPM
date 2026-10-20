import { AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { describeDeadline } from '../utils';
import styles from './DeadlineLabel.module.css';

interface DeadlineLabelProps {
  endDate?: string;
  completed?: boolean;
  className?: string;
}

export function DeadlineLabel({ endDate, completed, className }: DeadlineLabelProps) {
  const info = describeDeadline(endDate, completed);
  const Icon = info.tone === 'success' ? CheckCircle2 : info.tone === 'danger' ? AlertTriangle : CalendarClock;
  return (
    <span className={cn(styles.label, styles[info.tone], className)}>
      <Icon size={13} />
      {info.label}
    </span>
  );
}
