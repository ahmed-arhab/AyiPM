'use client';

import { Settings, UserCircle } from 'lucide-react';
import { ButtonLink, PageHeader } from '@/components/ui';
import { useCurrentUser } from '@/store';
import { ROUTES } from '@/constants/navigation';
import { useT } from '@/translations';
import { AccountInfoCard } from './AccountInfoCard';
import { ChangePasswordForm } from './ChangePasswordForm';
import { EditProfileForm } from './EditProfileForm';
import { ProfileOverviewCard } from './ProfileOverviewCard';
import { TwoFactorCard } from './TwoFactorCard';
import styles from './ProfileView.module.css';

export function ProfileView() {
  const user = useCurrentUser();
  const { t } = useT();

  return (
    <div className="page-container">
      <PageHeader
        icon={UserCircle}
        title="My Profile"
        description="Manage your personal details, profile photo and password."
        actions={
          <ButtonLink href={ROUTES.settings} variant="secondary" icon={Settings}>
            {t('Preferences')}
          </ButtonLink>
        }
      />
      <div className={styles.layout}>
        <div className={styles.aside}>
          <ProfileOverviewCard user={user} />
          <AccountInfoCard user={user} />
        </div>
        <div className={styles.main}>
          <EditProfileForm user={user} />
          <ChangePasswordForm username={user.email} />
          <TwoFactorCard />
        </div>
      </div>
    </div>
  );
}
