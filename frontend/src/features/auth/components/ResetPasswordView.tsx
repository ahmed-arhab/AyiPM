'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, KeyRound, Link2Off, LogIn, LayoutDashboard, RotateCcw, ShieldCheck } from 'lucide-react';
import { ButtonLink, Spinner } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { fetchPasswordReset, useSessionUser } from '@/store';
import { useTokenLookup } from '../hooks/useTokenLookup';
import { AuthCard } from './AuthCard';
import { AuthFooter } from './AuthFooter';
import { AuthStatus } from './AuthStatus';
import { ResetPasswordForm } from './ResetPasswordForm';
import styles from './ResetPasswordView.module.css';

const BACK_TO_SIGN_IN = <AuthFooter prompt="Remembered it?" href={ROUTES.login} linkLabel="Back to sign in" />;

function ResetComplete() {
  const signedIn = Boolean(useSessionUser());
  return (
    <AuthCard title="Password updated" icon={ShieldCheck}>
      <AuthStatus
        icon={CheckCircle2}
        title="You're all set"
        actions={
          signedIn ? (
            <ButtonLink href={ROUTES.dashboard} icon={LayoutDashboard} fullWidth>
              Back to dashboard
            </ButtonLink>
          ) : (
            <ButtonLink href={ROUTES.login} icon={LogIn} fullWidth>
              Sign in with your new password
            </ButtonLink>
          )
        }
      >
        <p>Your password has been changed and the reset link can no longer be used.</p>
      </AuthStatus>
    </AuthCard>
  );
}

function InvalidLink() {
  return (
    <AuthCard title="Reset link unavailable" icon={KeyRound} footer={BACK_TO_SIGN_IN}>
      <AuthStatus
        icon={Link2Off}
        tone="danger"
        title="This link is invalid or has expired"
        actions={
          <ButtonLink href={ROUTES.forgotPassword} icon={RotateCcw} fullWidth>
            Request a new link
          </ButtonLink>
        }
      >
        <p>Reset links work once and expire 30 minutes after they are created. Ask your workspace admin for a new one.</p>
      </AuthStatus>
    </AuthCard>
  );
}

function ResetPasswordContent() {
  const token = useSearchParams()?.get('token') ?? '';
  const lookup = useTokenLookup(token, fetchPasswordReset);
  const [done, setDone] = useState(false);

  if (done) return <ResetComplete />;
  if (lookup.status === 'loading') return <ResetPasswordFallback />;
  if (lookup.status === 'invalid') return <InvalidLink />;
  const ownerName = lookup.data.name;

  return (
    <AuthCard
      title="Set a new password"
      icon={KeyRound}
      subtitle={
        <>
          Choose a new password for <strong className={styles.owner}>{ownerName}</strong>.
        </>
      }
      footer={BACK_TO_SIGN_IN}
    >
      <ResetPasswordForm token={token} onReset={() => setDone(true)} />
    </AuthCard>
  );
}

function ResetPasswordFallback() {
  return (
    <div className={styles.fallback}>
      <Spinner size={28} />
    </div>
  );
}

export function ResetPasswordView() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
