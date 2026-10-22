'use client';

import { useEmployeesById, useFormatters } from '@/store';
import { Avatar, Button, Modal, StatusBadge } from '@/components/ui';
import { useT } from '@/translations';
import type { LeaveRequest } from '@/types';
import { LEAVE_TYPE_LABELS } from '../utils';
import styles from './LeaveDetailsModal.module.css';

interface LeaveDetailsModalProps {
  title: string;
  description?: string;
  requests: LeaveRequest[];
  /** Reviewers see everyone's leave, so each entry leads with the person. */
  showPeople: boolean;
  onClose: () => void;
}

export function LeaveDetailsModal({ title, description, requests, showPeople, onClose }: LeaveDetailsModalProps) {
  const { t, formatNumber } = useT();
  const employeesById = useEmployeesById();
  const { date } = useFormatters();

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title={title}
      description={description}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t('Close')}
        </Button>
      }
    >
      <ul className={styles.list}>
        {requests.map((r) => {
          const employee = employeesById.get(r.employeeId);
          const name = employee?.name ?? t('Former member');
          const type = t(LEAVE_TYPE_LABELS[r.leaveType]);
          return (
            <li key={r.id} className={styles.item}>
              <div className={styles.head}>
                {showPeople ? (
                  <span className={styles.person}>
                    <Avatar name={name} src={employee?.avatar} size={32} />
                    <span className={styles.name}>{name}</span>
                  </span>
                ) : (
                  <span className={styles.name}>{type}</span>
                )}
                <StatusBadge kind="leave" value={r.status} />
              </div>
              <dl className={styles.facts}>
                {showPeople && (
                  <div>
                    <dt>{t('Leave type')}</dt>
                    <dd>{type}</dd>
                  </div>
                )}
                <div>
                  <dt>{t('Dates')}</dt>
                  <dd>{r.startDate === r.endDate ? date(r.startDate) : `${date(r.startDate)} → ${date(r.endDate)}`}</dd>
                </div>
                <div>
                  <dt>{t('Days')}</dt>
                  <dd>{formatNumber(r.days)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
