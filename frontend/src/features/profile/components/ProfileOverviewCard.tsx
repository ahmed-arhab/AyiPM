'use client';

import { BadgeCheck, Building2, CalendarDays, Hash, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import { Badge, Card, RoleBadge } from '@/components/ui';
import { useFormatters } from '@/store';
import type { Employee } from '@/types';
import { AvatarUploader } from './AvatarUploader';
import styles from './ProfileOverviewCard.module.css';

interface MetaItem {
  icon: LucideIcon;
  label: string;
  value?: string;
}

export function ProfileOverviewCard({ user }: { user: Employee }) {
  const { date } = useFormatters();
  const meta: MetaItem[] = [
    { icon: Hash, label: 'Employee ID', value: user.employeeId },
    { icon: Building2, label: 'Department', value: user.department },
    { icon: CalendarDays, label: 'Joined', value: date(user.joinDate) },
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Phone, label: 'Phone', value: user.phone },
    { icon: MapPin, label: 'Location', value: user.location },
  ];

  return (
    <Card as="section" className={styles.card} aria-label="Profile overview">
      <AvatarUploader userId={user.id} name={user.name} avatar={user.avatar} />
      <div className={styles.identity}>
        <h2 className="heading-lg">{user.name}</h2>
        <p className="subtext">{user.designation || 'No designation set'}</p>
        <div className={styles.badges}>
          <RoleBadge role={user.role} />
          <Badge tone={user.status === 'active' ? 'success' : 'neutral'}>
            <BadgeCheck size={12} />
            {user.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      {user.bio && <p className={styles.bio}>{user.bio}</p>}
      <dl className={styles.meta}>
        {meta
          .filter((item) => item.value)
          .map(({ icon: Icon, label, value }) => (
            <div key={label} className={styles.metaRow}>
              <dt>
                <Icon size={14} />
                {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
    </Card>
  );
}
