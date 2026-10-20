'use client';

import type { FormEvent } from 'react';
import { AtSign, Building2, User } from 'lucide-react';
import { Field, FormError, Input } from '@/components/ui';
import { setupWorkspace } from '@/store';
import { useAuthForm } from '../hooks/useAuthForm';
import { validateSetup, type SetupValues } from '../utils';
import { AuthSubmitButton } from './AuthSubmitButton';
import { PasswordFields } from './PasswordFields';

const INITIAL: SetupValues = { companyName: '', name: '', email: '', password: '', confirmPassword: '' };

export function SetupForm() {
  const { values, errors, formError, submitting, setField, submit } = useAuthForm(INITIAL, validateSetup);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(
      (v) => setupWorkspace({ companyName: v.companyName, name: v.name, email: v.email, password: v.password }),
      { keepLoadingOnSuccess: true }
    );
  };

  return (
    <>
      <FormError message={formError} />
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <Field label="Company name" htmlFor="setup-company" error={errors.companyName}>
          <Input
            id="setup-company"
            icon={Building2}
            autoComplete="organization"
            placeholder="Your company"
            value={values.companyName}
            disabled={submitting}
            invalid={Boolean(errors.companyName)}
            onChange={(e) => setField('companyName', e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Your full name" htmlFor="setup-name" error={errors.name}>
          <Input
            id="setup-name"
            icon={User}
            autoComplete="name"
            value={values.name}
            disabled={submitting}
            invalid={Boolean(errors.name)}
            onChange={(e) => setField('name', e.target.value)}
          />
        </Field>
        <Field label="Work email" htmlFor="setup-email" error={errors.email}>
          <Input
            id="setup-email"
            type="email"
            inputMode="email"
            icon={AtSign}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@company.com"
            value={values.email}
            disabled={submitting}
            invalid={Boolean(errors.email)}
            onChange={(e) => setField('email', e.target.value)}
          />
        </Field>
        <PasswordFields idPrefix="setup" values={values} errors={errors} disabled={submitting} onChange={setField} />
        <AuthSubmitButton loading={submitting} loadingLabel="Creating workspace…">
          Create workspace
        </AuthSubmitButton>
      </form>
    </>
  );
}
