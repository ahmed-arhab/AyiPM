'use client';

import { useId } from 'react';
import { Button, Field, FormError, FormGrid, Input, Modal, Select, Textarea, type SelectOption } from '@/components/ui';
import { TASK_PRIORITY, TASK_PRIORITY_ORDER, TASK_STATUS, TASK_STATUS_ORDER } from '@/constants/status';
import { toDateKey } from '@/lib/date';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import { useTaskForm } from '../hooks/useTaskForm';
import { useAssigneeOptions, useProjectOptions } from '../hooks/useTaskFormOptions';
import { TITLE_MAX_LENGTH } from '../utils';
import styles from './TaskFormModal.module.css';

const PRIORITY_OPTIONS: SelectOption<TaskPriority>[] = TASK_PRIORITY_ORDER.map((p) => ({ value: p, label: TASK_PRIORITY[p].label }));
const STATUS_OPTIONS: SelectOption<TaskStatus>[] = TASK_STATUS_ORDER.map((s) => ({ value: s, label: TASK_STATUS[s].label }));
const DESCRIPTION_MAX_LENGTH = 2000;

interface TaskFormModalProps {
  isOpen: boolean;
  task?: Task;
  defaultProjectId?: string;
  onClose: () => void;
  onSaved?: (task: Task) => void;
}

export function TaskFormModal({ isOpen, ...rest }: TaskFormModalProps) {
  if (!isOpen) return null;
  return <TaskFormDialog {...rest} />;
}

function TaskFormDialog({ task, defaultProjectId = '', onClose, onSaved }: Omit<TaskFormModalProps, 'isOpen'>) {
  const formId = useId();
  const { values, errors, serverError, saving, canSubmit, isNew, setField, touch, submit } = useTaskForm({
    task,
    defaultProjectId,
    onSaved: (saved) => (onSaved ? onSaved(saved) : onClose()),
  });
  const projectOptions = useProjectOptions();
  const assigneeOptions = useAssigneeOptions(values.projectId, task?.assigneeId);
  const ids = {
    title: `${formId}-title`,
    description: `${formId}-desc`,
    project: `${formId}-project`,
    assignee: `${formId}-assignee`,
    priority: `${formId}-priority`,
    status: `${formId}-status`,
    due: `${formId}-due`,
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={isNew ? 'Create task' : 'Edit task'}
      description={isNew ? 'Plan a deliverable, assign an owner and set a deadline.' : task?.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={!canSubmit} loading={saving}>
            {isNew ? 'Create task' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.form} onSubmit={submit} noValidate>
        <FormError message={serverError} />
        <Field label="Title" htmlFor={ids.title} required error={errors.title}>
          <Input
            id={ids.title}
            value={values.title}
            maxLength={TITLE_MAX_LENGTH}
            placeholder="e.g. Implement schema migration runner"
            invalid={Boolean(errors.title)}
            onChange={(e) => setField('title', e.target.value)}
            onBlur={() => touch('title')}
          />
        </Field>
        <Field
          label="Description"
          htmlFor={ids.description}
          hint="Acceptance criteria, links and notes."
          aside={
            <span aria-live="polite">
              {values.description.length}/{DESCRIPTION_MAX_LENGTH}
            </span>
          }
        >
          <Textarea
            id={ids.description}
            rows={4}
            value={values.description}
            placeholder="What does done look like?"
            onChange={(e) => setField('description', e.target.value)}
          />
        </Field>
        <FormGrid columns={2}>
          <Field label="Project" htmlFor={ids.project} required error={errors.projectId}>
            <Select
              id={ids.project}
              options={projectOptions}
              value={values.projectId}
              placeholder="Select a project"
              invalid={Boolean(errors.projectId)}
              onChange={(v) => setField('projectId', v)}
              onBlur={() => touch('projectId')}
            />
          </Field>
          <Field label="Assignee" htmlFor={ids.assignee} hint="Project members are listed first.">
            <Select id={ids.assignee} options={assigneeOptions} value={values.assigneeId} onChange={(v) => setField('assigneeId', v)} />
          </Field>
        </FormGrid>
        <FormGrid columns={3}>
          <Field label="Priority" htmlFor={ids.priority}>
            <Select id={ids.priority} options={PRIORITY_OPTIONS} value={values.priority} onChange={(v) => setField('priority', v)} />
          </Field>
          <Field label="Status" htmlFor={ids.status}>
            <Select id={ids.status} options={STATUS_OPTIONS} value={values.status} onChange={(v) => setField('status', v)} />
          </Field>
          <Field label="Due date" htmlFor={ids.due} required error={errors.dueDate}>
            <Input
              id={ids.due}
              type="date"
              value={values.dueDate}
              min={isNew ? toDateKey() : undefined}
              invalid={Boolean(errors.dueDate)}
              onChange={(e) => {
                setField('dueDate', e.target.value);
                touch('dueDate');
              }}
              onBlur={() => touch('dueDate')}
            />
          </Field>
        </FormGrid>
      </form>
    </Modal>
  );
}
