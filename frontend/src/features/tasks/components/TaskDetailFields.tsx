'use client';

import { useId, type ReactNode } from 'react';
import { StatusBadge } from '@/components/ui';
import { useEmployee, useFormatters } from '@/store';
import type { Task } from '@/types';
import { TaskAssignee } from './TaskAssignee';
import { TaskDueDate } from './TaskDueDate';
import { TaskStatusSelect } from './TaskStatusSelect';
import styles from './TaskDetailFields.module.css';

interface TaskDetailFieldsProps {
  task: Task;
  canChangeStatus: boolean;
}

function Item({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className={styles.item}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={styles.label}>
          {label}
        </label>
      ) : (
        <span className={styles.label}>{label}</span>
      )}
      <div className={styles.value}>{children}</div>
    </div>
  );
}

export function TaskDetailFields({ task, canChangeStatus }: TaskDetailFieldsProps) {
  const statusId = useId();
  const assignee = useEmployee(task.assigneeId);
  const creator = useEmployee(task.createdBy);
  const { date, dateTime } = useFormatters();

  return (
    <div className={styles.grid}>
      <Item label="Status" htmlFor={statusId}>
        <TaskStatusSelect id={statusId} task={task} disabled={!canChangeStatus} />
      </Item>
      <Item label="Priority">
        <StatusBadge kind="priority" value={task.priority} />
      </Item>
      <Item label="Assignee">
        <TaskAssignee assignee={assignee} size={28} detail />
      </Item>
      <Item label="Due date">
        <TaskDueDate dueDate={task.dueDate} status={task.status} formatted={date(task.dueDate)} showHint />
      </Item>
      <Item label="Created by">
        <TaskAssignee assignee={creator} size={28} emptyLabel="Former member" />
      </Item>
      <Item label="Created">
        <span className={styles.text}>{dateTime(task.createdAt)}</span>
      </Item>
    </div>
  );
}
