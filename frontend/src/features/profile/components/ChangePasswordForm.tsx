'use client';

import { useId } from 'react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { Button, Card, CardHeader, Field, FormGrid, PasswordInput } from '@/components/ui';
import { usePasswordForm } from '../hooks/usePasswordForm';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import styles from './ChangePasswordForm.module.css';

export function ChangePasswordForm({ username }: { username: string }) {
  const { values, errors, submitting, filled, setField, reset, submit } = usePasswordForm();
  const id = useId();

  return (
    <Card as="section" aria-labelledby={`${id}-title`}>
      <CardHeader
        icon={ShieldCheck}
        title={<span id={`${id}-title`}>Change password</span>}
        description="Use a strong password you don't use anywhere else."
      />
      <form className={styles.form} onSubmit={submit} noValidate>
        <input type="text" name="username" autoComplete="username" value={username} readOnly className="sr-only" tabIndex={-1} aria-hidden />
        <Field label="Current password" htmlFor={`${id}-current`} required error={errors.current}>
          <PasswordInput
            id={`${id}-current`}
            icon={Lock}
            value={values.current}
            onChange={(e) => setField('current', e.target.value)}
            invalid={Boolean(errors.current)}
            autoComplete="current-password"
          />
        </Field>
        <FormGrid>
          <Field label="New password" htmlFor={`${id}-next`} required error={errors.next}>
            <PasswordInput
              id={`${id}-next`}
              icon={KeyRound}
              value={values.next}
              onChange={(e) => setField('next', e.target.value)}
              invalid={Boolean(errors.next)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password" htmlFor={`${id}-confirm`} required error={errors.confirm}>
            <PasswordInput
              id={`${id}-confirm`}
              icon={KeyRound}
              value={values.confirm}
              onChange={(e) => setField('confirm', e.target.value)}
              invalid={Boolean(errors.confirm)}
              autoComplete="new-password"
            />
          </Field>
        </FormGrid>
        <PasswordStrengthMeter value={values.next} />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={reset} disabled={!filled || submitting}>
            Clear
          </Button>
          <Button type="submit" icon={ShieldCheck} loading={submitting} disabled={!filled}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
