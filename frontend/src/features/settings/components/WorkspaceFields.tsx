'use client';

import { useId, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Field, FormGrid, Input, Select, Switch } from '@/components/ui';
import { TIMEZONES } from '@/constants/defaults';
import { ROUTES } from '@/constants/navigation';
import { graceDeadlineLabel } from '@/lib/date';
import type { FieldErrors } from '@/lib/validation';
import { useTwoFactorStatus } from '@/store';
import { useT } from '@/translations';
import type { WorkspaceFormValues } from '../utils';
import styles from './WorkspaceFields.module.css';

interface FieldsProps {
  values: WorkspaceFormValues;
  errors: FieldErrors<WorkspaceFormValues>;
  setField: <K extends keyof WorkspaceFormValues>(field: K, value: WorkspaceFormValues[K]) => void;
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{title}</legend>
      {children}
    </fieldset>
  );
}

export function GeneralFields({ values, errors, setField }: FieldsProps) {
  const id = useId();
  const timezoneOptions = useMemo(() => {
    const zones = TIMEZONES.includes(values.timezone) || !values.timezone ? TIMEZONES : [values.timezone, ...TIMEZONES];
    return zones.map((zone) => ({ value: zone, label: zone.replace(/_/g, ' ') }));
  }, [values.timezone]);

  return (
    <FieldGroup title="Company">
      <FormGrid columns={3}>
        <Field label="Company name" htmlFor={`${id}-company`} required error={errors.companyName}>
          <Input id={`${id}-company`} value={values.companyName} onChange={(e) => setField('companyName', e.target.value)} invalid={Boolean(errors.companyName)} />
        </Field>
        <Field label="Timezone" htmlFor={`${id}-tz`} required error={errors.timezone}>
          <Select id={`${id}-tz`} options={timezoneOptions} value={values.timezone} onChange={(v) => setField('timezone', v)} invalid={Boolean(errors.timezone)} />
        </Field>
        <Field label="Employee ID prefix" htmlFor={`${id}-prefix`} required error={errors.employeeIdPrefix} hint="New IDs look like PREFIX001.">
          <Input
            id={`${id}-prefix`}
            value={values.employeeIdPrefix}
            maxLength={5}
            onChange={(e) => setField('employeeIdPrefix', e.target.value.toUpperCase())}
            invalid={Boolean(errors.employeeIdPrefix)}
          />
        </Field>
      </FormGrid>
    </FieldGroup>
  );
}

export function AttendanceFields({ values, errors, setField }: FieldsProps) {
  const id = useId();
  const grace = Number(values.gracePeriodMinutes);
  const lateAfter =
    /^\d{2}:\d{2}$/.test(values.workDayStart) && Number.isInteger(grace) && grace >= 0 ? graceDeadlineLabel(values.workDayStart, grace) : null;

  return (
    <FieldGroup title="Attendance">
      <FormGrid columns={3}>
        <Field label="Work day starts" htmlFor={`${id}-start`} required error={errors.workDayStart}>
          <Input id={`${id}-start`} type="time" value={values.workDayStart} onChange={(e) => setField('workDayStart', e.target.value)} invalid={Boolean(errors.workDayStart)} />
        </Field>
        <Field label="Grace period (minutes)" htmlFor={`${id}-grace`} required error={errors.gracePeriodMinutes}>
          <Input
            id={`${id}-grace`}
            type="number"
            min={0}
            max={180}
            step={1}
            value={values.gracePeriodMinutes}
            onChange={(e) => setField('gracePeriodMinutes', e.target.value)}
            invalid={Boolean(errors.gracePeriodMinutes)}
          />
        </Field>
        <Field label="Half-day threshold (hours)" htmlFor={`${id}-half`} required error={errors.halfDayThresholdHours} hint="Shorter days count as half days.">
          <Input
            id={`${id}-half`}
            type="number"
            min={0.5}
            max={12}
            step={0.5}
            value={values.halfDayThresholdHours}
            onChange={(e) => setField('halfDayThresholdHours', e.target.value)}
            invalid={Boolean(errors.halfDayThresholdHours)}
          />
        </Field>
      </FormGrid>
      {lateAfter && (
        <p className={styles.callout}>
          <Clock size={14} />
          Check-ins after <strong>{lateAfter}</strong> are marked late.
        </p>
      )}
    </FieldGroup>
  );
}

const LEAVE_FIELDS = [
  { key: 'annual', label: 'Annual leave (days)' },
  { key: 'sick', label: 'Sick leave (days)' },
  { key: 'casual', label: 'Casual leave (days)' },
] as const;

export function LeaveFields({ values, errors, setField }: FieldsProps) {
  const id = useId();
  return (
    <FieldGroup title="Yearly leave allowance">
      <FormGrid columns={3}>
        {LEAVE_FIELDS.map(({ key, label }) => (
          <Field key={key} label={label} htmlFor={`${id}-${key}`} required error={errors[key]}>
            <Input
              id={`${id}-${key}`}
              type="number"
              min={0}
              max={365}
              step={1}
              value={values[key]}
              onChange={(e) => setField(key, e.target.value)}
              invalid={Boolean(errors[key])}
            />
          </Field>
        ))}
      </FormGrid>
    </FieldGroup>
  );
}

export function SecurityFields({ values, setField }: FieldsProps) {
  const t = useT();
  const twoFactor = useTwoFactorStatus();
  const available = twoFactor?.available ?? false;
  const ownEnabled = twoFactor?.enabled ?? false;
  // The server refuses too; this explains why before anyone tries.
  const canRequire = available && ownEnabled;

  let hint: ReactNode = t('Admins without it are signed out, and set it up the next time they sign in.');
  if (!available) {
    hint = t("Two-factor authentication isn't set up on this server yet.");
  } else if (!ownEnabled && !values.requireAdminTwoFactor) {
    hint = (
      <>
        {t('Turn on two-factor authentication for your own account first.')}{' '}
        <Link href={ROUTES.profile} className={styles.link}>
          {t('Go to My Profile')}
        </Link>
      </>
    );
  }

  return (
    <FieldGroup title={t('Security')}>
      <Switch
        checked={values.requireAdminTwoFactor}
        onChange={(checked) => setField('requireAdminTwoFactor', checked)}
        label={t('Require two-factor authentication for admins')}
        description={hint}
        disabled={!values.requireAdminTwoFactor && !canRequire}
      />
    </FieldGroup>
  );
}
