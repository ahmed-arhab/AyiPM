'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, Check, Trash2, X } from 'lucide-react';
import { Button, Select, type SelectOption } from '@/components/ui';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useToast } from '@/components/feedback/ToastProvider';
import { TASK_PRIORITY, TASK_PRIORITY_ORDER, TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/status';
import { deleteTasks, updateTasks, useEmployees, type BulkTaskResult } from '@/store';
import { useT } from '@/translations';
import type { Task, TaskPriority, TaskStatus, TaskUpdate } from '@/types';
import { UNASSIGNED } from '../utils';
import styles from './TaskBulkBar.module.css';

interface TaskBulkBarProps {
  /** The selected tasks. */
  tasks: Task[];
  /** Managers can change priority and assignee and delete; everyone else can only change the status. */
  canManage: boolean;
  onClear: () => void;
  /** Called after an action with the tasks it succeeded for, so they can be deselected. */
  onFinished: (succeededIds: string[]) => void;
}

interface LastRun {
  summary: string;
  failures: { id: string; title: string; error: string }[];
}

export function TaskBulkBar({ tasks, canManage, onClear, onFinished }: TaskBulkBarProps) {
  const { t, formatNumber } = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const employees = useEmployees();
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [assignee, setAssignee] = useState('');
  const [busy, setBusy] = useState<'update' | 'delete' | null>(null);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);

  const count = tasks.length;
  const hasChange = Boolean(status || priority || assignee);

  const statusOptions = useMemo<SelectOption<TaskStatus>[]>(
    () => TASK_STATUS_ORDER.map((s) => ({ value: s, label: t(TASK_STATUS[s].label) })),
    [t]
  );
  const priorityOptions = useMemo<SelectOption<TaskPriority>[]>(
    () => TASK_PRIORITY_ORDER.map((p) => ({ value: p, label: t(TASK_PRIORITY[p].label) })),
    [t]
  );
  // The server only accepts active people as assignees.
  const assigneeOptions = useMemo<SelectOption[]>(
    () => [
      { value: UNASSIGNED, label: t('Unassigned') },
      ...employees
        .filter((e) => e.status === 'active')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => ({ value: e.id, label: e.name })),
    ],
    [employees, t]
  );

  const finish = (outcome: BulkTaskResult, kind: 'update' | 'delete', titles: Map<string, string>) => {
    const done = formatNumber(outcome.succeeded.length);
    if (outcome.failed.length === 0) {
      const one = outcome.succeeded.length === 1;
      toast.success(
        kind === 'update'
          ? t(one ? '{count} task updated.' : '{count} tasks updated.', { count: done })
          : t(one ? '{count} task deleted.' : '{count} tasks deleted.', { count: done })
      );
      setLastRun(null);
    } else {
      const failed = formatNumber(outcome.failed.length);
      const summary =
        kind === 'update'
          ? t('{updated} updated, {failed} failed.', { updated: done, failed })
          : t('{deleted} deleted, {failed} failed.', { deleted: done, failed });
      // The bar lists every error for tasks that stay selected; the toast also covers tasks that have since gone or
      // can no longer be selected.
      toast.error(`${summary} ${t(outcome.failed[0].error)}`);
      setLastRun({ summary, failures: outcome.failed.map((f) => ({ ...f, title: titles.get(f.id) ?? '' })) });
    }
    onFinished(outcome.succeeded);
  };

  const run = async (kind: 'update' | 'delete', action: (ids: string[]) => ReturnType<typeof deleteTasks>) => {
    const titles = new Map(tasks.map((task) => [task.id, task.title]));
    setBusy(kind);
    setLastRun(null);
    const result = await action(tasks.map((task) => task.id));
    setBusy(null);
    if (!result.ok) {
      toast.error(t(result.error));
      return false;
    }
    finish(result.data, kind, titles);
    return result.data.failed.length === 0;
  };

  const apply = async () => {
    const update: Pick<TaskUpdate, 'status' | 'priority' | 'assigneeId'> = {};
    if (status) update.status = status;
    if (priority) update.priority = priority;
    if (assignee) update.assigneeId = assignee === UNASSIGNED ? '' : assignee;
    const allDone = await run('update', (ids) => updateTasks(ids, update));
    if (allDone) {
      setStatus('');
      setPriority('');
      setAssignee('');
    }
  };

  const remove = async () => {
    const one = count === 1;
    const confirmed = await confirm({
      title: t(one ? 'Delete {count} task?' : 'Delete {count} tasks?', { count: formatNumber(count) }),
      message: one
        ? t('“{title}” and its comments will be permanently removed.', { title: tasks[0].title })
        : t('{count} tasks and their comments will be permanently removed.', { count: formatNumber(count) }),
      confirmLabel: t(one ? 'Delete {count} task' : 'Delete {count} tasks', { count: formatNumber(count) }),
      cancelLabel: t('Cancel'),
      tone: 'danger',
    });
    if (confirmed) await run('delete', deleteTasks);
  };

  // Only failures for tasks that are still selected; the rest have been dealt with or deselected.
  const failureGroups = useMemo(() => {
    const selectedIds = new Set(tasks.map((task) => task.id));
    const groups = new Map<string, string[]>();
    lastRun?.failures.filter((f) => selectedIds.has(f.id)).forEach((f) => groups.set(f.error, [...(groups.get(f.error) ?? []), f.title]));
    return [...groups].map(([error, titles]) => ({ error, titles }));
  }, [lastRun, tasks]);

  return (
    <div className={`card ${styles.bar}`} role="region" aria-label={t('Actions for selected tasks')} aria-busy={busy !== null || undefined}>
      <div className={styles.row}>
        <span className={styles.count} aria-live="polite">
          {t('{count} selected', { count: formatNumber(count) })}
        </span>
        <div className={styles.fields}>
          <Select<TaskStatus | ''>
            aria-label={t('Change status')}
            className={styles.select}
            options={statusOptions}
            placeholder={t('Change status')}
            value={status}
            onChange={setStatus}
            disabled={busy !== null}
          />
          {canManage && (
            <>
              <Select<TaskPriority | ''>
                aria-label={t('Change priority')}
                className={styles.select}
                options={priorityOptions}
                placeholder={t('Change priority')}
                value={priority}
                onChange={setPriority}
                disabled={busy !== null}
              />
              <Select
                aria-label={t('Change assignee')}
                className={styles.select}
                options={assigneeOptions}
                placeholder={t('Change assignee')}
                value={assignee}
                onChange={setAssignee}
                disabled={busy !== null}
              />
            </>
          )}
          <Button size="sm" icon={Check} onClick={apply} disabled={!hasChange || busy === 'delete'} loading={busy === 'update'}>
            {t('Apply')}
          </Button>
        </div>
        <div className={styles.end}>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              className={styles.delete}
              onClick={remove}
              disabled={busy === 'update'}
              loading={busy === 'delete'}
            >
              {t('Delete')}
            </Button>
          )}
          <Button variant="ghost" size="sm" icon={X} onClick={onClear} disabled={busy !== null}>
            {t('Clear selection')}
          </Button>
        </div>
      </div>
      {lastRun && failureGroups.length > 0 && (
        <div className={styles.failures}>
          <p className={styles.summary}>
            <AlertCircle size={14} aria-hidden />
            <span>
              {lastRun.summary} {t('The tasks that failed are still selected.')}
            </span>
          </p>
          <ul className={styles.failureList}>
            {failureGroups.map((g) => (
              <li key={g.error}>
                <span className={styles.error}>{t(g.error)}</span>
                <span className={styles.titles}>{g.titles.join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
