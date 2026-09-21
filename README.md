<p align="center">
  <img src="public/logo.png" alt="AYITRIX Logo" width="180" />
</p>

# AYITRIX PM (AyiPM) — Employee & Project Management System

> **Enterprise Employee Directory, Punctuality & Leave Tracking, and Agile Project Delivery Suite**  
> Designed for **AYITRIX** according to the 12-Week MVP Delivery Roadmap for high-performing engineering teams.

---

## 🌟 Executive Summary

**AYITRIX PM (AyiPM)** is an internal company management system engineered to replace fragile spreadsheets and disjointed chat-based workflows. Features a sleek, modern **Light Enterprise Design Theme** with electric blue & cyan brand accents, and centralizes six core operational modules into a unified, role-aware dashboard for **Administrators**, **Project Managers**, and **Employees**:

1. **Authentication & Role-Based Access Control (RBAC)** — Three personas with differentiated UI and workflow privileges.
2. **Employee Management** — Complete staff directory, department structures, designations, and soft deactivation.
3. **Attendance & Punctuality Engine** — Automatic check-in/out derivation, grace period (09:15 AM) detection, and working-hours accounting.
4. **Leave Management & Approval Workflows** — Annual balance allocations (Vacation, Sick, Casual) and two-way manager review.
5. **Projects Portfolio** — Five-stage deliverable lifecycle tracking, client attribution, budget metrics, and team rosters.
6. **Tasks & Kanban Delivery Board** — Interactive 4-column sprint board, priority indicators, deadlines, comments, and task histories.
7. **Unified Audit Log** — Real-time event ledger capturing every state modification across the entire enterprise.

---

## 🏛️ Technology Stack & Architecture Rationale

In alignment with **Week 1: Technology Selection** of the project roadmap, the stack was chosen based on team familiarity, ecosystem maturity, and zero-compromise deliverability:

| Layer | Technology | Decision Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14+ (App Router)** | Server and client component ergonomics, declarative routing, and production-ready hydration performance. |
| **Language** | **TypeScript (Strict Mode)** | End-to-end type safety across domain interfaces, reducing runtime edge-case bugs in calculation logic. |
| **Styling & Design System** | **Modular Vanilla CSS** | Custom CSS design tokens, glassmorphism surfaces (`backdrop-filter`), slate/indigo corporate palette, zero CSS library lock-in. |
| **Iconography** | **Lucide Icons** | Consistent visual language across workflows, navigation, and status badges. |
| **State & Persistence** | **React Context + Web Storage** | Zero-latency optimistic UI updates with automatic browser persistence and realistic mock seed datasets. |
| **Target Database Schema** | **PostgreSQL (12 relational tables)** | Relational integrity with foreign keys, soft deletes (`deleted_at`), and immutable audit logging. |

---

## 👥 Team Structure & Ownership Map

The project was mapped for a 4-engineer team structure where every member owns dedicated functional slices:

| Engineer | Role | Primary Responsibilities | Module Ownership |
| :--- | :--- | :--- | :--- |
| **Dev 1** | Tech Lead / Full-Stack | Architecture, relational schema, CI pipeline, code review, release management | Auth & Roles, Database Schema, Staging Deployment |
| **Dev 2** | Backend Engineer | API design, business logic (attendance derivation, leave balances), background jobs | Attendance API, Leave API, Reports Engine |
| **Dev 3** | Frontend Engineer | Navigation shell, design system tokens, forms & validation, tables & filters | UI Foundation, Employee Directory, Dashboard UI |
| **Dev 4** | Frontend + QA Lead | Kanban interaction, calendar views, responsive behavior, bug triage & test passes | Kanban Board, Leave Calendar, QA Test Plan |

---

## 🔒 Role-Based Permissions Matrix

AyiPM enforces a three-tier permission model across both presentation and operational layers:

| Capability / Action | Administrator | Project Manager | Employee |
| :--- | :---: | :---: | :---: |
| **View Dashboard Metrics** | Company-wide KPIs | Team & Sprint KPIs | Personal Work & Balances |
| **Onboard / Deactivate Employees** |  Yes |  No |  No |
| **Log Personal Attendance** |  Yes |  Yes |  Yes |
| **View All Attendance Records** |  Yes |  Yes |  Limited |
| **Export Attendance CSV** |  Yes |  Yes |  No |
| **Submit Leave Request** |  Yes |  Yes |  Yes |
| **Approve / Reject Leave Requests** |  Yes |  Yes |  No |
| **Create & Update Projects** |  Yes |  Yes |  No |
| **Create & Assign Tasks** |  Yes |  Yes |  Limited |
| **Transition Kanban Task Status** |  Yes |  Yes |  Yes (Assigned Tasks) |
| **Add Comments to Tasks** |  Yes |  Yes |  Yes |
| **Access Audit Log Feed** |  Full |  Full |  Scoped |

---

## 🗓️ 12-Week MVP Development Roadmap

```mermaid
gantt
    title AyiPM 12-Week Delivery Timeline
    dateFormat  YYYY-MM-DD
    section Setup
    Week 1: Stack & Schema Setup       :done,    des1, 2026-09-01, 2026-09-07
    section Delivery Phases
    Phase 1: Auth & Employees (W2-3)   :active,  des2, 2026-09-08, 2026-09-21
    Phase 2: Attendance & Leave (W4-6) :         des3, 2026-09-22, 2026-10-12
    Phase 3: Projects & Tasks (W7-9)   :         des4, 2026-10-13, 2026-11-02
    Phase 4: Dashboard & Reports (W10-11):      des5, 2026-11-03, 2026-11-16
    section Hardening
    Week 12: Audit, UAT & Release      :         des6, 2026-11-17, 2026-11-24
```

### Phase Summary:
- **Week 1 — Foundation**: Tech stack locked, 12-table relational schema designed, CI pipeline configured, staging environment initialized.
- **Phase 1 (Weeks 2–3) — Authentication, Roles & Employees**: Login, session handling, 3 user roles, department & designation management, employee CRUD with soft-deactivation.
- **Phase 2 (Weeks 4–6) — Attendance & Leave**: Check-in/out, status derivation rules (present, late, half-day, absent), leave balances, approval workflow, automatic attendance synchronization.
- **Phase 3 (Weeks 7–9) — Projects & Tasks**: 5-state project lifecycle, team assignment, task CRUD, Kanban board with drag-drop/quick move, due-date tracking, comments thread.
- **Phase 4 (Weeks 10–11) — Dashboard & Reports**: Role-aware counters, summary widgets, real-time activity feed, CSV report export.
- **Week 12 — Hardening & Release**: Full regression pass, permission audit, performance tuning, user documentation, and production go-live.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.17.0 or newer (tested on Node v20+)
- **npm**: v9.0.0 or newer

### Installation
```bash
# Clone the repository
git clone https://github.com/mahfoos/AyiPM.git
cd AyiPM

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💡 Key Highlights & Interactive Features

- **Live Persona Switcher**: Use the dropdown in the top header to instantly switch between **Admin**, **Project Manager**, and **Employee** perspectives to see permissions, metrics, and navigation adjust in real time.
- **Attendance Station**: Click **Check In** in the top navbar or the Attendance page. The system calculates working hours and checks punctuality (grace window until 09:15 AM).
- **Leave Approval Sync**: When an Admin or PM approves a leave request, the employee's balance is automatically updated and an attendance record for that date is logged as **On Leave**.
- **Interactive Kanban Board**: Reorder tasks across `To Do`, `In Progress`, `Review`, and `Done` columns, filter by project or priority, and inspect audit histories.
- **Reset State**: Click the reload icon in the top navigation bar anytime to reset the local browser state back to the official seed data.

---

## 🔮 Post-MVP Roadmap

As documented in **Section 07** of the roadmap specification:
- **v1.1**: Real-time notifications (email + in-app), timesheet exports, task & project file attachments.
- **v1.2**: Payroll & expense reimbursement engine building directly on verified attendance logs.
- **v1.3**: Performance evaluations, quarterly OKR tracking, and 360 review cycles.
- **v2.0**: Candidate recruitment pipelines, company asset inventory, and native mobile apps (iOS & Android).

---

## 📄 License & Contribution Standards

- **Branching Strategy**: Trunk-based development with short-lived feature branches (`feat/`, `fix/`).
- **Code Review**: Every pull request requires at least one peer approval before merging to `main`.
- **Definition of Done**: Code merged, permissions verified server-side, responsive on mobile & desktop, and audited in the activity log.
