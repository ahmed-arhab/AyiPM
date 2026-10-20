import { CalendarClock } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { Progress } from '@/components/animate-ui/components/radix/progress';
import { daysBetweenInclusive, toDateKey } from '@/lib/date';
import { percent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useFormatters } from '@/store';
import type { Project } from '@/types';
import { describeDeadline } from '../utils';
import styles from './ProjectDeadlineCard.module.css';

export function ProjectDeadlineCard({ project }: { project: Project }) {
  const { date } = useFormatters();
  const completed = project.status === 'completed';
  const info = describeDeadline(project.endDate, completed);
  const totalDays = project.startDate && project.endDate ? daysBetweenInclusive(project.startDate, project.endDate) : 0;
  const elapsed = project.startDate ? daysBetweenInclusive(project.startDate, toDateKey()) : 0;
  const timeline = completed ? 100 : Math.min(100, percent(elapsed, totalDays));
  const headline = info.days === null ? info.label : info.days < 0 ? Math.abs(info.days) : info.days;
  const caption = info.days === null ? null : info.days < 0 ? 'days overdue' : info.days === 0 ? 'due today' : info.days === 1 ? 'day left' : 'days left';

  return (
    <Card as="section">
      <CardHeader icon={CalendarClock} title="Deadline" description={date(project.endDate)} />
      <div className={cn(styles.figure, styles[info.tone])}>
        <span className={styles.value}>{headline}</span>
        {caption && <span className={styles.caption}>{caption}</span>}
      </div>
      {totalDays > 0 && (
        <div className={styles.timeline}>
          <Progress
            value={timeline}
            className={styles.track}
            indicatorClassName={cn(styles.fill, styles[`fill_${info.tone}`])}
          />
          <div className={styles.range}>
            <span>{date(project.startDate)}</span>
            <span>{timeline}% of timeline elapsed</span>
          </div>
        </div>
      )}
    </Card>
  );
}
