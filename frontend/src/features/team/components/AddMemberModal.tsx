'use client';

import { useId, useState, type FormEvent } from 'react';
import { CheckCircle2, ShieldCheck, UserPlus } from 'lucide-react';
import { addEmployee, generateEmployeeId } from '@/store';
import { Button, FormError, Modal } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { hasErrors } from '@/lib/validation';
import { ROUTES } from '@/constants/navigation';
import { ROLE_LABELS } from '@/constants/roles';
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
  const [created, setCreated] = useState<{ employee: Employee; invite?: AccessLink | null } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateMemberForm(form.values, { requirePassword: true });
    form.setErrors(errors);
    if (hasErrors(errors)) return;

    setSubmitting(true);
    const result = await addEmployee(toEmployeeInput(form.values));
    setSubmitting(false);
    if (!result.ok) {
      form.setFormError(result.error);
      return;
    }
    toast.success(`Account created for ${result.data.employee.name}.`);
    setCreated(result.data);
  };

  if (created) {
    if (created.invite) {
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
      <Modal isOpen onClose={onClose} title="Team member added" size="md" footer={<Button onClick={onClose}>Done</Button>}>
        <div className={styles.successCard}>
          <div className={styles.successHead}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className={styles.successTitle}>Account created for {created.employee.name}</div>
              <div className={styles.successDesc}>
                This member can now log in to the dashboard using the work email and password you set.
              </div>
            </div>
          </div>

          <dl className={styles.detailsList}>
            <div className={styles.detailRow}>
              <dt>Employee ID</dt>
              <dd>{created.employee.employeeId}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Work email</dt>
              <dd>{created.employee.email}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Department</dt>
              <dd>{created.employee.department}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Designation</dt>
              <dd>{created.employee.designation}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Role</dt>
              <dd>{ROLE_LABELS[created.employee.role]}</dd>
            </div>
          </dl>

          <div className={styles.readyNotice}>
            <ShieldCheck size={18} />
            <span>Login credentials are active. Access to the dashboard is enabled upon entering correct credentials.</span>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add team member"
      description="Enter the member's details and set their login password. They will use these credentials to access the dashboard."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} icon={UserPlus} loading={submitting}>
            Add member
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
          showPassword
        />
      </form>
    </Modal>
  );
}
