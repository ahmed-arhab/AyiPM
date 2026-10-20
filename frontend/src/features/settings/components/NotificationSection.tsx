'use client';

import { usePreferences } from '@/store';
import { Switch } from '@/components/ui';
import { NOTIFICATION_CATEGORY } from '@/constants/status';
import type { NotificationCategory } from '@/types';
import { NOTIFICATION_DESCRIPTIONS, SECTION_BY_ID } from '../constants';
import { useSavePreferences } from '../hooks/useSavePreferences';
import { SettingsSection } from './SettingsSection';
import styles from './NotificationSection.module.css';

const SECTION = SECTION_BY_ID.notifications;
const CATEGORIES = Object.keys(NOTIFICATION_CATEGORY) as NotificationCategory[];

export function NotificationSection() {
  const { notificationCategories } = usePreferences();
  const save = useSavePreferences();
  const enabledCount = CATEGORIES.filter((c) => notificationCategories[c] !== false).length;

  const toggle = (category: NotificationCategory, enabled: boolean) => {
    const label = NOTIFICATION_CATEGORY[category].label;
    save(
      { notificationCategories: { ...notificationCategories, [category]: enabled } },
      `${label} notifications ${enabled ? 'enabled' : 'muted'}.`
    );
  };

  return (
    <SettingsSection
      id={SECTION.id}
      icon={SECTION.icon}
      title={SECTION.label}
      description="Choose which in-app notifications you receive. Muted categories won't reach your inbox."
      actions={<span className={styles.count}>{enabledCount}/{CATEGORIES.length} on</span>}
    >
      <div className={styles.list}>
        {CATEGORIES.map((category) => (
          <Switch
            key={category}
            label={NOTIFICATION_CATEGORY[category].label}
            description={NOTIFICATION_DESCRIPTIONS[category]}
            checked={notificationCategories[category] !== false}
            onChange={(checked) => toggle(category, checked)}
          />
        ))}
      </div>
    </SettingsSection>
  );
}
