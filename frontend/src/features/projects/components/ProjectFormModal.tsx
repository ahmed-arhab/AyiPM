'use client';

import { useEffect, useId, useMemo, useRef, type FormEvent } from 'react';
import { Button, Field, FormError, FormGrid, Input, Modal, Select, Textarea } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { ROLE_LABELS } from '@/constants/roles';
import { selectActiveEmployees, useAppStore } from '@/store';
import type { Project } from '@/types';
import { useProjectForm } from '../hooks/useProjectForm';
import { PROJECT_STATUS_OPTIONS, isManagerRole } from '../utils';
import { MemberPicker } from './MemberPicker';
import styles from './ProjectFormModal.module.css';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  focusMembers?: boolean;
  onSaved?: (project: Project) => void;
}

export function ProjectFormModal({ isOpen, onClose, project, focusMembers, onSaved }: ProjectFormModalProps) {
  const formId = useId();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={project ? 'Edit project' : 'New project'}
      description={project ? 'Update details, timeline and team.' : 'Set up the project, its timeline and who is working on it.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <ProjectForm id={formId} project={project} focusMembers={focusMembers} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

interface ProjectFormProps {
  id: string;
  project?: Project;
  focusMembers?: boolean;
  onClose: () => void;
  onSaved?: (project: Project) => void;
}

function ProjectForm({ id, project, focusMembers, onClose, onSaved }: ProjectFormProps) {
  const toast = useToast();
  const activeEmployees = useAppStore((s) => selectActiveEmployees(s.employees));
  const { values, errors, formError, setField, submit } = useProjectForm(project);
  const membersRef = useRef<HTMLDivElement>(null);
  const memberSearchRef = useRef<HTMLInputElement>(null);

  const managerOptions = useMemo(
    () => activeEmployees.filter(isManagerRole).map((e) => ({ value: e.id, label: `${e.name} · ${ROLE_LABELS[e.role]}` })),
    [activeEmployees]
  );

  useEffect(() => {
    if (!focusMembers) return;
    const frame = requestAnimationFrame(() => {
      membersRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      memberSearchRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusMembers]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = submit();
    if (!result || !result.ok) return;
    toast.success(project ? 'Project updated' : `Project “${result.data.name}” created`);
    onSaved?.(result.data);
    onClose();
  };

  return (
    <form id={id} className={styles.form} onSubmit={handleSubmit} noValidate>
      <FormError message={formError} />
      <FormGrid columns={2}>
        <Field label="Project name" htmlFor={`${id}-name`} required error={errors.name}>
          <Input id={`${id}-name`} value={values.name} onChange={(e) => setField('name', e.target.value)} invalid={Boolean(errors.name)} placeholder="e.g. Customer portal revamp" />
        </Field>
        <Field label="Client" htmlFor={`${id}-client`} hint="Leave empty for internal projects">
          <Input id={`${id}-client`} value={values.client} onChange={(e) => setField('client', e.target.value)} placeholder="Client or department" />
        </Field>
      </FormGrid>
      <Field label="Description" htmlFor={`${id}-description`}>
        <Textarea id={`${id}-description`} value={values.description} onChange={(e) => setField('description', e.target.value)} placeholder="Goals, scope and key deliverables" />
      </Field>
      <FormGrid columns={3}>
        <Field label="Start date" htmlFor={`${id}-start`} required error={errors.startDate}>
          <Input id={`${id}-start`} type="date" value={values.startDate} onChange={(e) => setField('startDate', e.target.value)} invalid={Boolean(errors.startDate)} />
        </Field>
        <Field label="Deadline" htmlFor={`${id}-end`} required error={errors.endDate}>
          <Input id={`${id}-end`} type="date" min={values.startDate || undefined} value={values.endDate} onChange={(e) => setField('endDate', e.target.value)} invalid={Boolean(errors.endDate)} />
        </Field>
        <Field label="Status" htmlFor={`${id}-status`}>
          <Select id={`${id}-status`} options={PROJECT_STATUS_OPTIONS} value={values.status} onChange={(v) => setField('status', v)} />
        </Field>
      </FormGrid>
      <FormGrid columns={2}>
        <Field label="Project manager" htmlFor={`${id}-manager`} hint={managerOptions.length === 0 ? 'No active admins or project managers yet' : undefined}>
          <Select id={`${id}-manager`} options={managerOptions} value={values.managerId} onChange={(v) => setField('managerId', v)} placeholder="Unassigned" />
        </Field>
        <Field label="Budget" htmlFor={`${id}-budget`} hint="Optional, e.g. $25,000">
          <Input id={`${id}-budget`} value={values.budget} onChange={(e) => setField('budget', e.target.value)} placeholder="Optional" />
        </Field>
      </FormGrid>
      <div ref={membersRef}>
        <Field label="Team members">
          <MemberPicker ref={memberSearchRef} employees={activeEmployees} selected={values.members} onChange={(ids) => setField('members', ids)} />
        </Field>
      </div>
    </form>
  );
}
