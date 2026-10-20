<p align="center">
  <img src="frontend/public/logo.svg" alt="AyiPM" width="200" />
</p>

# AyiPM

AyiPM is an open-source, self-hostable workspace for small teams. It keeps people, attendance, leave, projects and tasks in one place, so you can stop tracking who is in today, who is on leave and who is working on what across spreadsheets and chat threads.

It started as an internal tool and is now developed in the open. Contributions of every size are welcome, from fixing a colour to building backend features.

AyiPM has two parts:

- **`frontend/`**: the web app, built with Next.js 16, React and TypeScript.
- **`backend/`**: the API, built with Java 21, Spring Boot 4 and PostgreSQL.

Accounts, sign-in and workspace settings are stored in Postgres and served by the backend. Projects, tasks, attendance and leave are still kept in the browser while they are moved to the backend one area at a time.

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

Permissions are defined in `frontend/src/constants/roles.ts` for the UI and in `backend/.../employee/Role.java` for the API. Keep the two in sync: the UI hides what you can't do, and the API refuses it.

## Run with Docker

To try AyiPM or run it for your team, you only need [Docker](https://docs.docker.com/get-docker/). From the repository root:

```bash
docker compose --profile app up --build
```

This builds and starts Postgres, the backend and the frontend. Open http://localhost:3000 and create your workspace on the **/setup** page. The first build downloads dependencies and takes a few minutes; later starts are quick.

To try it with the demo accounts instead of an empty workspace:

```bash
SPRING_PROFILES_ACTIVE=demo docker compose --profile app up --build
```

Other useful commands:

| Command | What it does |
| --- | --- |
| `docker compose --profile app up -d --build` | Start everything in the background |
| `docker compose --profile app logs -f backend` | Follow the backend's logs |
| `docker compose --profile app down` | Stop everything; your data is kept |
| `docker compose --profile app down -v` | Stop everything and delete the database |
| `FRONTEND_PORT=3005 docker compose --profile app up` | Use another port if 3000 is taken |

Data is stored in the `postgres-data` Docker volume, so it survives restarts and rebuilds. Only the frontend is published on your machine; the backend is reachable only from the frontend inside Docker. Before running it for real users, change the database password in `compose.yaml` and put it behind HTTPS.

## Getting started

This section is for working on the code. You run the backend and frontend yourself, so changes reload straight away; only Postgres runs in Docker.

You need:

- **Node.js 20.9 or newer** for the frontend. With [nvm](https://github.com/nvm-sh/nvm), `nvm use` picks the right version.
- **Java 21 or newer** for the backend. Maven is not needed; the project includes the Maven wrapper (`./mvnw`).
- **PostgreSQL**, either through Docker or installed locally.

### 1. Start Postgres

With Docker, from the repository root:

```bash
docker compose up -d
```

Without Docker, on macOS with Homebrew:

```bash
brew install postgresql@18
brew services start postgresql@18
psql postgres -c "create user ayipm with password 'ayipm'" -c "create database ayipm owner ayipm"
```

Either way you get a database called `ayipm` with user `ayipm` and password `ayipm`, which is what the backend expects by default.

### 2. Start the backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

The API runs on http://localhost:8080. It creates and updates the database tables itself on startup. The `demo` profile adds the demo accounts below; leave out `-Dspring-boot.run.profiles=demo` to start with an empty workspace instead.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
nvm use
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000. The frontend forwards every `/api` request to the backend, so the browser only ever talks to port 3000.

If you started the backend with the `demo` profile, sign in with a demo account. Otherwise you are taken to **/setup**, where you create the workspace and its owner account. The setup page locks itself as soon as that first account exists.

### Demo accounts for local development

The `demo` profile creates one account for each role, all with the temporary password **`ChangeMe@123`**:

| Role | Email |
| --- | --- |
| Admin | `admin@example.com` |
| Project Manager | `pm@example.com` |
| Employee | `employee@example.com` |

Use them to check that a change works for every role. The accounts are only created when the database has no accounts yet, and the backend refuses to start if `demo` is combined with the `prod` profile, so it can't add a known password to a real workspace. Never use these accounts on a shared or public server.

### Commands

Frontend (run in `frontend/`):

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build (also type-checks) |
| `npm run start` | Serve the production build |
| `npx tsc --noEmit` | Type-check without building |

Backend (run in `backend/`):

| Command | What it does |
| --- | --- |
| `./mvnw spring-boot:run` | Start the API (add `-Dspring-boot.run.profiles=demo` for demo accounts) |
| `./mvnw test` | Run the tests |
| `./mvnw verify` | Compile, test and package; this is what CI runs |
| `./mvnw package` | Build `target/ayipm-backend-*.jar`, which runs with `java -jar` |

The backend tests start their own temporary Postgres, so you don't need Docker or a running database to run them.

No linter is set up for the frontend yet. Next.js 16 removed `next lint`, so ESLint needs its own configuration when it is added.

The frontend keeps both `package-lock.json` and `pnpm-lock.yaml`. If you change dependencies, update both: run `npm install`, then `pnpm install --lockfile-only`.

### Configuration

| Variable | Used by | Default | What it is |
| --- | --- | --- | --- |
| `DATABASE_URL` | backend | `jdbc:postgresql://localhost:5432/ayipm` | JDBC URL of the Postgres database |
| `DATABASE_USERNAME` | backend | `ayipm` | Database user |
| `DATABASE_PASSWORD` | backend | `ayipm` | Database password |
| `PORT` | backend | `8080` | Port the API listens on |
| `BACKEND_URL` | frontend | `http://localhost:8080` | Where `/api` requests are forwarded. Read when the frontend is built, so set it before `npm run build`. |

### If you can't sign in locally

- **Each developer has their own database.** Accounts created on someone else's machine don't exist on yours. Start the backend with the `demo` profile or go through `/setup`.
- **The backend isn't running.** The login page loads from the frontend, but signing in needs the backend on port 8080. Check the backend terminal for errors, such as Postgres not running.
- **The account may be locked.** After 5 failed attempts the account is locked for 15 minutes, and even the correct password is refused until then. To unlock it straight away, run `psql ayipm -c "delete from login_attempts"`.
- **Invited members need to accept their invitation first.** Until they set a password through the invite link, their login is refused. Invite links expire after 7 days; an admin can send a new one from the member's profile.

To start over with an empty database, run `docker compose down -v` and `docker compose up -d` (Docker), or `dropdb ayipm && createdb -O ayipm ayipm` (Homebrew).

## Accounts and sign-in

There is no public sign-up. The only account anyone creates themselves is the workspace owner, once, on `/setup`. After that, accounts work the way they do in tools like ClickUp or Jira:

1. An admin adds a person from **Team → Add member**. AyiPM creates an Employee ID and an invitation link that is valid for 7 days. The person shows as **Invited** until they accept it.
2. The person opens the link (`/accept-invite`), chooses a password and lands in the workspace.
3. After that, they sign in with their work email and password. "Keep me signed in" extends the session from 12 hours to 30 days.

If someone can't sign in, they use **Can't log in?** on the login page. Their profile on the Team page is then marked **Reset requested**, and an admin sends them a one-time reset link (valid for 30 minutes) from that profile.

After 5 failed attempts within 15 minutes, an account is locked for 15 minutes. Login errors never say whether an account exists.

Passwords are hashed with Argon2. Sessions are random tokens kept in an `httpOnly` cookie and stored hashed in the database, so signing out or deactivating someone ends their session everywhere.

## Database

The backend uses PostgreSQL. The schema is managed by [Flyway](https://documentation.red-gate.com/flyway) migrations in `backend/src/main/resources/db/migration`, which run automatically when the backend starts. On startup, Hibernate also checks that the entities match the tables, so a mismatch fails fast instead of at runtime.

To change the schema, add a new file such as `V2__add_projects.sql` next to the existing ones. Never edit a migration that has already been merged, because databases that already ran it won't run it again.

## Known limitations

- **Partly local data.** Projects, tasks, attendance, leave, notifications and the activity log are still stored in the browser, so they are not yet shared between devices.
- **No email delivery.** Invitation and reset links are shown to the admin, who shares them manually.
- **No single sign-on.** Google and Microsoft sign-in are not available yet.

## Project structure

```text
compose.yaml                 Postgres for development; the full app with --profile app
frontend/                    Next.js web app
├── Dockerfile               Production image (standalone Next.js server)
├── public/                  Static files (logo, icons)
└── src/
    ├── app/                 Route files; each page renders one feature view
    ├── features/<feature>/  Feature code: components/, hooks/, utils.ts, CSS modules
    ├── components/
    │   ├── ui/              Shared building blocks (Button, Modal, Field, DataTable, ...)
    │   ├── animate-ui/      Animated primitives from the animate-ui registry (Tailwind-based)
    │   ├── layout/          App shell, sidebar, navbar, route guarding
    │   └── feedback/        Toasts and confirmation dialogs
    ├── store/               State, actions (one file per domain), selectors, hooks, persistence
    ├── hooks/               Generic React hooks
    ├── lib/                 Framework-free helpers (API client, store engine, dates, CSV, validation)
    ├── constants/           Roles and permissions, status labels, navigation, defaults
    └── types/               Domain types, one file per domain
backend/                     Spring Boot API
├── Dockerfile               Production image (builds and runs the jar)
└── src/
    ├── main/java/com/ayitrix/ayipm/
    │   ├── auth/            Setup, sign-in, sessions, invites, password resets
    │   ├── employee/        Users, roles and the /api/employees endpoints
    │   ├── workspace/       Workspace settings and /api/workspace
    │   ├── seed/            Demo accounts for the `demo` profile
    │   └── common/          Response format, error handling, shared helpers
    ├── main/resources/
    │   ├── application.yml  Configuration
    │   └── db/migration/    Flyway SQL migrations
    └── test/                Integration tests against a temporary Postgres
```

A few rules keep the code consistent.

Frontend:

- Pages in `src/app` stay thin; the UI lives in `src/features`.
- Components read state through narrow selectors (`useAppStore(s => s.tasks)`, `useEmployeesById()`) and change it only through store actions. Actions validate input, check permissions and return `{ ok, data }` or `{ ok, error }`.
- Records refer to each other by id. A task stores `assigneeId`, not a copy of the assignee's name.
- Styles use a CSS module per component plus the design tokens in `src/app/globals.css`. Colours come from the grey palette defined there. Tailwind is loaded for the `animate-ui` components; feature code still uses CSS modules.

Backend:

- Code is grouped by feature (`auth`, `employee`, `workspace`), not by layer. Each feature has its entities, repositories, a service and a controller.
- Controllers stay thin: check the session with `SessionService.requireUser(request, permission)`, call a service, and return `ApiResponse.ok(...)`.
- Every response is `{ "data": ... }` on success or `{ "error": "message" }` on failure. Throw `ApiException` for errors the user should see; anything else becomes a generic 500.
- Response records must match the TypeScript types in `frontend/src/types`. Never return entities directly, and never send password hashes or tokens other than the one-time invite or reset link.

## Contributing

Work is tracked in GitHub issues, and every change goes through a pull request to `main`. Issues are labelled by difficulty, so it's easy to find a good first one:

- [Beginner issues](https://github.com/mahfoos/AyiPM/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3A%22level%3A+beginner%22)
- [Intermediate issues](https://github.com/mahfoos/AyiPM/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3A%22level%3A+intermediate%22)
- [Advanced issues](https://github.com/mahfoos/AyiPM/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3A%22level%3A+advanced%22)

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to claim an issue, the branch and commit conventions, and the review checklist. Questions and ideas are welcome in [Discussions](https://github.com/mahfoos/AyiPM/discussions).

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md). To report a security problem, please follow [SECURITY.md](SECURITY.md) rather than opening a public issue.

## License

AyiPM is released under the [MIT License](LICENSE).
