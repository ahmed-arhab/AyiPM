'use client';

import { RotateCcw, Save } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { SECTION_BY_ID } from '../constants';
import { useWorkspaceForm } from '../hooks/useWorkspaceForm';
import { SettingsSection } from './SettingsSection';
import { AttendanceFields, GeneralFields, LeaveFields } from './WorkspaceFields';
import styles from './WorkspaceSection.module.css';

const SECTION = SECTION_BY_ID.workspace;

export function WorkspaceSection() {
  const { values, errors, dirty, saving, setField, reset, submit } = useWorkspaceForm();
  const fieldProps = { values, errors, setField };

  return (
    <SettingsSection
      id={SECTION.id}
      icon={SECTION.icon}
      title={SECTION.label}
      description="Company-wide rules that apply to every employee. Only admins can change these."
      actions={<Badge tone="purple">Admin</Badge>}
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <GeneralFields {...fieldProps} />
        <AttendanceFields {...fieldProps} />
        <LeaveFields {...fieldProps} />
        <div className={styles.footer}>
          <span className={styles.status}>{dirty ? 'You have unsaved workspace changes.' : 'All workspace changes saved.'}</span>
          <div className={styles.actions}>
            <Button variant="secondary" icon={RotateCcw} onClick={reset} disabled={!dirty}>
              Discard
            </Button>
            <Button type="submit" icon={Save} disabled={!dirty} loading={saving}>
              Save workspace
            </Button>
          </div>
        </div>
      </form>
    </SettingsSection>
  );
}
