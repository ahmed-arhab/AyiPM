'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { Info, RefreshCw, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Field, FormError, Input } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { TwoFactorSetupPanel } from '@/features/auth/components/TwoFactorSetupPanel';
import { confirmTwoFactorSetup, refreshTwoFactorStatus, startTwoFactorSetup, useTwoFactorStatus } from '@/store';
import type { TwoFactorSetup, TwoFactorStatus } from '@/types';
import { useT } from '@/translations';
import { TwoFactorCodeModal, type TwoFactorCodeAction } from './TwoFactorCodeModal';
import styles from './TwoFactorCard.module.css';

const LOW_RECOVERY_CODES = 3;

export function TwoFactorCard() {
  const t = useT();
  const id = useId();
  const status = useTwoFactorStatus();
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [action, setAction] = useState<TwoFactorCodeAction | null>(null);

  // The bootstrap copy can be stale, e.g. after an admin changed the workspace requirement.
  useEffect(() => {
    void refreshTwoFactorStatus();
  }, []);

  if (!status) return null;

  return (
    <Card as="section" aria-labelledby={`${id}-title`}>
      <CardHeader
        icon={Smartphone}
        title={<span id={`${id}-title`}>{t('Two-factor authentication')}</span>}
        description={t('Sign-in asks for a code from an authenticator app on your phone as well as your password.')}
        actions={<Badge tone={status.enabled ? 'success' : 'neutral'}>{status.enabled ? t('On') : t('Off')}</Badge>}
      />
      <div className={styles.body}>
        {status.enabled ? (
          <EnabledDetails status={status} onAction={setAction} />
        ) : setup ? (
          <SetupForm setup={setup} onCancel={() => setSetup(null)} onDone={() => setSetup(null)} />
        ) : (
          <TurnOn available={status.available} onStarted={setSetup} />
        )}
      </div>
      {action && <TwoFactorCodeModal action={action} onClose={() => setAction(null)} />}
    </Card>
  );
}

function TurnOn({ available, onStarted }: { available: boolean; onStarted: (setup: TwoFactorSetup) => void }) {
  const t = useT();
  const toast = useToast();
  const [starting, setStarting] = useState(false);

  if (!available) {
    return (
      <p className={styles.note}>
        <Info size={16} />
        <span>{t("Two-factor authentication isn't set up on this server yet. Ask the person who runs AyiPM to turn it on.")}</span>
      </p>
    );
  }

  const start = async () => {
    setStarting(true);
    const result = await startTwoFactorSetup();
    setStarting(false);
    if (result.ok) onStarted(result.data);
    else toast.error(t(result.error));
  };

  return (
    <div className={styles.row}>
      <p className={styles.text}>{t('Protect your account even if someone learns your password.')}</p>
      <Button icon={ShieldCheck} onClick={start} loading={starting}>
        {t('Set up two-factor authentication')}
      </Button>
    </div>
  );
}

function SetupForm({ setup, onCancel, onDone }: { setup: TwoFactorSetup; onCancel: () => void; onDone: () => void }) {
  const t = useT();
  const id = useId();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.replace(/\s/g, ''))) return setError('Enter the 6-digit code from your authenticator app.');
    setSaving(true);
    const result = await confirmTwoFactorSetup(code);
    setSaving(false);
    if (!result.ok) {
      setCode('');
      return setError(result.error);
    }
    toast.success(t('Two-factor authentication is on.'));
    onDone();
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TwoFactorSetupPanel setup={setup} />
      <FormError message={error && t(error)} />
      <Field label={t('Code from your app')} htmlFor={`${id}-code`} required>
        <Input
          id={`${id}-code`}
          icon={Smartphone}
          className={styles.code}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
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
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          {t('Cancel')}
        </Button>
        <Button type="submit" icon={ShieldCheck} loading={saving}>
          {t('Turn on')}
        </Button>
      </div>
    </form>
  );
}

function EnabledDetails({ status, onAction }: { status: TwoFactorStatus; onAction: (action: TwoFactorCodeAction) => void }) {
  const t = useT();
  const low = status.recoveryCodesLeft <= LOW_RECOVERY_CODES;

  return (
    <>
      <div className={styles.row}>
        <div className={styles.text}>
          <span className={styles.label}>{t('Recovery codes')}</span>
          <span className={low ? styles.warning : styles.hint}>
            {t('{count} left', { count: status.recoveryCodesLeft })}
            {low && ` · ${t('Create new ones so you can still sign in without your phone.')}`}
          </span>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={() => onAction('regenerate')}>
          {t('New recovery codes')}
        </Button>
      </div>
      <div className={styles.row}>
        <div className={styles.text}>
          <span className={styles.label}>{t('Turn off two-factor authentication')}</span>
          <span className={styles.hint}>
            {status.required ? t('Your workspace requires two-factor authentication for admins.') : t('Your password alone will sign you in.')}
          </span>
        </div>
        <Button variant="danger" icon={ShieldOff} onClick={() => onAction('disable')} disabled={status.required}>
          {t('Turn off')}
        </Button>
      </div>
    </>
  );
}
