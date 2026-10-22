'use client';

import { useId, useState, type FormEvent } from 'react';
import { KeyRound, RefreshCw, ShieldOff } from 'lucide-react';
import { Button, Field, FormError, Input, Modal } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { disableTwoFactor, regenerateRecoveryCodes } from '@/store';
import { useT } from '@/translations';
import styles from './TwoFactorCard.module.css';

export type TwoFactorCodeAction = 'disable' | 'regenerate';

/** Turning two-factor authentication off, or replacing the recovery codes, needs a current code. */
export function TwoFactorCodeModal({ action, onClose }: { action: TwoFactorCodeAction; onClose: () => void }) {
  const t = useT();
  const id = useId();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const disabling = action === 'disable';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return setError('Enter the code from your authenticator app, or a recovery code.');
    setSaving(true);
    const result = await (disabling ? disableTwoFactor(code) : regenerateRecoveryCodes(code));
    setSaving(false);
    if (!result.ok) {
      setCode('');
      return setError(result.error);
    }
    if (disabling) toast.success(t('Two-factor authentication is off.'));
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="sm"
      title={disabling ? t('Turn off two-factor authentication?') : t('Create new recovery codes')}
      description={
        disabling
          ? t('Enter a code from your authenticator app, or a recovery code, to confirm. Your password alone will then sign you in.')
          : t('Enter a code from your authenticator app, or a recovery code. Your current recovery codes stop working.')
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('Cancel')}
          </Button>
          <Button type="submit" form={id} variant={disabling ? 'danger' : 'primary'} icon={disabling ? ShieldOff : RefreshCw} loading={saving}>
            {disabling ? t('Turn off') : t('Create new codes')}
          </Button>
        </>
      }
    >
      <form id={id} onSubmit={submit} className={styles.form} noValidate>
        <FormError message={error && t(error)} />
        <Field label={t('Authentication or recovery code')} htmlFor={`${id}-code`} required>
          <Input
            id={`${id}-code`}
            icon={KeyRound}
            className={styles.code}
            autoComplete="one-time-code"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            placeholder="123456"
            value={code}
            disabled={saving}
            invalid={Boolean(error)}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
