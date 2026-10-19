'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderKanban, History, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { Button, Modal, SegmentedControl, StatusBadge, type SegmentOption } from '@/components/ui';
import { canMoveTask, deleteTask, useAppStore, useCurrentUser, usePermission } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { ROUTES } from '@/constants/navigation';
import type { Task } from '@/types';
import { TaskComments } from './TaskComments';
import { TaskDetailFields } from './TaskDetailFields';
import { TaskHistory } from './TaskHistory';
import styles from './TaskDetailModal.module.css';

type ActivityTab = 'comments' | 'history';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
  onEdit: (taskId: string) => void;
}

export function TaskDetailModal({ taskId, onClose, onEdit }: TaskDetailModalProps) {
  const task = useAppStore((s) => (taskId ? s.tasks.find((t) => t.id === taskId) : undefined));
  if (!task) return null;
  return <TaskDetailDialog task={task} onClose={onClose} onEdit={onEdit} />;
}

function TaskDetailDialog({ task, onClose, onEdit }: { task: Task } & Omit<TaskDetailModalProps, 'taskId'>) {
  const user = useCurrentUser();
  const canManage = usePermission('tasks.manage');
  const projectName = useAppStore((s) => s.projects.find((p) => p.id === task.projectId)?.name);
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<ActivityTab>('comments');

  const tabs: SegmentOption<ActivityTab>[] = [
    { value: 'comments', label: 'Comments', icon: MessageSquare, count: task.comments.length },
    { value: 'history', label: 'History', icon: History, count: task.history.length },
  ];

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete task?',
      message: `"${task.title}" and its comments will be permanently removed.`,
      confirmLabel: 'Delete task',
      tone: 'danger',
    });
    if (!confirmed) return;
    const result = deleteTask(task.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Task deleted.');
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={task.title}
      description={
        <span className={styles.subtitle}>
          <Link href={ROUTES.project(task.projectId)} className={`link ${styles.project}`}>
            <FolderKanban size={14} aria-hidden />
            {projectName ?? 'Unknown project'}
          </Link>
          <StatusBadge kind="task" value={task.status} />
        </span>
      }
      footer={
        canManage ? (
          <>
            <Button variant="ghost" icon={Trash2} className={styles.delete} onClick={handleDelete}>
              Delete
            </Button>
            <Button variant="secondary" icon={Pencil} onClick={() => onEdit(task.id)}>
              Edit task
            </Button>
          </>
        ) : undefined
      }
    >
      <div className={styles.body}>
        <TaskDetailFields task={task} canChangeStatus={canMoveTask(user, task)} />
        <section className={styles.section}>
          <h3 className={styles.heading}>Description</h3>
          {task.description ? (
            <p className={styles.description}>{task.description}</p>
          ) : (
            <p className="text-muted">No description provided.</p>
          )}
        </section>
        <section className={styles.section}>
          <SegmentedControl label="Task activity" size="sm" options={tabs} value={tab} onChange={setTab} />
          {tab === 'comments' ? <TaskComments taskId={task.id} comments={task.comments} /> : <TaskHistory history={task.history} />}
        </section>
      </div>
    </Modal>
  );
}
