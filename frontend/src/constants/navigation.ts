import {
  Activity,
  Bell,
  CalendarCheck,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  PlaneTakeoff,
  Settings,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  team: '/team',
  attendance: '/attendance',
  leave: '/leave',
  projects: '/projects',
  project: (id: string) => `/projects/${id}`,
  tasks: '/tasks',
  activity: '/activity',
  notifications: '/notifications',
  settings: '/settings',
  profile: '/profile',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  acceptInvite: '/accept-invite',
  setup: '/setup',
} as const;

export type NavBadgeKey = 'activeEmployees' | 'attendanceToday' | 'pendingLeaves' | 'activeProjects' | 'openTasks' | 'unreadNotifications';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: NavBadgeKey;
  badgeTone?: 'warning' | 'danger';
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'Team', href: ROUTES.team, icon: Users, badge: 'activeEmployees' },
  { label: 'Attendance', href: ROUTES.attendance, icon: CalendarCheck, badge: 'attendanceToday' },
  { label: 'Leave Management', href: ROUTES.leave, icon: PlaneTakeoff, badge: 'pendingLeaves', badgeTone: 'warning' },
  { label: 'Projects', href: ROUTES.projects, icon: FolderKanban, badge: 'activeProjects' },
  { label: 'Tasks & Kanban', href: ROUTES.tasks, icon: CheckSquare, badge: 'openTasks' },
  { label: 'Activity Audit', href: ROUTES.activity, icon: Activity },
  { label: 'Notifications', href: ROUTES.notifications, icon: Bell, badge: 'unreadNotifications', badgeTone: 'danger' },
];

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { label: 'Settings', href: ROUTES.settings, icon: Settings },
  { label: 'My Profile', href: ROUTES.profile, icon: UserCircle },
];

export const AUTH_ROUTES: string[] = [ROUTES.login, ROUTES.forgotPassword, ROUTES.resetPassword, ROUTES.acceptInvite, ROUTES.setup];
