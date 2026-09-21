'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LeaveType } from '@/types';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import {
  PlaneTakeoff,
  Plus,
  Calendar,
  Check,
  X,
  Clock,
  HeartPulse,
  Coffee,
  AlertCircle,
} from 'lucide-react';

export default function LeavePage() {
  const {
    leaveRequests,
    leaveBalances,
    currentUser,
    currentRole,
    submitLeaveRequest,
    reviewLeaveRequest,
  } = useApp();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [form, setForm] = useState({
    leaveType: 'Annual' as LeaveType,
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
  });

  const myBalance = leaveBalances[currentUser.id] || {
    employeeId: currentUser.id,
    annualTotal: 20,
    annualUsed: 0,
    sickTotal: 10,
    sickUsed: 0,
    casualTotal: 7,
    casualUsed: 0,
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) {
      alert('Please fill out all fields.');
      return;
    }
    submitLeaveRequest({
      employeeId: currentUser.id,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      days: Number(form.days) || 1,
      reason: form.reason,
    });
    setIsApplyModalOpen(false);
    setForm({
      leaveType: 'Annual',
      startDate: '',
      endDate: '',
      days: 1,
      reason: '',
    });
  };

  const filteredRequests = leaveRequests.filter((req) => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    // If regular employee, show only own requests unless viewing team history
    if (currentRole === 'employee') {
      return req.employeeId === currentUser.id;
    }
    return true;
  });

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
            <PlaneTakeoff size={28} color="var(--primary)" />
            <span>Leave Management</span>
          </h1>
          <p className="subtext" style={{ marginTop: '0.25rem' }}>
            Annual leave balance allocations, team calendar visibility, and manager review workflow.
          </p>
        </div>

        <button onClick={() => setIsApplyModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balance Meters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="heading-sm">Annual Vacation</span>
            <PlaneTakeoff size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800 }}>
            {myBalance.annualTotal - myBalance.annualUsed}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {' '}/ {myBalance.annualTotal} days left
            </span>
          </div>
          <div className="progress-container" style={{ marginTop: '0.5rem' }}>
            <div
              className="progress-bar"
              style={{
                width: `${(myBalance.annualUsed / myBalance.annualTotal) * 100}%`,
                background: 'var(--primary)',
              }}
            />
          </div>
          <div className="subtext">{myBalance.annualUsed} days used this year</div>
        </div>

        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="heading-sm">Sick Leave</span>
            <HeartPulse size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800 }}>
            {myBalance.sickTotal - myBalance.sickUsed}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {' '}/ {myBalance.sickTotal} days left
            </span>
          </div>
          <div className="progress-container" style={{ marginTop: '0.5rem' }}>
            <div
              className="progress-bar"
              style={{
                width: `${(myBalance.sickUsed / myBalance.sickTotal) * 100}%`,
                background: '#ef4444',
              }}
            />
          </div>
          <div className="subtext">{myBalance.sickUsed} days used this year</div>
        </div>

        <div className="glass-card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="heading-sm">Casual / Personal</span>
            <Coffee size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800 }}>
            {myBalance.casualTotal - myBalance.casualUsed}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {' '}/ {myBalance.casualTotal} days left
            </span>
          </div>
          <div className="progress-container" style={{ marginTop: '0.5rem' }}>
            <div
              className="progress-bar"
              style={{
                width: `${(myBalance.casualUsed / myBalance.casualTotal) * 100}%`,
                background: '#f59e0b',
              }}
            />
          </div>
          <div className="subtext">{myBalance.casualUsed} days used this year</div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <h2 className="heading-md">
            {currentRole === 'employee' ? 'My Leave Applications' : 'Team Leave Requests Queue'}
          </h2>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                {(currentRole === 'admin' || currentRole === 'project_manager') && (
                  <th style={{ textAlign: 'right' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}
                  >
                    No leave requests found for this status.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.employeeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Applied: {req.appliedOn}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{req.leaveType}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {req.startDate} to {req.endDate}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{req.days} {req.days === 1 ? 'day' : 'days'}</span>
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div>{req.reason}</div>
                      {req.rejectionReason && (
                        <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>
                          Reason: {req.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge type="leave" status={req.status} />
                    </td>
                    {(currentRole === 'admin' || currentRole === 'project_manager') && (
                      <td style={{ textAlign: 'right' }}>
                        {req.status === 'pending' ? (
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => reviewLeaveRequest(req.id, 'approved')}
                              className="btn btn-sm btn-success"
                              title="Approve Leave"
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                const r = prompt('Rejection reason:') || 'Workload constraints';
                                reviewLeaveRequest(req.id, 'rejected', r);
                              }}
                              className="btn btn-sm btn-danger"
                              title="Reject Leave"
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {req.approvedBy || 'Processed'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Leave Type</label>
            <select
              className="form-select"
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value as LeaveType })}
            >
              <option value="Annual">Annual Vacation</option>
              <option value="Sick">Sick Leave</option>
              <option value="Casual">Casual / Personal</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Total Days *</label>
            <input
              type="number"
              min="1"
              max="30"
              required
              className="form-input"
              value={form.days}
              onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Justification *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide context for manager review..."
              className="form-textarea"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsApplyModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Leave Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
