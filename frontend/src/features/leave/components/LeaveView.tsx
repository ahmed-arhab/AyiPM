'use client';

import { Suspense, useMemo } from 'react';
import { CalendarDays, List, PlaneTakeoff, Plus } from 'lucide-react';
import { Button, PageHeader, SegmentedControl, type SegmentOption } from '@/components/ui';
import { useT } from '@/translations';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useLeaveViewParam, type LeaveViewTab } from '../hooks/useLeaveViewParam';
import { LeaveBalanceCards } from './LeaveBalanceCards';
import { LeaveCalendar } from './LeaveCalendar';
import { LeaveRequestsPanel } from './LeaveRequestsPanel';
import { RequestLeaveModal } from './RequestLeaveModal';
import styles from './LeaveView.module.css';

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
      {/* The selected tab lives in the URL, which needs a Suspense boundary when the page is prerendered. */}
      <Suspense fallback={null}>
        <LeaveTabs />
      </Suspense>
      {requestModal.isOpen && <RequestLeaveModal onClose={requestModal.close} />}
    </div>
  );
}

function LeaveTabs() {
  const { t } = useT();
  const { view, setView } = useLeaveViewParam();
  const options = useMemo<SegmentOption<LeaveViewTab>[]>(
    () => [
      { value: 'requests', label: t('Requests'), icon: List },
      { value: 'calendar', label: t('Calendar'), icon: CalendarDays },
    ],
    [t]
  );
  const active = options.find((o) => o.value === view);

  return (
    <section className={styles.tabs}>
      <SegmentedControl label={t('Leave view')} options={options} value={view} onChange={setView} className={styles.switcher} />
      <div role="tabpanel" aria-label={active?.label}>
        {view === 'calendar' ? <LeaveCalendar /> : <LeaveRequestsPanel />}
      </div>
    </section>
  );
}
