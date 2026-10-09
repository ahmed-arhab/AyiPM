'use client';

import { usePermission } from '@/store';
import { useDashboardScope } from '../hooks/useDashboardScope';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStats } from './DashboardStats';
import { DeadlinesCard } from './DeadlinesCard';
import { GetStartedCard } from './GetStartedCard';
import { MyTasksCard } from './MyTasksCard';
import { PendingApprovalsCard } from './PendingApprovalsCard';
import { ProjectOverviewCard } from './ProjectOverviewCard';
import { RecentActivityCard } from './RecentActivityCard';
import { RecentProjectsCard } from './RecentProjectsCard';
import { TaskOverviewCard } from './TaskOverviewCard';
import styles from './DashboardView.module.css';

export function DashboardView() {
  const scope = useDashboardScope();
  const canReview = usePermission('leave.review');

  return (
    <div className="page-container">
      <DashboardHeader />
      <DashboardStats scope={scope} />

      <div className={styles.layout}>
        <div className={styles.column}>
          <div className={styles.pair}>
            <ProjectOverviewCard projects={scope.projects} />
            <TaskOverviewCard tasks={scope.tasks} personal={!scope.seesAllTasks} />
          </div>
          <MyTasksCard tasks={scope.myTasks} />
          <RecentProjectsCard projects={scope.projects} />
        </div>
        <div className={styles.column}>
          <DeadlinesCard projects={scope.projects} tasks={scope.tasks} personal={!scope.seesAllTasks} />
          {canReview && <PendingApprovalsCard />}
          <RecentActivityCard />
        </div>
      </div>
    </div>
  );
}
