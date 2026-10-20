'use client';

import { useMemo } from 'react';
import { CheckSquare, ListTodo, Plus } from 'lucide-react';
import { Button, Card, CardHeader, EmptyState } from '@/components/ui';
import { TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/status';
import { useEmployeesById, useFormatters, usePermission } from '@/store';
import type { Task } from '@/types';
import { groupTasksByStatus } from '../utils';
import { TaskRow } from './TaskRow';
import styles from './ProjectTasksCard.module.css';

interface ProjectTasksCardProps {
  projectId: string;
  tasks: Task[];
  onSwitchToTodo?: () => void;
  onOpenTask?: (taskId: string) => void;
  onCreateTask?: () => void;
}

export function ProjectTasksCard({
  tasks,
  onSwitchToTodo,
  onOpenTask,
  onCreateTask,
}: ProjectTasksCardProps) {
  const canManageTasks = usePermission('tasks.manage');
  const employeesById = useEmployeesById();
  const { date } = useFormatters();

  // Group tasks by status and sort by due date ascending
  const groups = useMemo(() => {
    const rawGroups = groupTasksByStatus(tasks);
    TASK_STATUS_ORDER.forEach((status) => {
      rawGroups[status]?.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
    });
    return rawGroups;
  }, [tasks]);

  const actions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {onSwitchToTodo && tasks.length > 0 && (
        <Button variant="outline" size="sm" icon={ListTodo} onClick={onSwitchToTodo}>
          View to-do list
        </Button>
      )}
      {canManageTasks && onCreateTask && (
        <Button size="sm" icon={Plus} onClick={onCreateTask}>
          Add task
        </Button>
      )}
    </div>
  );

  return (
    <Card as="section">
      <CardHeader
        icon={CheckSquare}
        title="Tasks Overview"
        description={`${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} in this project (sorted by due date)`}
        actions={actions}
      />
      {tasks.length === 0 ? (
        <EmptyState
          compact
          icon={CheckSquare}
          title="No tasks yet"
          description={canManageTasks ? 'Break the project down into tasks to start tracking progress.' : 'Tasks will appear here once they are created.'}
          action={
            canManageTasks && onCreateTask && (
              <Button size="sm" icon={Plus} onClick={onCreateTask}>
                Add task
              </Button>
            )
          }
        />
      ) : (
        <div className={styles.groups}>
          {TASK_STATUS_ORDER.map((status) =>
            groups[status].length === 0 ? null : (
              <div key={status} className={styles.group}>
                <h3 className={styles.groupTitle}>
                  <span className={styles.dot} style={{ background: TASK_STATUS[status].color }} aria-hidden />
                  {TASK_STATUS[status].label}
                  <span className={styles.groupCount}>{groups[status].length}</span>
                </h3>
                <div className={styles.rows}>
                  {groups[status].map((task) => (
                    <div
                      key={task.id}
                      onClick={onOpenTask ? () => onOpenTask(task.id) : undefined}
                      style={{ cursor: onOpenTask ? 'pointer' : 'default' }}
                    >
                      <TaskRow
                        task={task}
                        assignee={task.assigneeId ? employeesById.get(task.assigneeId) : undefined}
                        formatDate={date}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </Card>
  );
}
