'use client';

import { useId, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { addEmployee, generateEmployeeId } from '@/store';
import { Button, FormError, Modal } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { hasErrors } from '@/lib/validation';
import { ROUTES } from '@/constants/navigation';
import type { AccessLink, Employee } from '@/types';
import { useMemberForm } from '../hooks/useMemberForm';
import { emptyMemberForm, toEmployeeInput, validateMemberForm } from '../utils';
import { AccessLinkCard } from './AccessLinkCard';
import { MemberFormFields } from './MemberFormFields';
import styles from './AddMemberModal.module.css';

interface AddMemberModalProps {
  departments: string[];
  onClose: () => void;
}

export function AddMemberModal({ departments, onClose }: AddMemberModalProps) {
  const formId = useId();
  const toast = useToast();
  const form = useMemberForm(emptyMemberForm);
  const [suggestedId] = useState(generateEmployeeId);
  const [created, setCreated] = useState<{ employee: Employee; invite: AccessLink } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateMemberForm(form.values);
    form.setErrors(errors);
    if (hasErrors(errors)) return;

    setSubmitting(true);
    const result = await addEmployee(toEmployeeInput(form.values));
    setSubmitting(false);
    if (!result.ok) {
      form.setFormError(result.error);
      return;
    }
    toast.success(`Invitation created for ${result.data.employee.name}.`);
    setCreated(result.data);
  };

  if (created) {
    return (
      <Modal isOpen onClose={onClose} title="Invitation created" size="md" footer={<Button onClick={onClose}>Done</Button>}>
        <AccessLinkCard
          title={`Invite ${created.employee.name}`}
          description="They open this link, choose their own password and land in the workspace. They show as Invited until then."
          path={ROUTES.acceptInvite}
          link={created.invite}
          details={[
            { label: 'Employee ID', value: created.employee.employeeId },
            { label: 'Email', value: created.employee.email },
          ]}
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add team member"
      description="Add their details and we'll create an invitation link. They set their own password when they accept."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} icon={Send} loading={submitting}>
            Create invitation
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className={styles.form} noValidate>
        <FormError message={form.formError} />
        <MemberFormFields
          values={form.values}
          errors={form.errors}
          onChange={form.setField}
          departments={departments}
          employeeIdPlaceholder={suggestedId}
        />
      </form>
    </Modal>
  );
}
