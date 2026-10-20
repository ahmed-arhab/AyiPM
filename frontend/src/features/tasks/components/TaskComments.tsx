'use client';

import { useState, type FormEvent } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Avatar, Button, EmptyState, Input } from '@/components/ui';
import { addTaskComment, useEmployeesById } from '@/store';
import { useToast } from '@/components/feedback/ToastProvider';
import { useNow } from '@/hooks/useNow';
import { formatRelativeTime } from '@/lib/date';
import type { TaskComment } from '@/types';
import styles from './TaskComments.module.css';

interface TaskCommentsProps {
  taskId: string;
  comments: TaskComment[];
}

export function TaskComments({ taskId, comments }: TaskCommentsProps) {
  const employeesById = useEmployeesById();
  const toast = useToast();
  const now = useNow(60_000);
  const [text, setText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = addTaskComment(taskId, text);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setText('');
  };

  return (
    <div className={styles.wrap}>
      {comments.length === 0 ? (
        <EmptyState
          compact
          icon={MessageSquare}
          title="No comments yet"
          description="Share progress, blockers or questions with the team."
        />
      ) : (
        <ul className={styles.list}>
          {comments.map((c) => {
            const author = employeesById.get(c.authorId);
            const name = author?.name ?? 'Former member';
            return (
              <li key={c.id} className={styles.comment}>
                <Avatar name={name} src={author?.avatar} size={30} />
                <div className={styles.bubble}>
                  <div className={styles.meta}>
                    <span className={styles.author}>{name}</span>
                    <time className={styles.time} dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString()}>
                      {formatRelativeTime(c.createdAt, now)}
                    </time>
                  </div>
                  <p className={styles.text}>{c.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment or progress note…"
          aria-label="New comment"
          maxLength={1000}
        />
        <Button type="submit" size="sm" icon={Send} disabled={!text.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
