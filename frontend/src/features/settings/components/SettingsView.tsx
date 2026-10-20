'use client';

import { useMemo } from 'react';
import { Settings } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { usePermission } from '@/store';
import { SETTINGS_SECTIONS } from '../constants';
import { NotificationSection } from './NotificationSection';
import { ProfileLinkCard } from './ProfileLinkCard';
import { RegionalSection } from './RegionalSection';
import { ResetPreferencesSection } from './ResetPreferencesSection';
import { SettingsNav } from './SettingsNav';
import { WorkspaceSection } from './WorkspaceSection';
import styles from './SettingsView.module.css';

export function SettingsView() {
  const canManageWorkspace = usePermission('workspace.manage');
  const sections = useMemo(() => SETTINGS_SECTIONS.filter((s) => !s.adminOnly || canManageWorkspace), [canManageWorkspace]);

  return (
    <div className="page-container">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Personalise how AyiPM looks and notifies you. Changes to your preferences save instantly."
      />
      <div className={styles.layout}>
        <aside className={styles.aside}>
          <SettingsNav sections={sections} />
          <ProfileLinkCard />
        </aside>
        <div className={styles.sections}>
          <RegionalSection />
          <NotificationSection />
          {canManageWorkspace && <WorkspaceSection />}
          <ResetPreferencesSection />
        </div>
      </div>
    </div>
  );
}
