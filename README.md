<p align="center">
  <img src="public/logo.svg" alt="AyiPM" width="200" />
</p>

# AyiPM

AyiPM is an open-source, self-hostable workspace for small teams. It keeps people, attendance, leave, projects and tasks in one place, so you can stop tracking who is in today, who is on leave and who is working on what across spreadsheets and chat threads.

It started as an internal tool and is now developed in the open. Contributions of every size are welcome, from fixing a colour to building backend features.

The app is built with Next.js 16 and TypeScript. Accounts, sign-in and workspace settings are stored in a database (SQLite locally, through Prisma) and served by the app's own API routes. Projects, tasks, attendance and leave are still kept in the browser while they are moved to the database one area at a time.

## Features

- **Dashboard**: project and task statistics, project progress, upcoming and overdue deadlines, recent activity, and pending leave approvals for reviewers.
- **Team**: member directory with search and filters, member profiles, role changes, deactivation, and project assignment. New members are added by invitation.
- **Attendance**: check in and check out, with late arrivals and half days worked out from the workspace schedule. Includes a monthly summary and CSV export.
- **Leave**: leave requests, yearly balances, and approval or rejection by reviewers. Approved leave is written to attendance automatically.
- **Projects**: list and detail views. Progress is calculated from the project's tasks.
- **Tasks**: Kanban board with drag and drop, a filterable list view, comments, and a change history for every task.
- **Notifications and activity log**: notifications go to the people involved in a change; the activity log records every change for auditing.
- **Profile and settings**: profile photo, personal details, password changes, theme, date and time formats, notification preferences, and (for admins) workspace rules such as working hours and leave allowance.

## Roles

| | Admin | Project Manager | Employee |
| --- | :-: | :-: | :-: |
| Invite and manage team members | Yes | | |
| Change workspace settings | Yes | | |
| Create and edit projects | Yes | Yes | |
| Create, edit and assign tasks | Yes | Yes | |
| Move tasks on the board | Yes | Yes | Own tasks |
| Review leave requests | Yes | Yes | |
| View and export everyone's attendance | Yes | Yes | |
| View the full activity log | Yes | Yes | Own actions |
| Check in, request leave, comment on tasks | Yes | Yes | Yes |

Permissions are defined once in `src/constants/roles.ts`. The UI and the store actions both check them.

## Getting started

You need Node.js 20.9 or newer (Next.js 16 does not run on older versions). If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` to select the supported version.

```bash
git clone https://github.com/mahfoos/AyiPM.git
cd AyiPM
nvm use
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed   # optional: creates the demo accounts below
npm run dev
```

Then open http://localhost:3000. If you ran `npm run db:seed`, sign in with one of the demo accounts. Otherwise you are taken to **/setup**, where you create the workspace and its owner account. The setup page locks itself as soon as that first account exists.

### Demo accounts for local development

`npm run db:seed` creates one account for each role, all with the temporary password **`ChangeMe@123`**:

| Role | Email |
| --- | --- |
| Admin | `admin@example.com` |
| Project Manager | `pm@example.com` |
| Employee | `employee@example.com` |

Use them to check that a change works for every role. The seed only runs on an empty database and refuses to run when `NODE_ENV=production`, so it can't add a known password to a real workspace. If your database already has accounts, run `npm run db:reset` and then `npm run db:seed`. Never use these accounts on a shared or public server.

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build (also type-checks) |
| `npm run start` | Serve the production build |
| `npx tsc --noEmit` | Type-check without building |
| `npm run db:migrate` | Apply database migrations (and create the database the first time) |
| `npm run db:seed` | Create the demo accounts on an empty database |
| `npm run db:studio` | Browse and edit the database in Prisma Studio |
| `npm run db:reset` | Delete all data and re-run every migration |

No linter is set up yet. Next.js 16 removed `next lint`, so ESLint needs its own configuration when it is added.

Both `package-lock.json` and `pnpm-lock.yaml` are kept in the repository. If you change dependencies, update both: run `npm install`, then `pnpm install --lockfile-only`.

### If you can't sign in locally

- **Each developer has their own database.** `prisma/dev.db` is not committed, so accounts created on someone else's machine don't exist on yours. Run `npm run db:seed` or go through `/setup`.
- **The account may be locked.** After 5 failed attempts the account is locked for 15 minutes, and even the correct password is refused until then. To unlock it straight away, open `npm run db:studio` and delete the account's row in `LoginAttempt`.
- **Invited members need to accept their invitation first.** Until they set a password through the invite link, their login is refused. Invite links expire after 7 days; an admin can send a new one from the member's profile.
- **`npm run db:reset` deletes every account.** Run `npm run db:seed` or go through `/setup` again afterwards.

## Accounts and sign-in

There is no public sign-up. The only account anyone creates themselves is the workspace owner, once, on `/setup`. After that, accounts work the way they do in tools like ClickUp or Jira:

1. An admin adds a person from **Team → Add member**. AyiPM creates an Employee ID and an invitation link that is valid for 7 days. The person shows as **Invited** until they accept it.
2. The person opens the link (`/accept-invite`), chooses a password and lands in the workspace.
3. After that, they sign in with their work email and password. "Keep me signed in" extends the session from 12 hours to 30 days.

If someone can't sign in, they use **Can't log in?** on the login page. Their profile on the Team page is then marked **Reset requested**, and an admin sends them a one-time reset link (valid for 30 minutes) from that profile.

After 5 failed attempts within 15 minutes, an account is locked for 15 minutes. Login errors never say whether an account exists.

Passwords are hashed on the server with scrypt. Sessions are random tokens kept in an `httpOnly` cookie and stored hashed in the database, so signing out or deactivating someone ends their session everywhere.

## Database

Local development uses SQLite, stored in `prisma/dev.db`. The schema lives in `prisma/schema.prisma`, and migrations are in `prisma/migrations`.

To use Postgres instead, change `provider` to `"postgresql"` in `prisma/schema.prisma`, set `DATABASE_URL` in `.env` to your Postgres connection string, and run `npm run db:migrate`.

## Known limitations

- **Partly local data.** Projects, tasks, attendance, leave, notifications and the activity log are still stored in the browser, so they are not yet shared between devices.
- **No email delivery.** Invitation and reset links are shown to the admin, who shares them manually.
- **No single sign-on.** Google and Microsoft sign-in are not available yet.

## Project structure

```text
prisma/                  Database schema, migrations and the demo-account seed
src/
├── app/                 Route files; each page renders one feature view
│   └── api/             API routes (setup, auth, employees, workspace)
├── server/              Server-only code: database client, auth, sessions, services
├── features/<feature>/  Feature code: components/, hooks/, utils.ts, CSS modules
├── components/
│   ├── ui/              Shared building blocks (Button, Modal, Field, DataTable, ...)
│   ├── animate-ui/      Animated primitives from the animate-ui registry (Tailwind-based)
│   ├── layout/          App shell, sidebar, navbar, route guarding
│   └── feedback/        Toasts and confirmation dialogs
├── store/               State, actions (one file per domain), selectors, hooks, persistence
├── hooks/               Generic React hooks
├── lib/                 Framework-free helpers (store engine, dates, CSV, crypto, validation)
├── constants/           Roles and permissions, status labels, navigation, defaults
└── types/               Domain types, one file per domain
```

A few rules keep the code consistent:

- Pages in `src/app` stay thin; the UI lives in `src/features`.
- Components read state through narrow selectors (`useAppStore(s => s.tasks)`, `useEmployeesById()`) and change it only through store actions. Actions validate input, check permissions and return `{ ok, data }` or `{ ok, error }`.
- Records refer to each other by id. A task stores `assigneeId`, not a copy of the assignee's name.
- Styles use a CSS module per component plus the design tokens in `src/app/globals.css`. Colours come from the grey palette defined there. Tailwind is loaded for the `animate-ui` components; feature code still uses CSS modules.

## Contributing

Work is tracked in GitHub issues, and every change goes through a pull request to `main`. Issues are labelled by difficulty, so it's easy to find a good first one:

- [Beginner issues](https://github.com/mahfoos/AyiPM/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3A%22level%3A+beginner%22)
- [Intermediate issues](https://github.com/mahfoos/AyiPM/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3A%22level%3A+intermediate%22)
- [Advanced issues](https://github.com/mahfoos/AyiPM/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3A%22level%3A+advanced%22)

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to claim an issue, the branch and commit conventions, and the review checklist. Questions and ideas are welcome in [Discussions](https://github.com/mahfoos/AyiPM/discussions).

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md). To report a security problem, please follow [SECURITY.md](SECURITY.md) rather than opening a public issue.

## License

AyiPM is released under the [MIT License](LICENSE).
