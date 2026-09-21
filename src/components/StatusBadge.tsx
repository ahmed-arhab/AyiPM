import React from 'react';

interface StatusBadgeProps {
  type: 'attendance' | 'project' | 'task-priority' | 'task-status' | 'leave';
  status: string;
}

export default function StatusBadge({ type, status }: StatusBadgeProps) {
  let badgeClass = 'badge-neutral';
  let label = status.replace('_', ' ');

  if (type === 'attendance') {
    switch (status) {
      case 'present':
        badgeClass = 'badge-success';
        label = 'Present';
        break;
      case 'late':
        badgeClass = 'badge-warning';
        label = 'Late';
        break;
      case 'half_day':
        badgeClass = 'badge-warning';
        label = 'Half Day';
        break;
      case 'absent':
        badgeClass = 'badge-danger';
        label = 'Absent';
        break;
      case 'leave':
        badgeClass = 'badge-info';
        label = 'On Leave';
        break;
    }
  } else if (type === 'project') {
    switch (status) {
      case 'planning':
        badgeClass = 'badge-purple';
        label = 'Planning';
        break;
      case 'in_progress':
        badgeClass = 'badge-info';
        label = 'In Progress';
        break;
      case 'in_review':
        badgeClass = 'badge-warning';
        label = 'In Review';
        break;
      case 'completed':
        badgeClass = 'badge-success';
        label = 'Completed';
        break;
      case 'on_hold':
        badgeClass = 'badge-danger';
        label = 'On Hold';
        break;
    }
  } else if (type === 'task-priority') {
    switch (status) {
      case 'urgent':
        badgeClass = 'badge-danger';
        label = 'Urgent';
        break;
      case 'high':
        badgeClass = 'badge-warning';
        label = 'High';
        break;
      case 'medium':
        badgeClass = 'badge-info';
        label = 'Medium';
        break;
      case 'low':
        badgeClass = 'badge-neutral';
        label = 'Low';
        break;
    }
  } else if (type === 'task-status') {
    switch (status) {
      case 'backlog':
        badgeClass = 'badge-neutral';
        label = 'To Do';
        break;
      case 'in_progress':
        badgeClass = 'badge-info';
        label = 'In Progress';
        break;
      case 'review':
        badgeClass = 'badge-warning';
        label = 'In Review';
        break;
      case 'done':
        badgeClass = 'badge-success';
        label = 'Done';
        break;
    }
  } else if (type === 'leave') {
    switch (status) {
      case 'approved':
        badgeClass = 'badge-success';
        label = 'Approved';
        break;
      case 'pending':
        badgeClass = 'badge-warning';
        label = 'Pending Review';
        break;
      case 'rejected':
        badgeClass = 'badge-danger';
        label = 'Rejected';
        break;
    }
  }

  return <span className={`badge ${badgeClass}`}>{label}</span>;
}
