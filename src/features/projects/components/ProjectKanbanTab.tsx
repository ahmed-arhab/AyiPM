'use client';

import { Columns3, Plus } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import { KanbanBoard } from '@/features/tasks/components/KanbanBoard';
import type { Task } from '@/types';
import styles from './ProjectKanbanTab.module.css';

interface ProjectKanbanTabProps {
  tasks: Task[];
  canManage: boolean;
  onOpenTask: (taskId: string) => void;
  onCreateTask: () => void;
}

export function ProjectKanbanTab({
  tasks,
  canManage,
  onOpenTask,
  onCreateTask,
}: ProjectKanbanTabProps) {
  if (tasks.length === 0) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <EmptyState
          icon={Columns3}
          title="No tasks on the board yet"
          description="Create tasks for this project to visualize workflow across columns."
          action={
            canManage && (
              <Button icon={Plus} onClick={onCreateTask}>
                Add task
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Kanban Workflow</h2>
          <span className={styles.description}>Drag and drop cards across columns to update task progress.</span>
        </div>
        {canManage && (
          <Button icon={Plus} size="sm" onClick={onCreateTask}>
            New task
          </Button>
        )}
      </div>

      <div className={styles.boardWrap}>
        <KanbanBoard tasks={tasks} onOpenTask={onOpenTask} />
      </div>
    </div>
  );
}
