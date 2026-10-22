import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDayMonth, toDateKey } from '@/lib/date';
import { useFormatters, usePreferences } from '@/store';
import { useT } from '@/translations';
import type { Task } from '@/types';
import { COMPLETION_TREND_WEEKS, countCompletionsByWeek } from '../utils';
import styles from './CompletionTrendCard.module.css';

interface CompletionTrendCardProps {
  tasks: Task[];
  personal: boolean;
}

// Chart geometry in pixels. Columns are laid out in percentages so the chart fills the card at any width while
// bars and text keep their size.
const CHART_HEIGHT = 164;
const PLOT_HEIGHT = 108;
const BASELINE = 132;
const VALUE_GAP = 6;
const LABEL_Y = 152;
const BAR_WIDTH = 24;
const BAR_RADIUS = 4;
const MIN_BAR_HEIGHT = 4;

// Centred on x = 0, rounded at the top and square at the baseline.
function barPath(height: number): string {
  const half = BAR_WIDTH / 2;
  const r = Math.min(BAR_RADIUS, height);
  const top = BASELINE - height;
  return `M${-half} ${BASELINE}V${top + r}A${r} ${r} 0 0 1 ${r - half} ${top}H${half - r}A${r} ${r} 0 0 1 ${half} ${top + r}V${BASELINE}Z`;
}

export function CompletionTrendCard({ tasks, personal }: CompletionTrendCardProps) {
  const t = useT();
  const { date } = useFormatters();
  const { weekStart, dateFormat } = usePreferences();
  // Part of the memo key so the weeks move on when the dashboard stays open past midnight.
  const today = toDateKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- today is only a cache key; the count reads the current date.
  const weeks = useMemo(() => countCompletionsByWeek(tasks, weekStart), [tasks, weekStart, today]);

  const total = weeks.reduce((sum, week) => sum + week.count, 0);
  // The busiest week; the latest one when several tie.
  const peak = weeks.reduceRight((best, week) => (week.count > best.count ? week : best));
  const max = peak.count;
  const weekCount = t.formatNumber(COMPLETION_TREND_WEEKS);
  const unit = t(total === 1 ? 'task' : 'tasks');
  const thisWeek = weeks[weeks.length - 1].weekStart;

  return (
    <Card as="section" className={styles.card}>
      <CardHeader
        icon={TrendingUp}
        title={t(personal ? 'My completion trend' : 'Completion trend')}
        description={
          total > 0
            ? t('{count} {unit} completed in the last {weeks} weeks', { count: t.formatNumber(total), unit, weeks: weekCount })
            : t('Tasks completed per week')
        }
      />
      {total === 0 ? (
        <EmptyState
          compact
          className={styles.empty}
          icon={TrendingUp}
          title={t('Nothing completed in the last {weeks} weeks', { weeks: weekCount })}
          description={t(
            personal
              ? 'Tasks you move to Completed will appear here, week by week.'
              : 'Tasks moved to Completed will appear here, week by week.'
          )}
        />
      ) : (
        <div className={styles.plot}>
          <svg
            className={styles.chart}
            width="100%"
            height={CHART_HEIGHT}
            role="img"
            aria-label={t('{count} {unit} completed in the last {weeks} weeks, most in the week of {week} ({max})', {
              count: t.formatNumber(total),
              unit,
              weeks: weekCount,
              week: date(peak.weekStart),
              max: t.formatNumber(max),
            })}
          >
            <line className={styles.baseline} x1="0" x2="100%" y1={BASELINE} y2={BASELINE} />
            {weeks.map((week, i) => {
              const height = week.count > 0 ? Math.max(MIN_BAR_HEIGHT, (week.count / max) * PLOT_HEIGHT) : 0;
              return (
                <svg
                  key={week.weekStart}
                  className={cn(
                    styles.column,
                    week.weekStart === thisWeek && styles.current,
                    // Every other date label, counting back from this week, is hidden when the chart is narrow.
                    (weeks.length - 1 - i) % 2 === 1 && styles.minor
                  )}
                  x={`${(i / weeks.length) * 100}%`}
                  width={`${100 / weeks.length}%`}
                  overflow="visible"
                >
                  <title>
                    {t('{count} completed in the week of {week}', { count: t.formatNumber(week.count), week: date(week.weekStart) })}
                  </title>
                  <rect className={styles.hit} x="6%" width="88%" y="0" height={CHART_HEIGHT} rx="8" />
                  <svg x="50%" overflow="visible">
                    {height > 0 && (
                      <>
                        <path className={styles.bar} d={barPath(height)} style={{ animationDelay: `${i * 40}ms` }} />
                        <text className={styles.value} y={BASELINE - height - VALUE_GAP} textAnchor="middle">
                          {t.formatNumber(week.count)}
                        </text>
                      </>
                    )}
                    <text className={styles.label} y={LABEL_Y} textAnchor="middle">
                      {formatDayMonth(week.weekStart, dateFormat)}
                    </text>
                  </svg>
                </svg>
              );
            })}
          </svg>
          <table className="sr-only">
            <caption>{t('Tasks completed per week')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('Week of')}</th>
                <th scope="col">{t('Completed')}</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.weekStart}>
                  <th scope="row">
                    {date(week.weekStart)}
                    {week.weekStart === thisWeek && ` (${t('This week')})`}
                  </th>
                  <td>{t.formatNumber(week.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
