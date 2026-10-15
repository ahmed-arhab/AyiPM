'use client';

import { useMemo } from 'react';
import { usePreferences } from '@/store';
import { SegmentedControl, Select, type SelectOption } from '@/components/ui';
import { formatDate } from '@/lib/date';
import type { DateFormat } from '@/types';
import { DATE_FORMATS, LANGUAGE_OPTIONS, SECTION_BY_ID, TIME_FORMAT_OPTIONS, WEEK_START_OPTIONS } from '../constants';
import { useSavePreferences } from '../hooks/useSavePreferences';
import { useT } from '@/translations';
import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';
import styles from './RegionalSection.module.css';

const SECTION = SECTION_BY_ID.regional;

export function RegionalSection() {
  const preferences = usePreferences();
  const save = useSavePreferences();
  const t = useT();

  const dateOptions = useMemo<SelectOption<DateFormat>[]>(() => {
    const today = new Date();
    return DATE_FORMATS.map((format) => ({ value: format, label: `${format}  (${formatDate(today, format)})` }));
  }, []);

  const languageOptions = useMemo(
    () =>
      LANGUAGE_OPTIONS.some((o) => o.value === preferences.language)
        ? LANGUAGE_OPTIONS
        : [...LANGUAGE_OPTIONS, { value: preferences.language, label: preferences.language }],
    [preferences.language]
  );

  return (
    <SettingsSection
      id={SECTION.id}
      icon={SECTION.icon}
      title={t(SECTION.label)}
      description={t('How dates, times and calendars are shown to you across the app.')}
    >
      <SettingRow label={t('Language')} hint={t('Interface language preference.')}>
        <Select
          className={styles.select}
          aria-label={t('Language')}
          options={languageOptions}
          value={preferences.language}
          onChange={(language) => save({ language }, t('Language preference saved.'))}
        />
      </SettingRow>
      <SettingRow label={t('Date format')} hint={t('Used for dates in tables, cards and reports.')}>
        <Select
          className={styles.select}
          aria-label={t('Date format')}
          options={dateOptions}
          value={preferences.dateFormat}
          onChange={(dateFormat) => save({ dateFormat }, t('Date format updated.'))}
        />
      </SettingRow>
      <SettingRow label={t('Time format')} hint={t('Check-in times, timestamps and the live clock.')}>
        <SegmentedControl
          label={t('Time format')}
          options={TIME_FORMAT_OPTIONS}
          value={preferences.timeFormat}
          onChange={(timeFormat) => timeFormat !== preferences.timeFormat && save({ timeFormat }, t('Time format updated.'))}
        />
      </SettingRow>
      <SettingRow label={t('Week starts on')} hint={t('First day shown in weekly and calendar views.')}>
        <SegmentedControl
          label={t('Week starts on')}
          options={WEEK_START_OPTIONS}
          value={preferences.weekStart}
          onChange={(weekStart) => weekStart !== preferences.weekStart && save({ weekStart }, t('Week start updated.'))}
        />
      </SettingRow>
    </SettingsSection>
  );
}
