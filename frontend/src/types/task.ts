export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done';

export interface TaskComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface TaskHistoryEntry {
  id: string;
  actorId: string;
  action: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  order: number;
  comments: TaskComment[];
  history: TaskHistoryEntry[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskInput = Pick<Task, 'projectId' | 'title' | 'description' | 'priority' | 'status' | 'dueDate'> &
  Partial<Pick<Task, 'assigneeId'>>;

export type TaskUpdate = Partial<TaskInput>;
