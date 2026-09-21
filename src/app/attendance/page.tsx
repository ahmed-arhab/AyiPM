'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import StatusBadge from '@/components/StatusBadge';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  LogOut,
  Download,
  Filter,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  Check,
} from 'lucide-react';

export default function AttendancePage() {
  const { attendance, employees, currentUser, currentRole, checkIn, checkOut } = useApp();

  const [dateFilter, setDateFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [exportNotice, setExportNotice] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const myRecordToday = attendance.find(
    (a) => a.employeeId === currentUser.id && a.date === todayStr
  );

  const isCheckedIn = Boolean(myRecordToday && myRecordToday.checkIn !== '—');
  const isCheckedOut = Boolean(myRecordToday && myRecordToday.checkOut);

  const filteredAttendance = attendance.filter((rec) => {
    const matchesDate = !dateFilter || rec.date === dateFilter;
    const matchesEmp = employeeFilter === 'all' || rec.employeeId === employeeFilter;
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    return matchesDate && matchesEmp && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = 'ID,Employee,Date,CheckIn,CheckOut,Hours,Status,Notes\n';
    const rows = filteredAttendance
      .map(
        (r) =>
          `"${r.id}","${r.employeeName}","${r.date}","${r.checkIn}","${r.checkOut || 'N/A'}",${r.workingHours || 0},"${r.status}","${r.notes || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayipm-attendance-report-${todayStr}.csv`;
    a.click();
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="page-container">
      {/* Header */}
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
          <h1 className="heading-xl" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <CalendarCheck size={28} color="var(--primary)" />
            <span>Attendance & Working Hours</span>
          </h1>
          <p className="subtext" style={{ marginTop: '0.25rem' }}>
            Daily check-in logs, automatic punctuality derivation (grace period: 09:15), and monthly audit summaries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={16} />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-md)',
            color: '#34d399',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Check size={16} />
          <span>Attendance CSV report downloaded successfully!</span>
        </div>
      )}

      {/* Attendance Check-in Station Card */}
      <div
        className="glass-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center',
          borderLeft: '4px solid var(--primary)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Personal Attendance Station
          </span>
          <h2 className="heading-lg" style={{ marginTop: '0.25rem' }}>
            {currentUser.name}
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Standard Shift: 09:00 AM – 05:30 PM (Grace window: 15 mins)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status Today</span>
            <div style={{ marginTop: '0.25rem' }}>
              {myRecordToday ? (
                <StatusBadge type="attendance" status={myRecordToday.status} />
              ) : (
                <span className="badge badge-neutral">Not Checked In</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time In</span>
            <span style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>
              {myRecordToday?.checkIn || '—'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time Out</span>
            <span style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>
              {myRecordToday?.checkOut || '—'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {!isCheckedIn ? (
            <button onClick={() => checkIn()} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              <CheckCircle2 size={18} />
              <span>Check In Now</span>
            </button>
          ) : !isCheckedOut ? (
            <button
              onClick={() => checkOut()}
              className="btn btn-danger"
              style={{ padding: '0.75rem 1.5rem' }}
            >
              <LogOut size={18} />
              <span>Check Out</span>
            </button>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: 600 }}>
                Shift Completed
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Total: {myRecordToday?.workingHours} hrs logged
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Filter row */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('daily')}
            className={`btn btn-sm ${activeTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Daily Ledger
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`btn btn-sm ${activeTab === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Monthly Summary
          </button>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '0.4rem 0.6rem' }}
            />
          </div>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="leave">On Leave</option>
            <option value="absent">Absent</option>
          </select>

          {(dateFilter || employeeFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setDateFilter('');
                setEmployeeFilter('all');
                setStatusFilter('all');
              }}
              className="btn btn-sm btn-outline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {activeTab === 'daily' ? (
        /* Attendance Table */
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Notes / Derivation Rule</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No attendance records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{rec.date}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rec.employeeName}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{rec.checkIn}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{rec.checkOut || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {rec.workingHours ? `${rec.workingHours} hrs` : '—'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge type="attendance" status={rec.status} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {rec.notes || 'Normal attendance'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Monthly Grid Summary */
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 className="heading-md">September 2026 Monthly Attendance Ledger</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {employees.map((emp) => {
              const empRecords = attendance.filter((a) => a.employeeId === emp.id);
              const present = empRecords.filter((a) => a.status === 'present').length;
              const late = empRecords.filter((a) => a.status === 'late').length;
              const onLeave = empRecords.filter((a) => a.status === 'leave').length;
              const totalHours = empRecords.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);

              return (
                <div
                  key={emp.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={emp.avatar} alt={emp.name} className="avatar" style={{ width: '36px', height: '36px' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.designation}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                    <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Present</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}>{present}</div>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Late</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#d97706' }}>{late}</div>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Leave</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0284c7' }}>{onLeave}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Total Hours Logged:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalHours.toFixed(1)} hrs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
