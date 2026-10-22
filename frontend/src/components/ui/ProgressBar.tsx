import { Progress } from '@/components/animate-ui/components/radix/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  color?: string;
  className?: string;
}

export function ProgressBar({ value, label, showValue, color, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('progress-block', className)}>
      {(label || showValue) && (
        <div className="progress-meta">
          {label && <span>{label}</span>}
          {showValue && <strong>{clamped}%</strong>}
        </div>
      )}
      <Progress value={clamped} aria-label={label} indicatorColor={color} />
    </div>
  );
}
