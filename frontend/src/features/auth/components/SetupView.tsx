'use client';

import { AuthCard } from './AuthCard';
import { AuthSplitLayout } from './AuthSplitLayout';
import { SetupForm } from './SetupForm';

export function SetupView() {
  return (
    <AuthSplitLayout>
      <AuthCard title="Set up your workspace" subtitle="You'll be the workspace owner and can invite your team once you're in." logoOnMobileOnly>
        <SetupForm />
      </AuthCard>
    </AuthSplitLayout>
  );
}
