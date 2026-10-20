'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { useCurrentUser, usePermission, useProjects } from '@/store';
import { useT } from '@/translations';
import { Button, PageHeader } from '@/components/ui';
import type { Employee } from '@/types';
import { useMemberActions } from '../hooks/useMemberActions';
import { useMemberNavigation } from '../hooks/useMemberParam';
import { useOpenTaskCounts, useProjectsByMember } from '../hooks/useTeamIndexes';
import { useTeamDirectory } from '../hooks/useTeamDirectory';
import type { TeamViewMode } from '../utils';
import { MemberProfileRoute } from './MemberProfileRoute';
import { TeamDialogs, type TeamDialog } from './TeamDialogs';
import { TeamMembers } from './TeamMembers';
import { TeamOnboardingState } from './TeamOnboardingState';
import { TeamStats } from './TeamStats';
import { TeamToolbar } from './TeamToolbar';

export function TeamView() {
  const { t } = useT();
  const currentUser = useCurrentUser();
  const canManage = usePermission('employees.manage');
  const canAssign = usePermission('projects.manage');
  const projects = useProjects();
  const projectsByMember = useProjectsByMember();
  const openTaskCounts = useOpenTaskCounts();
  const directory = useTeamDirectory(projectsByMember);
  const { toggleStatus } = useMemberActions();
  const { openMember, closeMember } = useMemberNavigation();
  const [viewMode, setViewMode] = useState<TeamViewMode>('grid');
  const [dialog, setDialog] = useState<TeamDialog | null>(null);

  const closeDialog = useCallback(() => setDialog(null), []);
  const openAdd = useCallback(() => setDialog({ type: 'add' }), []);

  const adminHandlers = useMemo(
    () => ({
      onEdit: canManage ? (member: Employee) => setDialog({ type: 'edit', member }) : undefined,
      onResetPassword: canManage ? (member: Employee) => setDialog({ type: 'access', member }) : undefined,
      onAssign: canAssign ? (member: Employee) => setDialog({ type: 'assign', member }) : undefined,
    }),
    [canManage, canAssign]
  );

  const onlyMe = directory.employees.length <= 1;

  return (
    <div className="page-container">
      <PageHeader
        icon={Users}
        title="Team"
        description="Directory, roles, contact details and project allocation for everyone in the workspace."
        actions={
          canManage && (
            <Button icon={UserPlus} onClick={openAdd}>
              {t('Add member')}
            </Button>
          )
        }
      />

      {onlyMe ? (
        <TeamOnboardingState canManage={canManage} onAdd={openAdd} />
      ) : (
        <>
          <TeamStats stats={directory.stats} />
          <TeamToolbar
            query={directory.query}
            onQueryChange={directory.setQuery}
            filters={directory.filters}
            onFilterChange={directory.updateFilter}
            departments={directory.departments}
            projects={projects}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            resultCount={directory.members.length}
            total={directory.employees.length}
            hasActiveFilters={directory.hasActiveFilters}
            onReset={directory.reset}
          />
          <TeamMembers
            viewMode={viewMode}
            members={directory.members}
            currentUserId={currentUser.id}
            projectsByMember={projectsByMember}
            openTaskCounts={openTaskCounts}
            onOpen={openMember}
            onAssign={adminHandlers.onAssign}
            onToggleStatus={canManage ? toggleStatus : undefined}
            onResetFilters={directory.reset}
          />
        </>
      )}

      <Suspense fallback={null}>
        <MemberProfileRoute hidden={dialog !== null} onClose={closeMember} {...adminHandlers} />
      </Suspense>
      <TeamDialogs dialog={dialog} departments={directory.departments} onClose={closeDialog} />
    </div>
  );
}
