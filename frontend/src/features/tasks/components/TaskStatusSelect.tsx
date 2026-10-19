'use client';

import { Select, type SelectOption } from '@/components/ui';
import { updateTask } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/status';
import type { Task, TaskStatus } from '@/types';

const OPTIONS: SelectOption<TaskStatus>[] = TASK_STATUS_ORDER.map((s) => ({ value: s, label: TASK_STATUS[s].label }));

interface TaskStatusSelectProps {
  task: Task;
  disabled?: boolean;
  id?: string;
}

export function TaskStatusSelect({ task, disabled, id }: TaskStatusSelectProps) {
  const toast = useToast();

  const handleChange = (status: TaskStatus) => {
    if (status === task.status) return;
    const result = updateTask(task.id, { status });
    if (result.ok) toast.success(`Moved to ${TASK_STATUS[status].label}.`);
    else toast.error(result.error);
  };

  return (
    <Select
      id={id}
      options={OPTIONS}
      value={task.status}
      onChange={handleChange}
      disabled={disabled}
      title={disabled ? 'Only managers or the assignee can change the status' : undefined}
    />
  );
}
