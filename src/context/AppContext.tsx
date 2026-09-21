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
} from '@/types';
import {
  initialEmployees,
  initialProjects,
  initialTasks,
  initialAttendance,
  initialLeaveRequests,
  initialLeaveBalances,
  initialActivityLog,
} from '@/data/seedData';

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
  
  // Actions
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  toggleEmployeeStatus: (id: string) => void;
  checkIn: (employeeId?: string, notes?: string) => void;
  checkOut: (employeeId?: string) => void;
  submitLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn' | 'employeeName'>) => void;
  reviewLeaveRequest: (id: string, status: 'approved' | 'rejected', reason?: string) => void;
  addProject: (data: Omit<Project, 'id' | 'progress'>) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  addTask: (data: Omit<Task, 'id' | 'comments' | 'history'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTaskComment: (taskId: string, text: string) => void;
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

  // Load from localStorage if present
  useEffect(() => {
    try {
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
    } catch {
      // ignore
    }
  }, []);

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

  // Determine active profile based on persona
  const currentUser: Employee =
    currentRole === 'admin'
      ? employees.find((e) => e.role === 'admin') || employees[0]
      : currentRole === 'project_manager'
      ? employees.find((e) => e.role === 'project_manager') || employees[1]
      : employees.find((e) => e.role === 'employee') || employees[2];

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
        addEmployee,
        toggleEmployeeStatus,
        checkIn,
        checkOut,
        submitLeaveRequest,
        reviewLeaveRequest,
        addProject,
        updateProjectStatus,
        addTask,
        updateTaskStatus,
        addTaskComment,
        resetAllData,
      }}
    >
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
