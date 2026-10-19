'use client';

import { useMemo } from 'react';
import { AlertCircle, Bell, CalendarClock, Flame } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui';
import { toDateKey } from '@/lib/date';
import type { NotificationItem } from '@/types';

interface NotificationStatsProps {
  items: NotificationItem[];
  unread: number;
}

export function NotificationStats({ items, unread }: NotificationStatsProps) {
  const { important, today } = useMemo(() => {
    const todayKey = toDateKey();
    let importantCount = 0;
    let todayCount = 0;
    items.forEach((n) => {
      if (!n.read && (n.priority === 'urgent' || n.priority === 'high')) importantCount += 1;
      if (toDateKey(new Date(n.createdAt)) === todayKey) todayCount += 1;
    });
    return { important: importantCount, today: todayCount };
  }, [items]);

  return (
    <StatGrid>
      <StatCard label="Total" value={items.length} icon={Bell} hint="In your inbox" />
      <StatCard label="Unread" value={unread} icon={AlertCircle} accent="var(--danger)" hint={unread > 0 ? 'Waiting for you' : 'All caught up'} />
      <StatCard label="Urgent & high" value={important} icon={Flame} accent="var(--warning)" hint="Unread, high priority" />
      <StatCard label="Today" value={today} icon={CalendarClock} accent="var(--success)" hint="Received today" />
    </StatGrid>
  );
}
