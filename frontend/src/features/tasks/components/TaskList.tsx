'use client';

import { useCallback, useMemo, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { DataTable, Pagination, StatusBadge, type Column, type RowSelection } from '@/components/ui';
import { canMoveTask, useAppStore, useCurrentUser, useEmployeesById, useFormatters, usePermission, useProjectsById } from '@/store';
import { usePagination } from '@/hooks/usePagination';
import { useRowSelection } from '@/hooks/useRowSelection';
import { formatRelativeTime } from '@/lib/date';
import { useT } from '@/translations';
import type { Task } from '@/types';
import { TaskAssignee } from './TaskAssignee';
import { TaskBulkBar } from './TaskBulkBar';
import { TaskDueDate } from './TaskDueDate';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  /** Changing it goes back to the first page. */
  resetKey?: string;
  /** Changing it clears the selection, e.g. when the filters or search change. */
  selectionKey?: string;
}

const PAGE_SIZE = 20;

export function TaskList({ tasks, onOpenTask, resetKey, selectionKey }: TaskListProps) {
  const { t } = useT();
  const projectsById = useProjectsById();
  const employeesById = useEmployeesById();
  const { date } = useFormatters();
  const { page, pageCount, pageItems, setPage, total, pageSize } = usePagination(tasks, PAGE_SIZE, resetKey);

  // Managers can change any task; everyone else can only change the status of tasks assigned to them (see TaskService),
  // so only those rows can be selected. People with no tasks of their own get no checkboxes at all.
  const user = useCurrentUser();
  const canManage = usePermission('tasks.manage');
  const hasOwnTasks = useAppStore((s) => s.tasks.some((task) => task.assigneeId === user.id));
  const selectionEnabled = canManage || hasOwnTasks;
  const canSelect = useCallback((task: Task) => canMoveTask(user, task), [user]);
  const { selected, setSelected, clear } = useRowSelection(selectionKey);
  // Selected tasks that are still in the list, so the count and actions never include tasks that have gone.
  const selectedTasks = useMemo(() => tasks.filter((task) => selected.has(task.id) && canSelect(task)), [tasks, selected, canSelect]);
  const selectedIds = useMemo(() => new Set(selectedTasks.map((task) => task.id)), [selectedTasks]);
  const listRef = useRef<HTMLDivElement>(null);

  // When the bar goes away, focus would be lost with it, so move it to the select-all checkbox instead.
  const keepFocusInList = useCallback(() => {
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active && active !== document.body && active.isConnected) return;
      listRef.current?.querySelector<HTMLInputElement>('thead input[type="checkbox"]')?.focus();
    });
  }, []);

  const clearSelection = useCallback(() => {
    clear();
    keepFocusInList();
  }, [clear, keepFocusInList]);

  // Tasks that failed stay selected, so they can be retried.
  const handleFinished = useCallback(
    (succeededIds: string[]) => {
      const done = new Set(succeededIds);
      setSelected((prev) => new Set([...prev].filter((id) => !done.has(id))));
      keepFocusInList();
    },
    [setSelected, keepFocusInList]
  );

  const selection = useMemo<RowSelection<Task> | undefined>(
    () =>
      selectionEnabled
        ? {
            selected: selectedIds,
            onChange: setSelected,
            canSelect,
            rowLabel: (task) => t('Select “{title}”', { title: task.title }),
            allLabel: t(canManage ? 'Select all tasks on this page' : 'Select all your tasks on this page'),
            disabledHint: t('You can only change tasks assigned to you.'),
          }
        : undefined,
    [selectionEnabled, selectedIds, setSelected, canSelect, canManage, t]
  );

  const columns = useMemo<Column<Task>[]>(
    () => [
      {
        key: 'task',
        header: 'Task',
        render: (t) => (
          <div className={styles.taskCell}>
            <button
              type="button"
              className={styles.title}
              onClick={(e) => {
                e.stopPropagation();
                onOpenTask(t.id);
              }}
            >
              {t.title}
            </button>
            <span className={styles.project}>{projectsById.get(t.projectId)?.name ?? 'Unknown project'}</span>
          </div>
        ),
      },
      {
        key: 'assignee',
        header: 'Assignee',
        width: '200px',
        render: (t) => <TaskAssignee assignee={t.assigneeId ? employeesById.get(t.assigneeId) : undefined} size={26} />,
      },
      { key: 'priority', header: 'Priority', width: '110px', render: (t) => <StatusBadge kind="priority" value={t.priority} /> },
      { key: 'status', header: 'Status', width: '130px', render: (t) => <StatusBadge kind="task" value={t.status} /> },
      {
        key: 'due',
        header: 'Due date',
        width: '200px',
        render: (t) => <TaskDueDate dueDate={t.dueDate} status={t.status} formatted={date(t.dueDate)} showHint />,
      },
      {
        key: 'comments',
        header: <MessageSquare size={14} aria-label="Comments" />,
        width: '60px',
        align: 'center',
        render: (t) => <span className={styles.muted}>{t.comments.length || '—'}</span>,
      },
      {
        key: 'updated',
        header: 'Updated',
        width: '110px',
        render: (t) => <span className={styles.muted}>{formatRelativeTime(t.updatedAt)}</span>,
      },
    ],
    [projectsById, employeesById, date, onOpenTask]
  );

  return (
    <div className={styles.list} ref={listRef}>
      {selectedTasks.length > 0 && (
        <TaskBulkBar tasks={selectedTasks} canManage={canManage} onClear={clearSelection} onFinished={handleFinished} />
      )}
      <DataTable
        columns={columns}
        rows={pageItems}
        rowKey={(t) => t.id}
        onRowClick={(t) => onOpenTask(t.id)}
        minWidth={980}
        caption="Tasks"
        selection={selection}
      />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}
