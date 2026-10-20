'use client';

import { useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { DataTable, Pagination, StatusBadge, type Column } from '@/components/ui';
import { useEmployeesById, useFormatters, useProjectsById } from '@/store';
import { usePagination } from '@/hooks/usePagination';
import { formatRelativeTime } from '@/lib/date';
import type { Task } from '@/types';
import { TaskAssignee } from './TaskAssignee';
import { TaskDueDate } from './TaskDueDate';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  resetKey?: string;
}

const PAGE_SIZE = 20;

export function TaskList({ tasks, onOpenTask, resetKey }: TaskListProps) {
  const projectsById = useProjectsById();
  const employeesById = useEmployeesById();
  const { date } = useFormatters();
  const { page, pageCount, pageItems, setPage, total, pageSize } = usePagination(tasks, PAGE_SIZE, resetKey);

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
    <div className={styles.list}>
      <DataTable
        columns={columns}
        rows={pageItems}
        rowKey={(t) => t.id}
        onRowClick={(t) => onOpenTask(t.id)}
        minWidth={980}
        caption="Tasks"
      />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}
