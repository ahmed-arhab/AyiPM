import { AtSign } from 'lucide-react';
import { Field, Input } from '@/components/ui';
import { AuthSubmitButton } from './AuthSubmitButton';

interface LoginIdentifierStepProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function LoginIdentifierStep({ value, error, onChange }: LoginIdentifierStepProps) {
  const hasEnteredEmail = value.trim().length > 0;

  return (
    <>
      <Field label="Work email" htmlFor="login-identifier" error={error}>
        <Input
          id="login-identifier"
          name="username"
          type="email"
          inputMode="email"
          icon={AtSign}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="name@company.com"
          value={value}
          invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      </Field>
      <AuthSubmitButton
        loading={false}
        loadingLabel="Continue"
        animateArrow={hasEnteredEmail}
      >
        Continue
      </AuthSubmitButton>
    </>
  );
}

