'use client';

import { useMemo } from 'react';
import { ArrowUpDown, UserCheck, X } from 'lucide-react';
import { Button, SearchInput, Select, type SelectOption } from '@/components/ui';
import { useT } from '@/translations';
import { useEmployees, useProjects } from '@/store';
import { TASK_PRIORITY, TASK_PRIORITY_ORDER, TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/status';
import type { TaskPriority, TaskStatus } from '@/types';
import type { TaskFiltersApi } from '../hooks/useTaskFilters';
import { SORT_OPTIONS, UNASSIGNED, type TaskSort, type TaskView } from '../utils';
import styles from './TaskFiltersBar.module.css';

interface TaskFiltersBarProps {
  api: TaskFiltersApi;
  view: TaskView;
}

export function TaskFiltersBar({ api, view }: TaskFiltersBarProps) {
  const { t, formatNumber } = useT();
  const { filters, setFilter, reset, isFiltered, filteredTasks, totalCount } = api;
  const projects = useProjects();
  const employees = useEmployees();

  const priorityOptions = useMemo<SelectOption<TaskPriority>[]>(
    () => TASK_PRIORITY_ORDER.map((p) => ({ value: p, label: t(TASK_PRIORITY[p].label) })),
    [t]
  );
  const statusOptions = useMemo<SelectOption<TaskStatus>[]>(
    () => TASK_STATUS_ORDER.map((s) => ({ value: s, label: t(TASK_STATUS[s].label) })),
    [t]
  );
  const sortOptions = useMemo(
    () => SORT_OPTIONS.map((s) => ({ value: s.value, label: t(s.label) })),
    [t]
  );

  const projectOptions = useMemo<SelectOption[]>(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ value: p.id, label: p.name })),
    [projects]
  );
  const assigneeOptions = useMemo<SelectOption[]>(
    () => [
      { value: UNASSIGNED, label: t('Unassigned') },
      ...[...employees].sort((a, b) => a.name.localeCompare(b.name)).map((e) => ({ value: e.id, label: e.name })),
    ],
    [employees, t]
  );

  return (
    <div className={`card ${styles.bar}`}>
      <div className={styles.row}>
        <SearchInput
          className={styles.search}
          value={filters.query}
          onChange={(v) => setFilter('query', v)}
          placeholder={t('Search title, description or project…')}
          aria-label={t('Search tasks')}
        />
        <Button
          variant={filters.mine ? 'primary' : 'outline'}
          size="sm"
          icon={UserCheck}
          aria-pressed={filters.mine}
          onClick={() => setFilter('mine', !filters.mine)}
        >
          {t('My tasks')}
        </Button>
        {view === 'list' && (
          <label className={styles.sort}>
            <ArrowUpDown size={14} aria-hidden />
            <span className="sr-only">{t('Sort by')}</span>
            <Select<TaskSort> options={sortOptions} value={filters.sort} onChange={(v) => setFilter('sort', v)} />
          </label>
        )}
      </div>
      <div className={styles.row}>
        <Select
          aria-label={t('Projects')}
          className={styles.select}
          options={projectOptions}
          placeholder={t('All projects')}
          value={filters.projectId}
          onChange={(v) => setFilter('projectId', v)}
        />
        <Select
          aria-label={t('Assignee')}
          className={styles.select}
          options={assigneeOptions}
          placeholder={t('All assignees')}
          value={filters.assigneeId}
          onChange={(v) => setFilter('assigneeId', v)}
        />
        <Select<TaskPriority | ''>
          aria-label={t('Priority')}
          className={styles.select}
          options={priorityOptions}
          placeholder={t('All priorities')}
          value={filters.priority}
          onChange={(v) => setFilter('priority', v)}
        />
        <Select<TaskStatus | ''>
          aria-label={t('Status')}
          className={styles.select}
          options={statusOptions}
          placeholder={t('All statuses')}
          value={filters.status}
          onChange={(v) => setFilter('status', v)}
        />
        <span className={styles.summary} aria-live="polite">
          {isFiltered
            ? t('{count} of {total} tasks', {
                count: formatNumber(filteredTasks.length),
                total: formatNumber(totalCount),
              })
            : t(totalCount === 1 ? '{count} task' : '{count} tasks', {
                count: formatNumber(totalCount),
              })}
        </span>
        {isFiltered && (
          <Button variant="ghost" size="sm" icon={X} onClick={reset}>
            {t('Clear filters')}
          </Button>
        )}
      </div>
    </div>
  );
}
