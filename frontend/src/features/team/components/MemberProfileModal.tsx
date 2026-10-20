'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck, CheckSquare, FolderKanban, PlaneTakeoff, UserRound } from 'lucide-react';
import { useCurrentUser, usePermission } from '@/store';
import { Modal, SegmentedControl, type SegmentOption } from '@/components/ui';
import type { Employee } from '@/types';
import { useProjectsByMember, useTasksByAssignee } from '../hooks/useTeamIndexes';
import { MemberProfileHeader } from './MemberProfileHeader';
import { ProfileOverviewTab, type ProfileAdminHandlers } from './ProfileOverviewTab';
import { ProfileProjectsTab } from './ProfileProjectsTab';
import { ProfileTasksTab } from './ProfileTasksTab';
import { ProfileLeaveTab } from './ProfileLeaveTab';
import { ProfileAttendanceTab } from './ProfileAttendanceTab';
import styles from './MemberProfileModal.module.css';

type ProfileTab = 'overview' | 'projects' | 'tasks' | 'leave' | 'attendance';

const EMPTY: never[] = [];

interface MemberProfileModalProps extends ProfileAdminHandlers {
  member: Employee;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberProfileModal({ member, isOpen, onClose, ...handlers }: MemberProfileModalProps) {
  const currentUser = useCurrentUser();
  const isSelf = currentUser.id === member.id;
  const canSeeLeave = usePermission('leave.review') || isSelf;
  const canSeeAttendance = usePermission('attendance.viewAll') || isSelf;
  const [tab, setTab] = useState<ProfileTab>('overview');

  const projects = useProjectsByMember().get(member.id) ?? EMPTY;
  const tasks = useTasksByAssignee().get(member.id) ?? EMPTY;

  const tabs = useMemo(() => {
    const list: SegmentOption<ProfileTab>[] = [
      { value: 'overview', label: 'Overview', icon: UserRound },
      { value: 'projects', label: 'Projects', icon: FolderKanban, count: projects.length },
      { value: 'tasks', label: 'Tasks', icon: CheckSquare, count: tasks.length },
    ];
    if (canSeeLeave) list.push({ value: 'leave', label: 'Leave', icon: PlaneTakeoff });
    if (canSeeAttendance) list.push({ value: 'attendance', label: 'Attendance', icon: CalendarCheck });
    return list;
  }, [projects.length, tasks.length, canSeeLeave, canSeeAttendance]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Member profile" size="lg">
      <div className={styles.body}>
        <MemberProfileHeader member={member} isSelf={isSelf} />
        <SegmentedControl label="Profile sections" size="sm" options={tabs} value={tab} onChange={setTab} />
        <div className={styles.panel} role="tabpanel">
          {tab === 'overview' && <ProfileOverviewTab member={member} isSelf={isSelf} projects={projects} tasks={tasks} {...handlers} />}
          {tab === 'projects' && <ProfileProjectsTab member={member} projects={projects} onAssign={handlers.onAssign} />}
          {tab === 'tasks' && <ProfileTasksTab tasks={tasks} />}
          {tab === 'leave' && canSeeLeave && <ProfileLeaveTab memberId={member.id} />}
          {tab === 'attendance' && canSeeAttendance && <ProfileAttendanceTab memberId={member.id} />}
        </div>
      </div>
    </Modal>
  );
}
