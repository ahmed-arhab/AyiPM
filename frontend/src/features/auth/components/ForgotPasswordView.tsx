'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle2, LifeBuoy } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import { AuthCard } from './AuthCard';
import { AuthStatus } from './AuthStatus';
import { ForgotPasswordForm } from './ForgotPasswordForm';

function RequestSent() {
  return (
    <AuthStatus
      icon={CheckCircle2}
      title="Request sent"
      actions={
        <ButtonLink href={ROUTES.login} variant="secondary" icon={ArrowLeft} fullWidth>
          Back to sign in
        </ButtonLink>
      }
    >
      <p>
        If that account exists, your workspace admins will see your request on the Team page and can send you a secure link to choose
        a new password, valid for 30 minutes.
      </p>
    </AuthStatus>
  );
}

export function ForgotPasswordView() {
  const [sent, setSent] = useState(false);

  return (
    <AuthCard
      icon={LifeBuoy}
      title="Can't log in?"
      subtitle="Enter your work email and we'll ask your workspace admin to send you a password reset link."
    >
      {sent ? <RequestSent /> : <ForgotPasswordForm onRequested={() => setSent(true)} />}
    </AuthCard>
  );
}
