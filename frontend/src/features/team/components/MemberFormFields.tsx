import { useId, useMemo } from 'react';
import { Field, FormGrid, Input, Select, type SelectOption } from '@/components/ui';
import { ROLE_OPTIONS } from '@/constants/roles';
import type { FieldErrors } from '@/lib/validation';
import type { UserRole } from '@/types';
import type { MemberFormValues } from '../utils';

interface MemberFormFieldsProps {
  values: MemberFormValues;
  errors: FieldErrors<MemberFormValues>;
  onChange: <K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) => void;
  departments: string[];
  employeeIdPlaceholder?: string;
  employeeIdRequired?: boolean;
  roleLocked?: boolean;
}

export function MemberFormFields({
  values,
  errors,
  onChange,
  departments,
  employeeIdPlaceholder,
  employeeIdRequired,
  roleLocked,
}: MemberFormFieldsProps) {
  const id = useId();
  const departmentOptions = useMemo<SelectOption[]>(() => departments.map((d) => ({ value: d, label: d })), [departments]);

  return (
    <FormGrid columns={2}>
      <Field label="Full name" htmlFor={`${id}-name`} required error={errors.name}>
        <Input id={`${id}-name`} value={values.name} invalid={!!errors.name} onChange={(e) => onChange('name', e.target.value)} autoComplete="off" />
      </Field>
      <Field label="Work email" htmlFor={`${id}-email`} required error={errors.email}>
        <Input
          id={`${id}-email`}
          type="email"
          value={values.email}
          invalid={!!errors.email}
          onChange={(e) => onChange('email', e.target.value)}
          autoComplete="off"
        />
      </Field>
      <Field
        label="Employee ID"
        htmlFor={`${id}-badge`}
        required={employeeIdRequired}
        error={errors.employeeId}
        hint={employeeIdRequired ? undefined : 'Leave blank to generate one automatically.'}
      >
        <Input
          id={`${id}-badge`}
          value={values.employeeId}
          placeholder={employeeIdPlaceholder}
          invalid={!!errors.employeeId}
          onChange={(e) => onChange('employeeId', e.target.value.toUpperCase())}
        />
      </Field>
      <Field label="Department" htmlFor={`${id}-dept`} required error={errors.department}>
        <Select id={`${id}-dept`} options={departmentOptions} value={values.department} onChange={(v) => onChange('department', v)} />
      </Field>
      <Field label="Designation" htmlFor={`${id}-designation`} required error={errors.designation}>
        <Input
          id={`${id}-designation`}
          value={values.designation}
          placeholder="e.g. Frontend Engineer"
          invalid={!!errors.designation}
          onChange={(e) => onChange('designation', e.target.value)}
        />
      </Field>
      <Field label="Role" htmlFor={`${id}-role`} hint={roleLocked ? 'You cannot change your own role.' : undefined}>
        <Select<UserRole> id={`${id}-role`} options={ROLE_OPTIONS} value={values.role} disabled={roleLocked} onChange={(v) => onChange('role', v)} />
      </Field>
      <Field label="Phone" htmlFor={`${id}-phone`}>
        <Input id={`${id}-phone`} type="tel" value={values.phone} onChange={(e) => onChange('phone', e.target.value)} />
      </Field>
      <Field label="Location" htmlFor={`${id}-location`}>
        <Input id={`${id}-location`} value={values.location} placeholder="City or Remote" onChange={(e) => onChange('location', e.target.value)} />
      </Field>
      <Field label="Join date" htmlFor={`${id}-join`}>
        <Input id={`${id}-join`} type="date" value={values.joinDate} onChange={(e) => onChange('joinDate', e.target.value)} />
      </Field>
    </FormGrid>
  );
}
