import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Field, PasswordInput } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { AuthSubmitButton } from './AuthSubmitButton';
import { useT } from '@/translations';
import styles from './LoginPasswordStep.module.css';

interface LoginPasswordStepProps {
  identifier: string;
  password: string;
  remember: boolean;
  error?: string;
  submitting: boolean;
  onPasswordChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onChangeIdentifier: () => void;
}

export function LoginPasswordStep({
  identifier,
  password,
  remember,
  error,
  submitting,
  onPasswordChange,
  onRememberChange,
  onChangeIdentifier,
}: LoginPasswordStepProps) {
  const t = useT();

  return (
    <>
      <div className={styles.identity}>
        <span className={styles.identifier} title={identifier}>
          {identifier}
        </span>
        <button type="button" className={styles.change} onClick={onChangeIdentifier} disabled={submitting}>
          {t('Change')}
        </button>
      </div>
      <input type="text" name="username" autoComplete="username" value={identifier} readOnly hidden />
      <Field label={t('Password')} htmlFor="login-password" error={error}>
        <PasswordInput
          id="login-password"
          name="password"
          icon={Lock}
          autoComplete="current-password"
          placeholder={t('Enter your password')}
          value={password}
          disabled={submitting}
          invalid={Boolean(error)}
          onChange={(e) => onPasswordChange(e.target.value)}
          autoFocus
        />
      </Field>
      <div className={styles.row}>
        <label className="auth-checkbox-wrap">
          <input type="checkbox" className="auth-checkbox" checked={remember} disabled={submitting} onChange={(e) => onRememberChange(e.target.checked)} />
          <span className="auth-checkbox-label">{t('Keep me signed in')}</span>
        </label>
        <Link href={ROUTES.forgotPassword} className="auth-link">
          {t("Can't log in?")}
        </Link>
      </div>
      <AuthSubmitButton loading={submitting} loadingLabel={t('Signing in…')}>
        {t('Log in')}
      </AuthSubmitButton>
    </>
  );
}
