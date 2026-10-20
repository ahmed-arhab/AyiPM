'use client';

import { PlaneTakeoff, Plus } from 'lucide-react';
import { Button, PageHeader } from '@/components/ui';
import { useT } from '@/translations';
import { useDisclosure } from '@/hooks/useDisclosure';
import { LeaveBalanceCards } from './LeaveBalanceCards';
import { LeaveRequestsPanel } from './LeaveRequestsPanel';
import { RequestLeaveModal } from './RequestLeaveModal';

export function LeaveView() {
  const { t } = useT();
  const requestModal = useDisclosure();
  return (
    <div className="page-container">
      <PageHeader
        icon={PlaneTakeoff}
        title="Leave"
        description="Your leave balance, time-off requests and the team review queue."
        actions={
          <Button icon={Plus} onClick={requestModal.open}>
            {t('Request leave')}
          </Button>
        }
      />
      <LeaveBalanceCards />
      <LeaveRequestsPanel />
      {requestModal.isOpen && <RequestLeaveModal onClose={requestModal.close} />}
    </div>
  );
}
