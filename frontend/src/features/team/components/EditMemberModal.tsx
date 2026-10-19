'use client';

import { useId, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { setEmployeeRole, updateEmployee, useCurrentUser } from '@/store';
import { Button, FormError, Modal } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { hasErrors } from '@/lib/validation';
import type { Employee } from '@/types';
import { useMemberForm } from '../hooks/useMemberForm';
import { memberFormFromEmployee, validateMemberForm } from '../utils';
import { MemberFormFields } from './MemberFormFields';
import styles from './EditMemberModal.module.css';

interface EditMemberModalProps {
  member: Employee;
  departments: string[];
  onClose: () => void;
}

export function EditMemberModal({ member, departments, onClose }: EditMemberModalProps) {
  const formId = useId();
  const toast = useToast();
  const currentUser = useCurrentUser();
  const isSelf = currentUser.id === member.id;
  const form = useMemberForm(() => memberFormFromEmployee(member));

  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateMemberForm(form.values, true);
    form.setErrors(errors);
    if (hasErrors(errors)) return;

    const { role, ...fields } = form.values;
    setSaving(true);
    if (!isSelf && role !== member.role) {
      const roleResult = await setEmployeeRole(member.id, role);
      if (!roleResult.ok) {
        setSaving(false);
        form.setFormError(roleResult.error);
        return;
      }
    }
    const result = await updateEmployee(member.id, {
      ...fields,
      phone: fields.phone.trim(),
      location: fields.location.trim(),
      designation: fields.designation.trim(),
      name: fields.name.trim(),
      joinDate: fields.joinDate || member.joinDate,
    });
    setSaving(false);
    if (!result.ok) {
      form.setFormError(result.error);
      return;
    }
    toast.success(`Saved changes to ${result.data.name}.`);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Edit ${member.name}`}
      description="Update profile details, contact information and role."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} icon={Save} loading={saving}>
            Save changes
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
          employeeIdRequired
          roleLocked={isSelf}
        />
      </form>
    </Modal>
  );
}
