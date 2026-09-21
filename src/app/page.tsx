'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import StatusBadge from '@/components/StatusBadge';
import {
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  PlaneTakeoff,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  Sparkles,
  Calendar,
  Check,
  X,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    currentRole,
    currentUser,
    employees,
    projects,
    tasks,
    attendance,
    leaveRequests,
    leaveBalances,
    activityLog,
    reviewLeaveRequest,
  } = useApp();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayRecords.filter((a) => a.status === 'present').length;
  const lateCount = todayRecords.filter((a) => a.status === 'late').length;
  const onLeaveCount = todayRecords.filter((a) => a.status === 'leave').length;
  const totalEmployees = employees.filter((e) => e.status === 'active').length;
  const attendanceRate = totalEmployees > 0 ? Math.round(((presentCount + lateCount) / totalEmployees) * 100) : 0;

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending');
  const activeProjects = projects.filter((p) => p.status !== 'completed');
  const userTasks = tasks.filter((t) => t.assigneeId === currentUser.id);
  const userBalance = leaveBalances[currentUser.id] || {
    annualTotal: 20,
    annualUsed: 0,
    sickTotal: 10,
    sickUsed: 0,
    casualTotal: 7,
    casualUsed: 0,
  };

  const tasksByStatus = {
    backlog: tasks.filter((t) => t.status === 'backlog').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    review: tasks.filter((t) => t.status === 'review').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Perspective: {currentRole.replace('_', ' ')}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              12-Week Delivery Sprint
            </span>
          </div>
          <h1 className="heading-xl">
            Welcome back, {currentUser.name}
          </h1>
          <p className="subtext" style={{ marginTop: '0.25rem' }}>
            {currentRole === 'admin'
              ? 'Company-wide operational metrics, employee headcount, and pending team approvals.'
              : currentRole === 'project_manager'
              ? 'Project progress velocity, upcoming milestones, and task distribution.'
              : 'Personal tasks, attendance logs, and leave balances.'}
          </p>
        </div>

        {/* Quick actions bar */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {currentRole === 'admin' && (
            <Link href="/employees" className="btn btn-primary">
              <PlusCircle size={16} />
              <span>Onboard Employee</span>
            </Link>
          )}
          {(currentRole === 'admin' || currentRole === 'project_manager') && (
            <Link href="/tasks" className="btn btn-secondary">
              <PlusCircle size={16} />
              <span>New Task</span>
            </Link>
          )}
          <Link href="/leave" className="btn btn-outline">
            <PlaneTakeoff size={16} />
            <span>Apply Leave</span>
          </Link>
        </div>
      </div>

      {/* Role-Aware Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {currentRole === 'admin' ? (
          <>
            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Active Headcount</span>
                <Users size={18} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalEmployees}</div>
              <div className="subtext">
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>100%</span> active contracts
              </div>
            </div>

            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Today Attendance</span>
                <Clock size={18} color="#34d399" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{attendanceRate}%</div>
              <div className="subtext">
                {presentCount} on time, {lateCount} late, {onLeaveCount} on leave
              </div>
            </div>

            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Active Projects</span>
                <FolderKanban size={18} color="#818cf8" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{activeProjects.length}</div>
              <div className="subtext">
                Across {projects.length} planned initiatives
              </div>
            </div>

            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Pending Leave Requests</span>
                <PlaneTakeoff size={18} color="#fbbf24" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: pendingLeaves.length > 0 ? '#fbbf24' : 'inherit' }}>
                {pendingLeaves.length}
              </div>
              <div className="subtext">
                Requires manager review
              </div>
            </div>
          </>
        ) : currentRole === 'project_manager' ? (
          <>
            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Team Active Projects</span>
                <FolderKanban size={18} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{activeProjects.length}</div>
              <div className="subtext">
                Avg completion: {Math.round(projects.reduce((a, b) => a + b.progress, 0) / projects.length)}%
              </div>
            </div>

            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Tasks In Progress</span>
                <CheckSquare size={18} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{tasksByStatus.in_progress}</div>
              <div className="subtext">
                {tasksByStatus.review} tasks in review
              </div>
            </div>

            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Sprint Completion</span>
                <TrendingUp size={18} color="#34d399" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                {Math.round((tasksByStatus.done / (tasks.length || 1)) * 100)}%
              </div>
              <div className="subtext">
                {tasksByStatus.done} of {tasks.length} tasks resolved
              </div>
            </div>

            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Pending Team Approvals</span>
                <AlertCircle size={18} color="#f59e0b" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{pendingLeaves.length}</div>
              <div className="subtext">
                Leave & attendance requests
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">My Assigned Tasks</span>
                <CheckSquare size={18} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{userTasks.length}</div>
              <div className="subtext">
                {userTasks.filter((t) => t.status === 'done').length} completed
              </div>
            </div>

            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Annual Leave Remaining</span>
                <PlaneTakeoff size={18} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                {userBalance.annualTotal - userBalance.annualUsed}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> / {userBalance.annualTotal}d</span>
              </div>
              <div className="subtext">
                {userBalance.sickTotal - userBalance.sickUsed}d sick leave available
              </div>
            </div>

            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Today Attendance</span>
                <Clock size={18} color="#34d399" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                {todayRecords.find((a) => a.employeeId === currentUser.id)?.status ? (
                  <StatusBadge
                    type="attendance"
                    status={todayRecords.find((a) => a.employeeId === currentUser.id)!.status}
                  />
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Not Checked In</span>
                )}
              </div>
              <div className="subtext">
                Check in before 09:15 AM
              </div>
            </div>

            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span className="heading-sm">Active Projects</span>
                <FolderKanban size={18} color="#a855f7" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                {projects.filter((p) => p.members.includes(currentUser.id)).length}
              </div>
              <div className="subtext">
                Contributing member
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid: Projects & Kanban Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Project Delivery Pulse */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderKanban size={18} color="var(--primary)" />
              <span>Project Delivery Status</span>
            </h2>
            <Link
              href="/projects"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 600,
              }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {projects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{project.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Client: {project.client}
                    </div>
                  </div>
                  <StatusBadge type="project" status={project.status} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ fontWeight: 600 }}>{project.progress}%</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <div className="avatar-group">
                    {project.members.map((mId) => {
                      const emp = employees.find((e) => e.id === mId);
                      if (!emp) return null;
                      return (
                        <img
                          key={mId}
                          src={emp.avatar}
                          alt={emp.name}
                          title={emp.name}
                          className="avatar"
                          style={{ width: '24px', height: '24px' }}
                        />
                      );
                    })}
                  </div>
                  <span>Target: {project.endDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Velocity & Distribution */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={18} color="#38bdf8" />
              <span>Sprint Task Overview</span>
            </h2>
            <Link
              href="/tasks"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 600,
              }}
            >
              <span>Kanban Board</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div
              style={{
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To Do</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{tasksByStatus.backlog}</div>
            </div>
            <div
              style={{
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>In Progress</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{tasksByStatus.in_progress}</div>
            </div>
            <div
              style={{
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>In Review</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{tasksByStatus.review}</div>
            </div>
            <div
              style={{
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Done</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{tasksByStatus.done}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Upcoming Task Deadlines
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                    {t.title}
                  </span>
                  <StatusBadge type="task-priority" status={t.priority} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Pending Approvals & Live Activity Log */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Pending Approvals Widget */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlaneTakeoff size={18} color="#f59e0b" />
              <span>Leave Approvals Queue</span>
            </h2>
            <Link
              href="/leave"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Manage ({pendingLeaves.length})
            </Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No pending leave requests requiring review.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingLeaves.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.employeeName}</div>
                    <span className="badge badge-warning">{req.leaveType} • {req.days}d</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {req.startDate} to {req.endDate}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    "{req.reason}"
                  </div>

                  {(currentRole === 'admin' || currentRole === 'project_manager') && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        onClick={() => reviewLeaveRequest(req.id, 'approved')}
                        className="btn btn-sm btn-success"
                        style={{ flex: 1 }}
                      >
                        <Check size={14} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          const r = prompt('Reason for rejection:') || 'Schedule conflict';
                          reviewLeaveRequest(req.id, 'rejected', r);
                        }}
                        className="btn btn-sm btn-danger"
                        style={{ flex: 1 }}
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live System Activity Feed */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#a855f7" />
              <span>Real-Time Audit Log</span>
            </h2>
            <Link
              href="/activity"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Full Feed
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {activityLog.slice(0, 5).map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  fontSize: '0.8125rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.625rem',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background:
                      log.entityType === 'attendance'
                        ? 'var(--success)'
                        : log.entityType === 'leave'
                        ? 'var(--warning)'
                        : 'var(--primary)',
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{log.actorName}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{log.timestamp}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {log.action}: <strong style={{ color: 'var(--text-primary)' }}>{log.entityName}</strong>
                  </div>
                  {log.details && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {log.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
