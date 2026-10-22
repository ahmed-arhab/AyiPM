'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LifeBuoy, Link2Off, MailOpen } from 'lucide-react';
import { ButtonLink, Spinner } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { fetchInvite, useGoogleSignIn } from '@/store';
import type { TwoFactorChallenge } from '@/types';
import { useT } from '@/translations';
import { useTokenLookup } from '../hooks/useTokenLookup';
import { googleSignInUrl } from '../utils';
import { AuthCard } from './AuthCard';
import { AuthSplitLayout } from './AuthSplitLayout';
import { AuthStatus } from './AuthStatus';
import { AcceptInviteForm } from './AcceptInviteForm';
import { AuthDivider, GoogleSignInButton } from './GoogleSignInButton';
import { TwoFactorSetupStep } from './TwoFactorSetupStep';
import styles from './AcceptInviteView.module.css';

function InvalidInvite() {
  return (
    <AuthCard title="Invitation unavailable" icon={MailOpen} logoOnMobileOnly>
      <AuthStatus
        icon={Link2Off}
        tone="danger"
        title="This invitation is invalid or has expired"
        actions={
          <ButtonLink href={ROUTES.forgotPassword} variant="secondary" icon={LifeBuoy} fullWidth>
            Get help signing in
          </ButtonLink>
        }
      >
        <p>Invitations expire after 7 days or once they&apos;ve been used. Ask your workspace admin to send you a new one.</p>
      </AuthStatus>
    </AuthCard>
  );
}

function AcceptInviteContent() {
  const t = useT();
  const router = useRouter();
  const token = useSearchParams()?.get('token') ?? '';
  const lookup = useTokenLookup(token, fetchInvite);
  const googleSignIn = useGoogleSignIn();
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);

  if (challenge && lookup.status === 'valid') {
    // The invitation is used up by now, so starting over means signing in with the new password.
    return (
      <AuthCard title={t('Set up two-factor authentication')} logoOnMobileOnly>
        <TwoFactorSetupStep
          challenge={challenge}
          identifier={lookup.data.email}
          onRestart={() => router.replace(ROUTES.login)}
          onSignedIn={() => router.replace(ROUTES.dashboard)}
        />
      </AuthCard>
    );
  }
  if (lookup.status === 'loading') return <Spinner size={28} />;
  if (lookup.status === 'invalid') return <InvalidInvite />;
  const employee = lookup.data;

  return (
    <AuthCard title={`Join ${employee.companyName}`} subtitle="Choose a password to finish setting up your account." logoOnMobileOnly>
      <dl className={styles.identity}>
        <div>
          <dt>Name</dt>
          <dd>{employee.name}</dd>
        </div>
        <div>
          <dt>Work email</dt>
          <dd>{employee.email}</dd>
        </div>
        <div>
          <dt>Employee ID</dt>
          <dd>{employee.employeeId}</dd>
        </div>
      </dl>
      <AcceptInviteForm token={token} onAccepted={() => router.replace(ROUTES.dashboard)} onTwoFactorRequired={setChallenge} />
      {googleSignIn && (
        <>
          <AuthDivider />
          {/* Joins without a password. Only the Google account for the invited address is accepted. */}
          <GoogleSignInButton href={googleSignInUrl(token)} label={t('Join with Google')} />
        </>
      )}
    </AuthCard>
  );
}

export function AcceptInviteView() {
  return (
    <AuthSplitLayout>
      <Suspense fallback={<Spinner size={28} />}>
        <AcceptInviteContent />
      </Suspense>
    </AuthSplitLayout>
  );
}
