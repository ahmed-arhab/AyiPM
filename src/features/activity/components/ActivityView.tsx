'use client';

import { useCallback } from 'react';
import { Activity, Download, History, RotateCcw, SearchX } from 'lucide-react';
import { useActivityLog, useCurrentUser, usePermission } from '@/store';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/components/feedback/ToastProvider';
import { toDateKey } from '@/lib/date';
import { pluralize } from '@/lib/format';
import { Button, Card, EmptyState, PageHeader, Pagination } from '@/components/ui';
import { useActivityFilters } from '../hooks/useActivityFilters';
import { downloadFile } from '@/lib/csv';
import { ACTIVITY_PAGE_SIZE, activityToCsv } from '../utils';
import { ActivityFilterBar } from './ActivityFilterBar';
import { ActivityTimeline } from './ActivityTimeline';
import { useT } from '@/translations';
import styles from './ActivityView.module.css';

const ALL_DESCRIPTION = 'Audit trail of every change across the workspace — onboarding, tasks, projects, attendance, leave and settings.';
const OWN_DESCRIPTION = 'Showing only actions you performed. The workspace-wide audit trail is available to admins and project managers.';

export function ActivityView() {
  const { t } = useT();
  const user = useCurrentUser();
  const canViewAll = usePermission('activity.viewAll');
  const log = useActivityLog();
  const toast = useToast();
  const { filters, update, reset, isFiltered, filterKey, scoped, counts, actors, filtered } = useActivityFilters(log, canViewAll, user.id);
  const { page, pageCount, pageItems, setPage, total, pageSize } = usePagination(filtered, ACTIVITY_PAGE_SIZE, filterKey);

  const exportCsv = useCallback(() => {
    downloadFile(`activity-log-${toDateKey()}.csv`, activityToCsv(filtered));
    toast.success(`Exported ${pluralize(filtered.length, 'entry', 'entries')}`);
  }, [filtered, toast]);

  return (
    <div className="page-container">
      <PageHeader
        icon={Activity}
        title="Activity Audit"
        description={canViewAll ? ALL_DESCRIPTION : OWN_DESCRIPTION}
        actions={
          canViewAll && (
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} disabled={filtered.length === 0}>
              {t('Export CSV')}
            </Button>
          )
        }
      />

      {scoped.length > 0 && (
        <ActivityFilterBar
          filters={filters}
          counts={counts}
          actors={actors}
          showActorFilter={canViewAll}
          isFiltered={isFiltered}
          onChange={update}
          onReset={reset}
        />
      )}

      <Card padding="none">
        {scoped.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity recorded yet"
            description={
              canViewAll
                ? 'Changes to employees, projects, tasks, attendance, leave and settings will be logged here as they happen.'
                : "Actions you take — checking in, requesting leave, updating tasks — will be logged here."
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No activity matches your filters"
            description="Try a different search term, entity type or date range."
            action={
              <Button variant="secondary" size="sm" icon={RotateCcw} onClick={reset}>
                {t('Reset filters')}
              </Button>
            }
          />
        ) : (
          <>
            <ActivityTimeline items={pageItems} />
            <div className={styles.pagination}>
              <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
