'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  Employee,
  Project,
  Task,
  AttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  ActivityLogItem,
  TaskStatus,
  ProjectStatus,
  NotificationItem,
  ThemeMode,
} from '@/types';
import {
  initialEmployees,
  initialProjects,
  initialTasks,
  initialAttendance,
  initialLeaveRequests,
  initialLeaveBalances,
  initialActivityLog,
  initialNotifications,
} from '@/data/seedData';
import { t as translateFn } from '@/translations/dictionary';
import { AutoTranslator } from '@/translations/translator';

interface AppContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: Employee;
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalances: Record<string, LeaveBalance>;
  activityLog: ActivityLogItem[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  language: string;
  setLanguage: (lang: string) => void;
  t: (text: string) => string;
  
  // Actions
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployeeRole: (id: string, newRole: UserRole) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  toggleEmployeeStatus: (id: string) => void;
  assignEmployeeToProject: (employeeId: string, projectId: string) => void;
  removeEmployeeFromProject: (employeeId: string, projectId: string) => void;
  setEmployeeProjects: (employeeId: string, projectIds: string[]) => void;
  checkIn: (employeeId?: string, notes?: string) => void;
  checkOut: (employeeId?: string) => void;
  submitLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn' | 'employeeName'>) => void;
  reviewLeaveRequest: (id: string, status: 'approved' | 'rejected', reason?: string) => void;
  addProject: (data: Omit<Project, 'id' | 'progress'>) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  addTask: (data: Omit<Task, 'id' | 'comments' | 'history'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTaskComment: (taskId: string, text: string) => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);


export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>(initialLeaveBalances);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>(initialActivityLog);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [language, setLanguageState] = useState<string>('English');

  const applyThemeToDOM = (mode: ThemeMode) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (mode === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (mode === 'light') {
      root.setAttribute('data-theme', 'light');
    } else if (mode === 'device') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  };

  // Load from localStorage if present
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('ayipm_theme') as ThemeMode | null;
      if (savedTheme && ['dark', 'light', 'device'].includes(savedTheme)) {
        setThemeState(savedTheme);
        applyThemeToDOM(savedTheme);
      } else {
        applyThemeToDOM('light');
      }

      const savedLang = localStorage.getItem('ayipm_language');
      if (savedLang) {
        if (savedLang === 'Tamil' || savedLang.toLowerCase().includes('tamil')) {
          setLanguageState('Tamil');
        } else if (savedLang === 'Sinhala' || savedLang.toLowerCase().includes('sinhala')) {
          setLanguageState('Sinhala');
        } else {
          setLanguageState('English');
        }
      }
      const savedRole = localStorage.getItem('ayipm_role');
      if (savedRole && ['admin', 'project_manager', 'employee'].includes(savedRole)) {
        setCurrentRole(savedRole as UserRole);
      }
      const savedEmp = localStorage.getItem('ayipm_employees');
      if (savedEmp) setEmployees(JSON.parse(savedEmp));
      const savedProj = localStorage.getItem('ayipm_projects');
      if (savedProj) setProjects(JSON.parse(savedProj));
      const savedTasks = localStorage.getItem('ayipm_tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      const savedAtt = localStorage.getItem('ayipm_attendance');
      if (savedAtt) setAttendance(JSON.parse(savedAtt));
      const savedLeaves = localStorage.getItem('ayipm_leaves');
      if (savedLeaves) setLeaveRequests(JSON.parse(savedLeaves));
      const savedBalances = localStorage.getItem('ayipm_balances');
      if (savedBalances) setLeaveBalances(JSON.parse(savedBalances));
      const savedLogs = localStorage.getItem('ayipm_activity');
      if (savedLogs) setActivityLog(JSON.parse(savedLogs));
      const savedNotifs = localStorage.getItem('ayipm_notifications');
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
    } catch {
      // ignore
    }
  }, []);

  // Listen to system theme preference changes when mode is 'device'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const currentTheme = localStorage.getItem('ayipm_theme');
      if (currentTheme === 'device') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    applyThemeToDOM(mode);
    try {
      localStorage.setItem('ayipm_theme', mode);
    } catch {
      // ignore
    }
  };

  const setLanguage = (lang: string) => {
    const normalized =
      lang === 'Tamil' || lang.toLowerCase().includes('tamil')
        ? 'Tamil'
        : lang === 'Sinhala' || lang.toLowerCase().includes('sinhala')
        ? 'Sinhala'
        : 'English';
    setLanguageState(normalized);
    try {
      localStorage.setItem('ayipm_language', normalized);
    } catch {
      // ignore
    }
  };


  // Save changes to localStorage
  const saveState = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const handleSetCurrentRole = (role: UserRole) => {
    setCurrentRole(role);
    try {
      localStorage.setItem('ayipm_role', role);
    } catch {
      // ignore
    }
  };

  const defaultFallbackUser: Employee = {
    id: 'emp-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@ayipm.io',
    department: 'Engineering',
    designation: 'Tech Lead / Architect',
    role: currentRole,
    status: 'active',
    joinDate: '2023-01-15',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '',
    location: '',
  };

  // Determine active profile based on persona
  const currentUser: Employee =
    (currentRole === 'admin'
      ? employees.find((e) => e.role === 'admin')
      : currentRole === 'project_manager'
      ? employees.find((e) => e.role === 'project_manager')
      : employees.find((e) => e.role === 'employee')) ||
    employees[0] ||
    defaultFallbackUser;

  const logActivity = (
    action: string,
    entityType: ActivityLogItem['entityType'],
    entityName: string,
    details?: string
  ) => {
    const newLog: ActivityLogItem = {
      id: `act-${Date.now()}`,
      actorName: currentUser.name,
      actorRole: currentRole,
      action,
      entityType,
      entityName,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      details,
    };
    setActivityLog((prev) => {
      const updated = [newLog, ...prev];
      saveState('ayipm_activity', updated);
      return updated;
    });
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveState('ayipm_notifications', updated);
      return updated;
    });
  };

  const markAsUnread = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: false } : n));
      saveState('ayipm_notifications', updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveState('ayipm_notifications', updated);
      return updated;
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveState('ayipm_notifications', updated);
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    saveState('ayipm_notifications', []);
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      saveState('ayipm_notifications', updated);
      return updated;
    });
  };


  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
    };
    setEmployees((prev) => {
      const updated = [newEmp, ...prev];
      saveState('ayipm_employees', updated);
      return updated;
    });
    // Create default leave balance
    setLeaveBalances((prev) => {
      const updated = {
        ...prev,
        [newEmp.id]: {
          employeeId: newEmp.id,
          annualTotal: 20,
          annualUsed: 0,
          sickTotal: 10,
          sickUsed: 0,
          casualTotal: 7,
          casualUsed: 0,
        },
      };
      saveState('ayipm_balances', updated);
      return updated;
    });
    logActivity('Onboarded Employee', 'employee', newEmp.name, `Designation: ${newEmp.designation}`);
  };

  const toggleEmployeeStatus = (id: string) => {
    setEmployees((prev) => {
      const updated = prev.map((e) => {
        if (e.id === id) {
          const nextStatus = e.status === 'active' ? 'inactive' : 'active';
          logActivity(
            nextStatus === 'active' ? 'Reactivated Employee' : 'Deactivated Employee',
            'employee',
            e.name,
            `Status updated to ${nextStatus}`
          );
          return { ...e, status: nextStatus as 'active' | 'inactive' };
        }
        return e;
      });
      saveState('ayipm_employees', updated);
      return updated;
    });
  };

  const updateEmployeeRole = (id: string, newRole: UserRole) => {
    setEmployees((prev) => {
      const updated = prev.map((e) => {
        if (e.id === id) {
          logActivity(
            'Updated Employee Role',
            'employee',
            e.name,
            `Role changed from ${e.role} to ${newRole}`
          );
          return { ...e, role: newRole };
        }
        return e;
      });
      saveState('ayipm_employees', updated);
      return updated;
    });
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees((prev) => {
      const updated = prev.map((e) => {
        if (e.id === id) {
          const merged = { ...e, ...data };
          logActivity('Updated Employee Profile', 'employee', merged.name, `Profile details updated`);
          return merged;
        }
        return e;
      });
      saveState('ayipm_employees', updated);
      return updated;
    });
  };

  const assignEmployeeToProject = (employeeId: string, projectId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === projectId && !p.members.includes(employeeId)) {
          return { ...p, members: [...p.members, employeeId] };
        }
        return p;
      });
      saveState('ayipm_projects', updated);
      return updated;
    });
    const proj = projects.find((p) => p.id === projectId);
    if (emp && proj) {
      logActivity('Assigned to Project', 'project', proj.name, `Assigned ${emp.name} to ${proj.name}`);
      addNotification({
        title: 'Project Assignment',
        message: `${emp.name} was assigned to project "${proj.name}".`,
        category: 'task',
        link: '/team',
        priority: 'normal',
      });
    }
  };

  const removeEmployeeFromProject = (employeeId: string, projectId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === projectId && p.members.includes(employeeId)) {
          return { ...p, members: p.members.filter((m) => m !== employeeId) };
        }
        return p;
      });
      saveState('ayipm_projects', updated);
      return updated;
    });
    const proj = projects.find((p) => p.id === projectId);
    if (emp && proj) {
      logActivity('Removed from Project', 'project', proj.name, `Removed ${emp.name} from ${proj.name}`);
    }
  };

  const setEmployeeProjects = (employeeId: string, projectIds: string[]) => {
    const emp = employees.find((e) => e.id === employeeId);
    setProjects((prev) => {
      const updated = prev.map((p) => {
        const shouldBeMember = projectIds.includes(p.id);
        const isCurrentMember = p.members.includes(employeeId);
        if (shouldBeMember && !isCurrentMember) {
          return { ...p, members: [...p.members, employeeId] };
        } else if (!shouldBeMember && isCurrentMember) {
          return { ...p, members: p.members.filter((m) => m !== employeeId) };
        }
        return p;
      });
      saveState('ayipm_projects', updated);
      return updated;
    });
    if (emp) {
      logActivity(
        'Updated Project Assignments',
        'project',
        emp.name,
        `Allocated to ${projectIds.length} project(s)`
      );
      addNotification({
        title: 'Project Assignments Updated',
        message: `Project allocations for ${emp.name} were updated (${projectIds.length} active project${projectIds.length === 1 ? '' : 's'}).`,
        category: 'task',
        link: '/team',
        priority: 'normal',
      });
    }
  };

  const checkIn = (targetId?: string, notes?: string) => {
    const empId = targetId || currentUser.id;
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${mins}`;

    // Derivation rule: after 09:15 is considered late
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    const status = isLate ? 'late' : 'present';

    const newRec: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: empId,
      employeeName: emp.name,
      date: todayStr,
      checkIn: timeStr,
      status,
      workingHours: 0.1,
      notes: notes || (isLate ? 'Checked in after 09:15 grace window' : 'Regular on-time check-in'),
    };

    setAttendance((prev) => {
      // Remove any duplicate today record for this employee
      const filtered = prev.filter((r) => !(r.employeeId === empId && r.date === todayStr));
      const updated = [newRec, ...filtered];
      saveState('ayipm_attendance', updated);
      return updated;
    });

    logActivity('Attendance Check-In', 'attendance', emp.name, `Recorded check-in at ${timeStr} (${status})`);
    if (isLate) {
      addNotification({
        title: 'Late Attendance Alert',
        message: `${emp.name} checked in at ${timeStr} (after 09:15 grace window)`,
        category: 'attendance',
        link: '/attendance',
        priority: 'normal',
      });
    }
  };

  const checkOut = (targetId?: string) => {
    const empId = targetId || currentUser.id;
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${mins}`;

    setAttendance((prev) => {
      const updated = prev.map((r) => {
        if (r.employeeId === empId && r.date === todayStr) {
          // calculate worked hours from checkIn
          const [inH, inM] = r.checkIn.split(':').map(Number);
          let calcHours = 8.0;
          if (!isNaN(inH) && !isNaN(inM)) {
            const diffMin = (now.getHours() * 60 + now.getMinutes()) - (inH * 60 + inM);
            calcHours = Math.max(0.5, Math.round((diffMin / 60) * 10) / 10);
          }
          const finalStatus = calcHours < 4.5 ? 'half_day' : r.status;
          return {
            ...r,
            checkOut: timeStr,
            workingHours: calcHours,
            status: finalStatus,
          };
        }
        return r;
      });
      saveState('ayipm_attendance', updated);
      return updated;
    });

    logActivity('Attendance Check-Out', 'attendance', currentUser.name, `Checked out at ${timeStr}`);
  };

  const submitLeaveRequest = (
    data: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn' | 'employeeName'>
  ) => {
    const emp = employees.find((e) => e.id === data.employeeId) || currentUser;
    const newReq: LeaveRequest = {
      ...data,
      id: `leave-${Date.now()}`,
      employeeName: emp.name,
      status: 'pending',
      appliedOn: new Date().toISOString().slice(0, 10),
    };

    setLeaveRequests((prev) => {
      const updated = [newReq, ...prev];
      saveState('ayipm_leaves', updated);
      return updated;
    });

    logActivity(
      'Submitted Leave Request',
      'leave',
      `${emp.name} (${data.days}d ${data.leaveType})`,
      `Dates: ${data.startDate} to ${data.endDate}`
    );

    addNotification({
      title: 'New Leave Request',
      message: `${emp.name} submitted a ${data.days}-day ${data.leaveType} leave request.`,
      category: 'leave',
      link: '/leave',
      priority: 'high',
      sender: { name: emp.name },
    });
  };


  const reviewLeaveRequest = (
    id: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) => {
    let affectedReq: LeaveRequest | undefined;
    setLeaveRequests((prev) => {
      const updated = prev.map((req) => {
        if (req.id === id) {
          affectedReq = req;
          return {
            ...req,
            status,
            rejectionReason: status === 'rejected' ? reason || 'Policy requirement unfulfilled' : undefined,
            approvedBy: `${currentUser.name} (${currentUser.role})`,
          };
        }
        return req;
      });
      saveState('ayipm_leaves', updated);
      return updated;
    });

    if (affectedReq) {
      // If approved, decrement balance and add attendance records
      if (status === 'approved') {
        setLeaveBalances((prev) => {
          const bal = prev[affectedReq!.employeeId] || {
            employeeId: affectedReq!.employeeId,
            annualTotal: 20,
            annualUsed: 0,
            sickTotal: 10,
            sickUsed: 0,
            casualTotal: 7,
            casualUsed: 0,
          };
          const keyUsed =
            affectedReq!.leaveType === 'Annual'
              ? 'annualUsed'
              : affectedReq!.leaveType === 'Sick'
              ? 'sickUsed'
              : 'casualUsed';
          const updated = {
            ...prev,
            [affectedReq!.employeeId]: {
              ...bal,
              [keyUsed]: bal[keyUsed] + affectedReq!.days,
            },
          };
          saveState('ayipm_balances', updated);
          return updated;
        });

        // Automatically write attendance record as specified in the roadmap!
        const autoAtt: AttendanceRecord = {
          id: `att-leave-${Date.now()}`,
          employeeId: affectedReq.employeeId,
          employeeName: affectedReq.employeeName,
          date: affectedReq.startDate,
          checkIn: '—',
          checkOut: '—',
          workingHours: 0,
          status: 'leave',
          notes: `Approved ${affectedReq.leaveType} leave (${affectedReq.days} days)`,
        };
        setAttendance((prev) => {
          const updated = [autoAtt, ...prev];
          saveState('ayipm_attendance', updated);
          return updated;
        });
      }

      logActivity(
        `${status === 'approved' ? 'Approved' : 'Rejected'} Leave Request`,
        'leave',
        `${affectedReq.employeeName} (${affectedReq.leaveType})`,
        status === 'rejected' ? `Reason: ${reason}` : 'Leave balance and calendar updated'
      );

      addNotification({
        title: `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `${affectedReq.employeeName}'s ${affectedReq.days}d ${affectedReq.leaveType} leave was ${status}.`,
        category: 'leave',
        link: '/leave',
        priority: status === 'approved' ? 'normal' : 'high',
      });
    }
  };


  const addProject = (data: Omit<Project, 'id' | 'progress'>) => {
    const newProj: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      progress: 0,
    };
    setProjects((prev) => {
      const updated = [newProj, ...prev];
      saveState('ayipm_projects', updated);
      return updated;
    });
    logActivity('Created Project', 'project', newProj.name, `Client: ${newProj.client}`);
  };

  const updateProjectStatus = (id: string, status: ProjectStatus) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          logActivity('Updated Project Status', 'project', p.name, `Status set to ${status}`);
          return {
            ...p,
            status,
            progress: status === 'completed' ? 100 : p.progress,
          };
        }
        return p;
      });
      saveState('ayipm_projects', updated);
      return updated;
    });
  };

  const addTask = (data: Omit<Task, 'id' | 'comments' | 'history'>) => {
    const newTask: Task = {
      ...data,
      id: `task-${Date.now()}`,
      comments: [],
      history: [
        {
          id: `h-${Date.now()}`,
          action: 'Created task',
          author: currentUser.name,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        },
      ],
    };
    setTasks((prev) => {
      const updated = [newTask, ...prev];
      saveState('ayipm_tasks', updated);
      return updated;
    });
    logActivity('Created Task', 'task', newTask.title, `Assigned to ${newTask.assigneeName}`);
    addNotification({
      title: 'New Task Created',
      message: `"${newTask.title}" was assigned to ${newTask.assigneeName}.`,
      category: 'task',
      link: '/tasks',
      priority: newTask.priority === 'urgent' ? 'urgent' : newTask.priority === 'high' ? 'high' : 'normal',
      sender: { name: currentUser.name, avatar: currentUser.avatar },
    });
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === taskId) {
          const hist: Task['history'] = [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `Changed status to ${status.replace('_', ' ')}`,
              author: currentUser.name,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            },
          ];
          return { ...t, status, history: hist };
        }
        return t;
      });
      saveState('ayipm_tasks', updated);
      return updated;
    });
    const targetTask = tasks.find((t) => t.id === taskId);
    if (targetTask) {
      logActivity('Moved Task', 'task', targetTask.title, `Moved to ${status.replace('_', ' ')}`);
      addNotification({
        title: 'Task Status Updated',
        message: `"${targetTask.title}" moved to ${status.replace('_', ' ')}.`,
        category: 'task',
        link: '/tasks',
        priority: 'normal',
      });
    }
  };

  const addTaskComment = (taskId: string, text: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === taskId) {
          const newComment = {
            id: `c-${Date.now()}`,
            authorName: currentUser.name,
            authorAvatar: currentUser.avatar,
            text,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
          return { ...t, comments: [...t.comments, newComment] };
        }
        return t;
      });
      saveState('ayipm_tasks', updated);
      return updated;
    });
  };

  const resetAllData = () => {
    localStorage.clear();
    setEmployees(initialEmployees);
    setProjects(initialProjects);
    setTasks(initialTasks);
    setAttendance(initialAttendance);
    setLeaveRequests(initialLeaveRequests);
    setLeaveBalances(initialLeaveBalances);
    setActivityLog(initialActivityLog);
    setNotifications(initialNotifications);
    setCurrentRole('admin');
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole: handleSetCurrentRole,
        currentUser,
        employees,
        projects,
        tasks,
        attendance,
        leaveRequests,
        leaveBalances,
        activityLog,
        notifications,
        unreadNotificationsCount,
        theme,
        setTheme,
        language,
        setLanguage,
        t: (text: string) => translateFn(text, language),
        addEmployee,
        updateEmployeeRole,
        updateEmployee,
        toggleEmployeeStatus,
        assignEmployeeToProject,
        removeEmployeeFromProject,
        setEmployeeProjects,
        checkIn,
        checkOut,
        submitLeaveRequest,
        reviewLeaveRequest,
        addProject,
        updateProjectStatus,
        addTask,
        updateTaskStatus,
        addTaskComment,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        resetAllData,
      }}
    >
      <AutoTranslator language={language} />
      {children}
    </AppContext.Provider>
  );

}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
