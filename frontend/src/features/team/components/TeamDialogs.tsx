'use client';

import type { Employee } from '@/types';
import { AddMemberModal } from './AddMemberModal';
import { EditMemberModal } from './EditMemberModal';
import { ProjectAssignModal } from './ProjectAssignModal';
import { AccessLinkModal } from './AccessLinkModal';

export type TeamDialog = { type: 'add' } | { type: 'edit' | 'assign' | 'access'; member: Employee };

interface TeamDialogsProps {
  dialog: TeamDialog | null;
  departments: string[];
  onClose: () => void;
}

export function TeamDialogs({ dialog, departments, onClose }: TeamDialogsProps) {
  if (!dialog) return null;
  switch (dialog.type) {
    case 'add':
      return <AddMemberModal departments={departments} onClose={onClose} />;
    case 'edit':
      return <EditMemberModal member={dialog.member} departments={departments} onClose={onClose} />;
    case 'assign':
      return <ProjectAssignModal member={dialog.member} onClose={onClose} />;
    case 'access':
      return <AccessLinkModal member={dialog.member} onClose={onClose} />;
  }
}
