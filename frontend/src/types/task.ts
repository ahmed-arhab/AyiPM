import type { ApiSchema } from './api-schema';

export type TaskPriority = ApiSchema<'TaskPriority'>;
export type TaskStatus = ApiSchema<'TaskStatus'>;

export type TaskComment = ApiSchema<'Comment'>;

export type TaskHistoryEntry = ApiSchema<'HistoryEntry'>;

export type Task = ApiSchema<'TaskResponse'>;

export type TaskInput = Pick<Task, 'projectId' | 'title' | 'description' | 'priority' | 'status' | 'dueDate'> &
  Partial<Pick<Task, 'assigneeId'>>;

export type TaskUpdate = Partial<TaskInput>;
