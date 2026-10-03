'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Employee, UserRole, Project } from '@/types';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Briefcase,
  User,
  UserCheck,
  UserX,
  X,
  Filter,
  LayoutGrid,
  List,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  CheckSquare,
  Sparkles,
  PlaneTakeoff,
  Edit3,
  ExternalLink,
  Info,
} from 'lucide-react';
import CountryPhoneInput from '@/components/CountryPhoneInput';
import AvatarUploadBadge from '@/components/AvatarUploadBadge';

export default function TeamManagementPage() {
  const {
    employees,
    currentRole,
    currentUser,
    addEmployee,
    updateEmployeeRole,
    updateEmployee,
    toggleEmployeeStatus,
    projects,
    tasks,
    attendance,
    leaveBalances,
    leaveRequests,
    setEmployeeProjects,
  } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRole, setSelectedRole] = useState<'all' | UserRole>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'role' | 'dept' | 'joined-desc'>('name-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'projects' | 'tasks' | 'leave' | 'edit'>('overview');

  // Project Assignment Modal State
  const [assignProjectMember, setAssignProjectMember] = useState<Employee | null>(null);
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);

  // Fast Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Form State
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    designation: '',
    role: 'employee' as UserRole,
    phone: '',
    location: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});

  // Dynamic Departments from current employees list
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return ['all', ...Array.from(set)];
  }, [employees]);

  // Filtered & Sorted Members
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          emp.name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.designation.toLowerCase().includes(query) ||
          emp.department.toLowerCase().includes(query) ||
          emp.location.toLowerCase().includes(query) ||
          emp.role.replace('_', ' ').toLowerCase().includes(query);

        const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
        const matchesRole = selectedRole === 'all' || emp.role === selectedRole;
        const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;

        let matchesProject = true;
        if (selectedProjectFilter === 'unassigned') {
          const empProjects = projects.filter((p) => p.members.includes(emp.id));
          matchesProject = empProjects.length === 0;
        } else if (selectedProjectFilter !== 'all') {
          const targetProj = projects.find((p) => p.id === selectedProjectFilter);
          matchesProject = targetProj ? targetProj.members.includes(emp.id) : true;
        }

        return matchesSearch && matchesDept && matchesRole && matchesStatus && matchesProject;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'role') return a.role.localeCompare(b.role);
        if (sortBy === 'dept') return a.department.localeCompare(b.department);
        if (sortBy === 'joined-desc') return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        return 0;
      });
  }, [employees, searchQuery, selectedDept, selectedRole, selectedStatus, selectedProjectFilter, sortBy, projects]);

  // Key metrics calculation
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === 'active').length;
  const adminCount = employees.filter((e) => e.role === 'admin').length;
  const pmCount = employees.filter((e) => e.role === 'project_manager').length;
  const devCount = employees.filter((e) => e.role === 'employee').length;

  const allocatedMembersCount = useMemo(() => {
    return employees.filter((e) => projects.some((p) => p.members.includes(e.id))).length;
  }, [employees, projects]);

  // Open Project Assignment Modal
  const handleOpenProjectAssign = (emp: Employee) => {
    setAssignProjectMember(emp);
    const memberProjectIds = projects.filter((p) => p.members.includes(emp.id)).map((p) => p.id);
    setAssignedProjectIds(memberProjectIds);
  };

  // Save Project Assignment
  const handleSaveProjectAssignments = () => {
    if (!assignProjectMember) return;
    setEmployeeProjects(assignProjectMember.id, assignedProjectIds);
    showToast(`Project assignments updated for ${assignProjectMember.name}`);
    setAssignProjectMember(null);
  };

  // Open Profile Modal
  const handleOpenProfile = (emp: Employee, initialTab: 'overview' | 'projects' | 'tasks' | 'leave' | 'edit' = 'overview') => {
    setSelectedMember(emp);
    setProfileTab(initialTab);
    setEditFormData({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      designation: emp.designation,
      role: emp.role,
      phone: emp.phone,
      location: emp.location,
      avatar: emp.avatar,
    });
  };

  // Save Edit Profile
  const handleSaveEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    updateEmployee(selectedMember.id, editFormData);
    setSelectedMember((prev) => (prev ? { ...prev, ...editFormData } as Employee : null));
    showToast(`Profile details saved for ${editFormData.name || selectedMember.name}`);
    setProfileTab('overview');
  };

  // Add Member
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.name || !addFormData.email || !addFormData.designation) {
      alert('Please fill out all required fields.');
      return;
    }
    addEmployee({
      ...addFormData,
      status: 'active',
      joinDate: new Date().toISOString().slice(0, 10),
    });
    setIsAddModalOpen(false);
    showToast(`Onboarded ${addFormData.name} to the team!`);
    setAddFormData({
      name: '',
      email: '',
      department: 'Engineering',
      designation: '',
      role: 'employee',
      phone: '',
      location: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });
  };

  // Fast role updater
  const handleQuickRoleChange = (empId: string, empName: string, newRole: UserRole) => {
    updateEmployeeRole(empId, newRole);
    if (selectedMember && selectedMember.id === empId) {
      setSelectedMember({ ...selectedMember, role: newRole });
    }
    showToast(`Updated ${empName}'s role to ${newRole.replace('_', ' ')}`);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDept('all');
    setSelectedRole('all');
    setSelectedStatus('all');
    setSelectedProjectFilter('all');
    setSortBy('name-asc');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedDept !== 'all' ||
    selectedRole !== 'all' ||
    selectedStatus !== 'all' ||
    selectedProjectFilter !== 'all';

  // Helper for Role Badges
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge badge-role-admin" title="Administrator: Full platform permissions">
            <Shield size={13} />
            <span>Admin</span>
          </span>
        );
      case 'project_manager':
        return (
          <span className="badge badge-role-pm" title="Project Manager: Project & task management">
            <Briefcase size={13} />
            <span>PM</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-role-employee" title="Team Member: Task delivery & attendance">
            <User size={13} />
            <span>Employee</span>
          </span>
        );
    }
  };

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
            fontSize: '0.875rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Sparkles size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <h1 className="heading-xl">Team Management</h1>
              <p className="subtext" style={{ marginTop: '0.2rem' }}>
                Directory, roles, contact profiles, and project resource allocation.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {currentRole === 'admin' ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
              id="onboard-member-btn"
            >
              <Plus size={16} />
              <span>Onboard Member</span>
            </button>
          ) : (
            <div
              style={{
                fontSize: '0.8rem',
                background: '#f1f5f9',
                color: 'var(--text-secondary)',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Info size={14} />
              <span>Admin access needed to onboard</span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="glass-card stat-card" style={{ borderTopColor: 'var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="heading-sm">Total Members</span>
            <Users size={18} color="var(--primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {totalCount}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
              {activeCount} active
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {totalCount - activeCount > 0 ? `${totalCount - activeCount} inactive account(s)` : '100% active staff'}
          </div>
        </div>

        <div className="glass-card stat-card" style={{ borderTopColor: '#06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="heading-sm">Project Allocation</span>
            <FolderKanban size={18} color="#06b6d4" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {allocatedMembersCount}/{totalCount}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              ({Math.round((allocatedMembersCount / (totalCount || 1)) * 100)}%)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Assigned to {projects.length} live project{projects.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="glass-card stat-card" style={{ borderTopColor: '#f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="heading-sm">Role Distribution</span>
            <Shield size={18} color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-role-admin" style={{ fontSize: '0.75rem' }}>
              {adminCount} Admin{adminCount === 1 ? '' : 's'}
            </span>
            <span className="badge badge-role-pm" style={{ fontSize: '0.75rem' }}>
              {pmCount} PM{pmCount === 1 ? '' : 's'}
            </span>
            <span className="badge badge-role-employee" style={{ fontSize: '0.75rem' }}>
              {devCount} Staff
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Hierarchical permissions active
          </div>
        </div>

        <div className="glass-card stat-card" style={{ borderTopColor: '#8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="heading-sm">Departments</span>
            <Briefcase size={18} color="#8b5cf6" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {departments.length - 1}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              active units
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Engineering, Product & Ops
          </div>
        </div>
      </div>

      {/* Search, Filter & View Controls */}
      <div
        className="glass-card"
        style={{
          padding: '1.125rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Member Search input */}
          <div style={{ flex: 1, minWidth: '260px', maxWidth: '520px' }}>
            <div className="search-bar-bended" style={{ height: '42px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                id="member-search-input"
                placeholder="Search member by name, email, designation, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Selectors & View Switcher */}
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Department Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <select
                id="filter-dept"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === 'all' ? 'All Departments' : d}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <select
              id="filter-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="project_manager">Project Manager</option>
              <option value="employee">Employee / Staff</option>
            </select>

            {/* Status Filter */}
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Project Filter */}
            <select
              id="filter-project"
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8125rem', maxWidth: '170px' }}
            >
              <option value="all">All Projects</option>
              <option value="unassigned">Unassigned (0 Projects)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowUpDown size={14} color="var(--text-muted)" />
              <select
                id="sort-members"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="form-select"
                style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
              >
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
                <option value="role">Role</option>
                <option value="dept">Department</option>
                <option value="joined-desc">Newest Joined</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                borderRadius: 'var(--radius-md)',
                padding: '2px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className="btn-icon"
                title="Grid Cards View"
                style={{
                  background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none',
                  padding: '0.35rem 0.55rem',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="btn-icon"
                title="Data Table View"
                style={{
                  background: viewMode === 'table' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none',
                  padding: '0.35rem 0.55rem',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Summary & Quick Clear Chips */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredEmployees.length}</strong> of{' '}
            {employees.length} team members
          </div>

          {hasActiveFilters && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filters active:</span>
              {searchQuery && (
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                  Search: &ldquo;{searchQuery}&rdquo;
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
                </span>
              )}
              {selectedDept !== 'all' && (
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                  Dept: {selectedDept}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedDept('all')} />
                </span>
              )}
              {selectedRole !== 'all' && (
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                  Role: {selectedRole}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedRole('all')} />
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                  Status: {selectedStatus}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedStatus('all')} />
                </span>
              )}
              {selectedProjectFilter !== 'all' && (
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                  Project: {selectedProjectFilter === 'unassigned' ? 'Unassigned' : projects.find((p) => p.id === selectedProjectFilter)?.name}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedProjectFilter('all')} />
                </span>
              )}
              <button
                onClick={resetFilters}
                className="btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--primary)' }}
              >
                Reset All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div
          className="glass-card"
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Users size={28} />
          </div>
          <div>
            <h3 className="heading-md">No team members match your criteria</h3>
            <p className="subtext" style={{ maxWidth: '420px', margin: '0.35rem auto 0' }}>
              Try adjusting your search terms, changing the department or role filters, or clearing your active filters.
            </p>
          </div>
          <button onClick={resetFilters} className="btn btn-secondary btn-sm">
            Clear all filters
          </button>
        </div>
      )}

      {/* Grid Cards View */}
      {viewMode === 'grid' && filteredEmployees.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredEmployees.map((emp) => {
            const memberProjects = projects.filter((p) => p.members.includes(emp.id));
            const memberTasks = tasks.filter((t) => t.assigneeId === emp.id);
            const isSelf = currentUser.id === emp.id;

            return (
              <div
                key={emp.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  borderTop: emp.status === 'active' ? '3px solid #0284c7' : '3px solid #cbd5e1',
                }}
              >
                {/* Member Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="avatar"
                      style={{ width: '52px', height: '52px', cursor: 'pointer' }}
                      onClick={() => handleOpenProfile(emp)}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '13px',
                        height: '13px',
                        borderRadius: '50%',
                        backgroundColor: emp.status === 'active' ? 'var(--success)' : '#94a3b8',
                        border: '2px solid var(--bg-card)',
                      }}
                      title={emp.status === 'active' ? 'Active' : 'Inactive'}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <h3
                        className="heading-md"
                        style={{
                          fontSize: '1rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        onClick={() => handleOpenProfile(emp)}
                      >
                        {emp.name}
                        {isSelf && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              color: 'var(--primary)',
                              marginLeft: '0.4rem',
                              fontWeight: 600,
                              background: '#e0f2fe',
                              padding: '0.1rem 0.35rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            You
                          </span>
                        )}
                      </h3>
                      {renderRoleBadge(emp.role)}
                    </div>

                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.15rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {emp.designation}
                    </div>

                    <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#0284c7',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600,
                        }}
                      >
                        {emp.department}
                      </span>
                      <span
                        className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}
                      >
                        {emp.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Location Strip */}
                <div
                  style={{
                    background: 'var(--bg-card-nested, #f8fafc)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.625rem 0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.78rem',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <a
                    href={`mailto:${emp.email}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={emp.email}
                  >
                    <Mail size={13} color="var(--primary)" />
                    <span>{emp.email}</span>
                  </a>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)' }}>
                      <MapPin size={13} />
                      <span>{emp.location || 'Remote'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)' }}>
                      <Calendar size={13} />
                      <span>Joined {emp.joinDate.slice(0, 7)}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Projects Section */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <span>Assigned Projects ({memberProjects.length})</span>
                    {(currentRole === 'admin' || currentRole === 'project_manager') && (
                      <button
                        onClick={() => handleOpenProjectAssign(emp)}
                        className="btn-ghost"
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--primary)',
                          padding: '0.15rem 0.35rem',
                          cursor: 'pointer',
                        }}
                      >
                        + Assign
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', minHeight: '32px' }}>
                    {memberProjects.length === 0 ? (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          fontStyle: 'italic',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span>No projects assigned</span>
                      </div>
                    ) : (
                      memberProjects.map((proj) => (
                        <span
                          key={proj.id}
                          className="badge badge-purple"
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={`${proj.name} (${proj.progress}% completed)`}
                        >
                          <FolderKanban size={11} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.name}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Workload Pill Indicators */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.625rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckSquare size={13} color="var(--primary)" />
                    <span>{memberTasks.length} task{memberTasks.length === 1 ? '' : 's'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={13} color="var(--warning)" />
                    <span>{memberTasks.filter((t) => t.status !== 'done').length} pending</span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: 'auto',
                  }}
                >
                  <button
                    onClick={() => handleOpenProfile(emp, 'overview')}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    View Profile
                  </button>

                  {(currentRole === 'admin' || currentRole === 'project_manager') && (
                    <button
                      onClick={() => handleOpenProjectAssign(emp)}
                      className="btn btn-outline btn-sm"
                      title="Manage project allocations"
                      style={{ padding: '0.375rem 0.65rem' }}
                    >
                      <FolderKanban size={14} color="var(--primary)" />
                      <span>Projects</span>
                    </button>
                  )}

                  {currentRole === 'admin' && !isSelf && (
                    <button
                      onClick={() => toggleEmployeeStatus(emp.id)}
                      className={`btn btn-sm ${emp.status === 'active' ? 'btn-ghost' : 'btn-success'}`}
                      style={{
                        padding: '0.375rem 0.55rem',
                        color: emp.status === 'active' ? 'var(--danger)' : undefined,
                      }}
                      title={emp.status === 'active' ? 'Deactivate member' : 'Reactivate member'}
                    >
                      {emp.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Data Table View */}
      {viewMode === 'table' && filteredEmployees.length > 0 && (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Role</th>
                <th>Status</th>
                <th>Assigned Projects</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const memberProjects = projects.filter((p) => p.members.includes(emp.id));
                const isSelf = currentUser.id === emp.id;

                return (
                  <tr key={emp.id}>
                    <td>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                        onClick={() => handleOpenProfile(emp)}
                      >
                        <div style={{ position: 'relative' }}>
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="avatar"
                            style={{ width: '38px', height: '38px' }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: emp.status === 'active' ? 'var(--success)' : '#94a3b8',
                              border: '2px solid var(--bg-card)',
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>{emp.name}</span>
                            {isSelf && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  color: 'var(--primary)',
                                  fontWeight: 600,
                                  background: '#e0f2fe',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: 'var(--radius-sm)',
                                }}
                              >
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#0284c7',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600,
                        }}
                      >
                        {emp.department}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{emp.designation}</td>
                    <td>{renderRoleBadge(emp.role)}</td>
                    <td>
                      <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '240px' }}>
                        {memberProjects.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                        ) : (
                          memberProjects.map((p) => (
                            <span
                              key={p.id}
                              className="badge badge-purple"
                              style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}
                            >
                              {p.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.joinDate}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          onClick={() => handleOpenProfile(emp, 'overview')}
                          className="btn btn-sm btn-secondary"
                        >
                          Profile
                        </button>

                        {(currentRole === 'admin' || currentRole === 'project_manager') && (
                          <button
                            onClick={() => handleOpenProjectAssign(emp)}
                            className="btn btn-sm btn-outline"
                            title="Manage project assignments"
                          >
                            <FolderKanban size={13} />
                            <span>Assign</span>
                          </button>
                        )}

                        {currentRole === 'admin' && !isSelf && (
                          <button
                            onClick={() => toggleEmployeeStatus(emp.id)}
                            className={`btn btn-sm ${emp.status === 'active' ? 'btn-ghost' : 'btn-success'}`}
                            style={{
                              color: emp.status === 'active' ? 'var(--danger)' : undefined,
                            }}
                            title={emp.status === 'active' ? 'Deactivate employee' : 'Reactivate employee'}
                          >
                            {emp.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROJECT ASSIGNMENT MODAL (Dedicated Interactive UI)                       */}
      {/* ========================================================================= */}
      {assignProjectMember && (
        <Modal
          isOpen={Boolean(assignProjectMember)}
          onClose={() => setAssignProjectMember(null)}
          title={`Assign Projects: ${assignProjectMember.name}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Target Member Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem 1rem',
                background: 'var(--bg-card-nested, #f8fafc)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <img
                src={assignProjectMember.avatar}
                alt={assignProjectMember.name}
                className="avatar"
                style={{ width: '48px', height: '48px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {assignProjectMember.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {assignProjectMember.designation} • {assignProjectMember.department}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                  {assignedProjectIds.length} allocated
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Select Active Projects to Allocate
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAssignedProjectIds(projects.map((p) => p.id))}
                  className="btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', color: 'var(--primary)' }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedProjectIds([])}
                  className="btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Projects Selection List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: '360px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No active projects available in the system.
                </div>
              ) : (
                projects.map((proj) => {
                  const isChecked = assignedProjectIds.includes(proj.id);
                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setAssignedProjectIds((prev) =>
                          prev.includes(proj.id) ? prev.filter((id) => id !== proj.id) : [...prev, proj.id]
                        );
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.875rem',
                        padding: '0.875rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: isChecked ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                        background: isChecked ? 'var(--primary-glow)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div onClick
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: 'var(--primary)',
                          cursor: 'pointer',
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {proj.name}
                          </span>
                          <StatusBadge type="project" status={proj.status} />
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Client: {proj.client} • {proj.members.length} team members assigned
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                          <div className="progress-container" style={{ flex: 1, height: '5px' }}>
                            <div className="progress-bar" style={{ width: `${proj.progress}%` }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {proj.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '1rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {assignedProjectIds.length} of {projects.length} project(s) selected
              </span>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setAssignProjectMember(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProjectAssignments}
                  className="btn btn-primary"
                >
                  <CheckCircle2 size={16} />
                  <span>Save Project Assignments</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MEMBER PROFILE MODAL (Rich Multi-Tab Drawer / Dialog)                    */}
      {/* ========================================================================= */}
      {selectedMember && (
        <Modal
          isOpen={Boolean(selectedMember)}
          onClose={() => setSelectedMember(null)}
          title={`Member Profile: ${selectedMember.name}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Profile Hero Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={selectedMember.avatar}
                  alt={selectedMember.name}
                  className="avatar"
                  style={{ width: '68px', height: '68px', border: '3px solid #e0f2fe' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: selectedMember.status === 'active' ? 'var(--success)' : '#94a3b8',
                    border: '2px solid var(--bg-card)',
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 className="heading-lg" style={{ fontSize: '1.25rem' }}>
                    {selectedMember.name}
                  </h3>
                  {renderRoleBadge(selectedMember.role)}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {selectedMember.designation} • <strong style={{ color: 'var(--text-primary)' }}>{selectedMember.department}</strong>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${selectedMember.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    Status: {selectedMember.status}
                  </span>

                  {/* Admin role changer right in profile */}
                  {currentRole === 'admin' && currentUser.id !== selectedMember.id && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Change Role:</span>
                      <select
                        value={selectedMember.role}
                        onChange={(e) =>
                          handleQuickRoleChange(selectedMember.id, selectedMember.name, e.target.value as UserRole)
                        }
                        className="form-select"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                      >
                        <option value="employee">Employee</option>
                        <option value="project_manager">Project Manager</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-subtle)',
                gap: '0.5rem',
                overflowX: 'auto',
              }}
            >
              {[
                { id: 'overview', label: 'Overview & Bio' },
                { id: 'projects', label: `Projects (${projects.filter((p) => p.members.includes(selectedMember.id)).length})` },
                { id: 'tasks', label: `Tasks (${tasks.filter((t) => t.assigneeId === selectedMember.id).length})` },
                { id: 'leave', label: 'Leave & Attendance' },
                { id: 'edit', label: 'Edit Profile' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setProfileTab(tab.id as any)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: profileTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                    color: profileTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: profileTab === tab.id ? 700 : 500,
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: OVERVIEW */}
            {profileTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Contact Card */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '0.875rem',
                    background: 'var(--bg-card-nested, #f8fafc)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <Mail size={16} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Work Email</div>
                      <a href={`mailto:${selectedMember.email}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {selectedMember.email}
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <Phone size={16} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Phone Number</div>
                      <span>{selectedMember.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <MapPin size={16} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Location / Office</div>
                      <span>{selectedMember.location || 'Remote'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <Calendar size={16} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Date Onboarded</div>
                      <span>{selectedMember.joinDate}</span>
                    </div>
                  </div>
                </div>

                {/* Role Description Card */}
                <div
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background:
                      selectedMember.role === 'admin'
                        ? 'var(--warning-bg)'
                        : selectedMember.role === 'project_manager'
                        ? 'var(--info-bg)'
                        : 'var(--success-bg)',
                    border:
                      selectedMember.role === 'admin'
                        ? '1px solid var(--warning-border)'
                        : selectedMember.role === 'project_manager'
                        ? '1px solid var(--info-border)'
                        : '1px solid var(--success-border)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {selectedMember.role === 'admin' && <Shield size={16} color="var(--warning)" />}
                    {selectedMember.role === 'project_manager' && <Briefcase size={16} color="var(--primary)" />}
                    {selectedMember.role === 'employee' && <User size={16} color="var(--success)" />}
                    <span>Role Capabilities: {selectedMember.role.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                    {selectedMember.role === 'admin'
                      ? 'Full administrator privileges. Can onboard and deactivate staff, manage system settings, approve/reject leave requests, assign project memberships, and access audit logs.'
                      : selectedMember.role === 'project_manager'
                      ? 'Project management privileges. Can plan and create projects, assign team members, create and move Kanban tasks, review deliverables, and approve team leave.'
                      : 'Standard team member. Has access to personal dashboard, assigned tasks, daily check-in / check-out attendance, leave request submission, and profile updates.'}
                  </p>
                </div>

                {/* Quick Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {projects.filter((p) => p.members.includes(selectedMember.id)).length}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Projects Assigned</div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                      {tasks.filter((t) => t.assigneeId === selectedMember.id && t.status === 'done').length}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tasks Completed</div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)' }}>
                      {tasks.filter((t) => t.assigneeId === selectedMember.id && t.status !== 'done').length}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tasks In Flight</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROJECTS */}
            {profileTab === 'projects' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Assigned Project Engagements
                  </span>
                  {(currentRole === 'admin' || currentRole === 'project_manager') && (
                    <button
                      onClick={() => handleOpenProjectAssign(selectedMember)}
                      className="btn btn-outline btn-sm"
                    >
                      <FolderKanban size={14} />
                      <span>Edit Allocations</span>
                    </button>
                  )}
                </div>

                {projects.filter((p) => p.members.includes(selectedMember.id)).length === 0 ? (
                  <div
                    style={{
                      padding: '2.5rem',
                      textAlign: 'center',
                      background: 'var(--bg-card-nested, #f8fafc)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-muted)',
                      border: '1px dashed var(--border-medium)',
                    }}
                  >
                    <FolderKanban size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.85rem' }}>No projects currently assigned to this team member.</p>
                    {(currentRole === 'admin' || currentRole === 'project_manager') && (
                      <button
                        onClick={() => handleOpenProjectAssign(selectedMember)}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '0.75rem' }}
                      >
                        Assign Projects Now
                      </button>
                    )}
                  </div>
                ) : (
                  projects
                    .filter((p) => p.members.includes(selectedMember.id))
                    .map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: '0.875rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-card-nested, #f8fafc)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                              {p.name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                              ({p.client})
                            </span>
                          </div>
                          <StatusBadge type="project" status={p.status} />
                        </div>

                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.description}</p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="progress-container" style={{ flex: 1, height: '6px' }}>
                            <div className="progress-bar" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {p.progress}% Done
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* TAB: TASKS */}
            {profileTab === 'tasks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Assigned Delivery Tasks ({tasks.filter((t) => t.assigneeId === selectedMember.id).length})
                </span>

                {tasks.filter((t) => t.assigneeId === selectedMember.id).length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No tasks currently assigned to this member.
                  </div>
                ) : (
                  tasks
                    .filter((t) => t.assigneeId === selectedMember.id)
                    .map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-card-nested, #f8fafc)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {t.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Project: {t.projectName} • Due: {t.dueDate}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <StatusBadge type="task-priority" status={t.priority} />
                          <StatusBadge type="task-status" status={t.status} />
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* TAB: LEAVE & ATTENDANCE */}
            {profileTab === 'leave' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Leave Balances Cards */}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Leave Balances (Current Year)
                  </div>
                  {leaveBalances[selectedMember.id] ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Annual Leave</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d', margin: '0.25rem 0' }}>
                          {leaveBalances[selectedMember.id].annualTotal - leaveBalances[selectedMember.id].annualUsed}{' '}
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#166534' }}>
                            / {leaveBalances[selectedMember.id].annualTotal} days
                          </span>
                        </div>
                        <div className="progress-container" style={{ height: '4px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${(leaveBalances[selectedMember.id].annualUsed / leaveBalances[selectedMember.id].annualTotal) * 100}%`,
                              background: '#22c55e',
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>Sick Leave</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: '0.25rem 0' }}>
                          {leaveBalances[selectedMember.id].sickTotal - leaveBalances[selectedMember.id].sickUsed}{' '}
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1e40af' }}>
                            / {leaveBalances[selectedMember.id].sickTotal} days
                          </span>
                        </div>
                        <div className="progress-container" style={{ height: '4px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${(leaveBalances[selectedMember.id].sickUsed / leaveBalances[selectedMember.id].sickTotal) * 100}%`,
                              background: '#3b82f6',
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          background: '#fefce8',
                          border: '1px solid #fef08a',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: 600 }}>Casual Leave</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#713f12', margin: '0.25rem 0' }}>
                          {leaveBalances[selectedMember.id].casualTotal - leaveBalances[selectedMember.id].casualUsed}{' '}
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#854d0e' }}>
                            / {leaveBalances[selectedMember.id].casualTotal} days
                          </span>
                        </div>
                        <div className="progress-container" style={{ height: '4px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${(leaveBalances[selectedMember.id].casualUsed / leaveBalances[selectedMember.id].casualTotal) * 100}%`,
                              background: '#eab308',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No standard leave records allocated yet.
                    </div>
                  )}
                </div>

                {/* Recent Attendance Records */}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Recent Attendance Log
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {attendance.filter((a) => a.employeeId === selectedMember.id).slice(0, 4).length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        No attendance entries on record.
                      </div>
                    ) : (
                      attendance
                        .filter((a) => a.employeeId === selectedMember.id)
                        .slice(0, 4)
                        .map((att) => (
                          <div
                            key={att.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg-card-nested, #f8fafc)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8125rem',
                            }}
                          >
                            <span>{att.date}</span>
                            <span>
                              In: {att.checkIn} {att.checkOut ? `• Out: ${att.checkOut}` : ''}
                            </span>
                            <StatusBadge type="attendance" status={att.status} />
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: EDIT PROFILE */}
            {profileTab === 'edit' && (
              <form onSubmit={handleSaveEditProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Work Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.department || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.designation || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <CountryPhoneInput
                    id="edit-emp-phone"
                    value={editFormData.phone || ''}
                    onChange={(fullVal) => setEditFormData({ ...editFormData, phone: fullVal })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.location || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  />
                </div>

                {currentRole === 'admin' && (
                  <div className="form-group">
                    <label className="form-label">System Role</label>
                    <select
                      className="form-select"
                      value={editFormData.role || 'employee'}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                    >
                      <option value="employee">Employee</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Profile Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <AvatarUploadBadge
                      currentAvatar={editFormData.avatar}
                      onImageSelected={(newImg) => setEditFormData({ ...editFormData, avatar: newImg })}
                      size={56}
                      badgeSize={20}
                      alt="Edit employee avatar"
                    />
                    <div style={{ flex: 1 }}>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="Or enter image URL"
                        value={editFormData.avatar || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, avatar: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setProfileTab('overview')} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Profile Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setSelectedMember(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* ONBOARD NEW MEMBER MODAL                                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Team Member"
      >
        <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Employee Avatar Preview & Upload with + badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '0.875rem 1rem',
              background: 'var(--bg-card-hover, #f8fafc)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <AvatarUploadBadge
              currentAvatar={addFormData.avatar}
              onImageSelected={(newImg) => setAddFormData({ ...addFormData, avatar: newImg })}
              size={68}
              badgeSize={24}
              alt="New employee profile"
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Employee Profile Picture
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Click the + badge on the avatar to upload an employee photo
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              className="form-input"
              value={addFormData.name}
              onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Work Email *</label>
            <input
              type="email"
              required
              placeholder="alex.m@ayipm.io"
              className="form-input"
              value={addFormData.email}
              onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={addFormData.department}
                onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Operations">Operations</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Designation *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior QA Engineer"
                className="form-input"
                value={addFormData.designation}
                onChange={(e) => setAddFormData({ ...addFormData, designation: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">System Role</label>
              <select
                className="form-select"
                value={addFormData.role}
                onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value as UserRole })}
              >
                <option value="employee">Employee</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Office / Location</label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA"
                className="form-input"
                value={addFormData.location}
                onChange={(e) => setAddFormData({ ...addFormData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <CountryPhoneInput
              id="onboard-phone"
              value={addFormData.phone}
              onChange={(fullVal) => setAddFormData({ ...addFormData, phone: fullVal })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Onboard Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
