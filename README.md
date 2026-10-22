<p align="center">
  <img src="frontend/public/logo.svg" alt="AyiPM" width="200" />
</p>

# AyiPM

AyiPM is an open-source, self-hostable workspace for small teams. It keeps people, attendance, leave, projects and tasks in one place, so you can stop tracking who is in today, who is on leave and who is working on what across spreadsheets and chat threads.

It started as an internal tool and is now developed in the open. Contributions of every size are welcome, from fixing a colour to building backend features.

AyiPM has two parts:

- **`frontend/`**: the web app, built with Next.js 16, React and TypeScript.
- **`backend/`**: the API, built with Java 21, Spring Boot 4 and PostgreSQL.

Everything the team shares is stored in Postgres and served by the backend: accounts, projects, tasks, leave, notifications, the activity log and each person's preferences. Attendance check-ins are the one thing the frontend still keeps in the browser: the backend's attendance API is ready, and the frontend switches to it in #105.

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

Data is stored in the `postgres-data` Docker volume, so it survives restarts and rebuilds. Only the frontend is published on your machine; the backend is reachable only from the frontend inside Docker.

These defaults are for trying AyiPM out: the database password is `ayipm` and there is no HTTPS. To run it on a server for real users, follow the [self-hosting guide](docs/self-hosting.md). It sets your own database password in a `.env` file, turns on the backend's `prod` profile, puts AyiPM behind HTTPS with Caddy or nginx, and covers backups and upgrades. The HTTPS proxy should pass on the original `Host` and set `X-Forwarded-Proto`; if it can't, set `ALLOWED_ORIGINS=https://your-domain`, or saving anything fails with "Requests from other sites are not allowed." Also read [Client addresses behind a proxy](#client-addresses-behind-a-proxy), so the sign-in limits still apply to each client separately.

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

To see every endpoint and try them in the browser, open Swagger UI at http://localhost:8080/swagger-ui.html. The OpenAPI spec it reads is at http://localhost:8080/v3/api-docs. Most endpoints need a session, so first run `POST /api/auth/login` with **Try it out**: the backend sets the session cookie and your browser sends it with the requests that follow, so there is nothing to enter under **Authorize**. Swagger UI is served by the backend, so it isn't reachable through the frontend on port 3000 or with Docker Compose.

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

It also adds sample data so the app isn't empty: three projects, eight tasks with comments, two weeks of attendance, and two leave requests (one approved, one waiting for review).

Use them to check that a change works for every role. The accounts and sample data are only created when the database has no accounts yet, and the backend refuses to start if `demo` is combined with the `prod` profile, so it can't add a known password to a real workspace. Never use these accounts on a shared or public server.

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
| `DATABASE_USERNAME` | backend | `ayipm` (none with the `prod` profile) | Database user |
| `DATABASE_PASSWORD` | backend | `ayipm` (none with the `prod` profile) | Database password |
| `PORT` | backend | `8080` | Port the API listens on |
| `RATE_LIMIT_MAX_REQUESTS` | backend | `10` | Requests one client address may make to each sign-in endpoint per window (`ayipm.rate-limit.max-requests`). After that it gets `429 Too Many Requests` with a `Retry-After` header. |
| `RATE_LIMIT_WINDOW` | backend | `1m` | Length of that window, such as `30s`, `1m` or `15m` (`ayipm.rate-limit.window`) |
| `TRUSTED_PROXIES` | backend | empty (`frontend` in Docker Compose) | Proxies whose `X-Forwarded-For` header is believed, as comma-separated IP addresses, CIDR ranges or hostnames (`ayipm.trusted-proxies`). Read [Client addresses behind a proxy](#client-addresses-behind-a-proxy) before changing it. |
| `ALLOWED_ORIGINS` | backend | `http://localhost:3000` | Comma-separated sites, such as `https://pm.example.com`, that may send requests that change data (the `ayipm.allowed-origins` property). The address the frontend is opened at is recognised through its proxy, so you only need this when a proxy in front of AyiPM doesn't pass on the original `Host` and `X-Forwarded-Proto` headers. |
| `SPRINGDOC_APIDOCS_ENABLED` | backend | `true` | Whether the OpenAPI spec is served at `/v3/api-docs` (`springdoc.api-docs.enabled`). Set to `false` in production. |
| `SPRINGDOC_SWAGGERUI_ENABLED` | backend | `true` | Whether Swagger UI is served at `/swagger-ui.html` (`springdoc.swagger-ui.enabled`). Set to `false` in production. |
| `TWO_FACTOR_ENCRYPTION_KEY` | backend | empty | Sets `ayipm.two-factor.encryption-key`: 32 random bytes in base64 that encrypt the authenticator secrets of two-factor authentication. Generate one with `openssl rand -base64 32` and keep it secret, like a database password. While it is empty, two-factor authentication can't be turned on and everything else works as usual; if it is set but isn't a valid key, the backend refuses to start. Don't change or remove it once people use two-factor authentication: their authenticator codes stop working and they can only sign in with a recovery code. |
| `BACKEND_URL` | frontend | `http://localhost:8080` | Where `/api` requests are forwarded. Read when the frontend is built, so set it before `npm run build`. |

### If you can't sign in locally

- **Each developer has their own database.** Accounts created on someone else's machine don't exist on yours. Start the backend with the `demo` profile or go through `/setup`.
- **The backend isn't running.** The login page loads from the frontend, but signing in needs the backend on port 8080. Check the backend terminal for errors, such as Postgres not running.
- **The account may be locked.** After 5 failed attempts the account is locked for 15 minutes, and even the correct password is refused until then. To unlock it straight away, run `psql ayipm -c "delete from login_attempts"`.
- **Your address may be rate limited.** "Too many attempts. Try again in ..." means 10 sign-in requests from your address within a minute. Wait for the time in the message, or restart the backend to clear the counts.
- **Invited members need to accept their invitation first.** Until they set a password through the invite link, their login is refused. Invite links expire after 7 days; an admin can send a new one from the member's profile.
- **Two-factor authentication is on and the phone and recovery codes are gone.** Turn it off for that account in the database: `psql ayipm -c "update users set two_factor_secret = null, two_factor_last_step = null where email = 'name@company.com'"`, and turn it on again from My Profile after signing in.

To start over with an empty database, run `docker compose down -v` and `docker compose up -d` (Docker), or `dropdb ayipm && createdb -O ayipm ayipm` (Homebrew).

## Accounts and sign-in

There is no public sign-up. The only account anyone creates themselves is the workspace owner, once, on `/setup`. After that, accounts work the way they do in tools like ClickUp or Jira:

1. An admin adds a person from **Team → Add member**. AyiPM creates an Employee ID and an invitation link that is valid for 7 days. The person shows as **Invited** until they accept it.
2. The person opens the link (`/accept-invite`), chooses a password and lands in the workspace.
3. After that, they sign in with their work email and password. "Keep me signed in" extends the session from 12 hours to 30 days.

If someone can't sign in, they use **Can't log in?** on the login page. Their profile on the Team page is then marked **Reset requested**, and an admin sends them a one-time reset link (valid for 30 minutes) from that profile.

After 5 failed attempts within 15 minutes, an account is locked for 15 minutes. Login errors never say whether an account exists.

Separately, each client address can make 10 requests a minute to each sign-in endpoint (`/api/setup`, `/api/auth/login`, the two-factor code steps under `/api/auth/login/two-factor`, `/api/auth/forgot`, `/api/auth/invite` and `/api/auth/reset`), so one address can't work through many accounts. Further requests get `429 Too Many Requests` with a `Retry-After` header. The counts are kept in memory, so they start over when the backend restarts. IPv6 clients are counted per /64 network, because one subscriber usually gets a whole /64.

Passwords are hashed with Argon2. Sessions are random tokens kept in an `httpOnly` cookie and stored hashed in the database, so signing out or deactivating someone ends their session everywhere.

So that a page on another site can't use someone's session cookie, the backend refuses `POST`, `PUT`, `PATCH` and `DELETE` requests with `403` when they come from another site. It compares the `Origin` header (or `Referer`, if there is no `Origin`) with its own address and with `ALLOWED_ORIGINS`. Behind the frontend's proxy, its own address is the one in the browser's address bar, because the proxy passes it on in `X-Forwarded-Host`. `Origin: null`, which sandboxed pages and local files send, is refused. Requests with neither header, such as from `curl` or another server, are allowed: browsers always send `Origin` with these methods, and a client outside the browser only has the cookies it signed in for itself.

### Client addresses behind a proxy

The backend only sees connections from the frontend. So that it can still tell clients apart, the frontend's production server (the Docker image and `npm start`) adds the address each request came from to the end of the `X-Forwarded-For` header (`frontend/scripts/client-address.cjs`). The backend reads that header from right to left, skips the proxies listed in `TRUSTED_PROXIES`, and counts the request against the first other address. Anything further left was written by the client, so it is never used.

Docker Compose sets `TRUSTED_PROXIES=frontend`, so each client gets its own limit without any setup. Outside Docker the setting is empty: the backend ignores `X-Forwarded-For`, and every request counts against the frontend's address. To trust a frontend on the same machine, set `TRUSTED_PROXIES=127.0.0.1,::1`, but only with `npm start`: `next dev` doesn't add the address, so a client could choose its own.

If a reverse proxy such as Caddy or nginx sits in front of the frontend, the frontend sees the proxy's address instead of the client's. Then:

1. Make sure the proxy sets `X-Forwarded-For`. Caddy does by default; with nginx, add `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`.
2. Add the proxy to `TRUSTED_PROXIES`, as the frontend sees it. With Docker and the proxy on the same machine, that is the Docker network's gateway, for example `TRUSTED_PROXIES=frontend,172.16.0.0/12`. Add any proxies in front of yours, such as a CDN, too.
3. Make the frontend reachable only through the proxy, for example with `FRONTEND_PORT=127.0.0.1:3000`. A client that connects from a trusted address can name any address it likes.

### Two-factor authentication

Anyone can turn on two-factor authentication in **My Profile** once the server has `TWO_FACTOR_ENCRYPTION_KEY` set (see [Configuration](#configuration)). They scan a QR code with an authenticator app such as Google Authenticator, Microsoft Authenticator or 1Password, and it only takes effect once they confirm a code from the app. They then get 10 one-time recovery codes, shown once, for when they can't use their phone.

After that, signing in takes a third step: after the email and password, AyiPM asks for the 6-digit code from the app, or a recovery code. Each code works only once, and wrong codes count toward the same lockout as wrong passwords. Turning two-factor authentication off, or creating new recovery codes, also needs a current code or a recovery code.

Admins can require two-factor authentication for every admin under **Settings → Workspace → Security**. They can only turn it on once they use it themselves, so the workspace always keeps an admin who can sign in. Other admins without it are signed out, and set it up the next time they sign in, before they get a session; so do people who become admins later. While it is required, admins can't turn it off. The authenticator secrets are encrypted with AES-GCM, and recovery codes are stored only as hashes.

## Database

The backend uses PostgreSQL. The schema is managed by [Flyway](https://documentation.red-gate.com/flyway) migrations in `backend/src/main/resources/db/migration`, which run automatically when the backend starts. On startup, Hibernate also checks that the entities match the tables, so a mismatch fails fast instead of at runtime.

To change the schema, add a new file such as `V2__add_projects.sql` next to the existing ones. Never edit a migration that has already been merged, because databases that already ran it won't run it again.

## Known limitations

- **Attendance is still per browser.** Check-ins and check-outs are saved in the browser until the frontend uses the attendance API (#105), so managers don't see them yet. Approved leave is already written to the server.
- **Sign-in rate limits are kept per backend instance.** The counts live in memory, so they start over when the backend restarts and aren't shared if you run several backends.
- **No live updates.** Changes made by other people appear when you reload or switch back to the tab; notifications are checked every minute.
- **No email delivery.** Invitation and reset links are shown to the admin, who shares them manually.
- **No single sign-on.** Google and Microsoft sign-in are not available yet.

## Project structure

```text
compose.yaml                 Postgres for development; the full app with --profile app
compose.prod.yaml            Production settings on top of compose.yaml (see docs/self-hosting.md)
docs/                        Guides: self-hosting.md
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
    │   ├── auth/            Setup, sign-in, sessions, invites, password resets, two-factor authentication
    │   ├── employee/        Users, roles and the /api/employees endpoints
    │   ├── workspace/       Workspace settings and /api/workspace
    │   ├── project/         Projects and their members
    │   ├── task/            Tasks, comments, history and Kanban order
    │   ├── leave/           Leave requests, reviews and balances
    │   ├── attendance/      Check-in, check-out, and late and half-day rules
    │   ├── preferences/     Each person's language, formats and notification settings
    │   ├── activity/        The activity log, written by the other services
    │   ├── notification/    Notifications, created by the other services
    │   ├── seed/            Demo accounts and sample data for the `demo` profile
    │   └── common/          Response format, error handling, shared helpers
    ├── main/resources/
    │   ├── application.yml  Configuration
    │   ├── application-prod.yml  Overrides for the `prod` profile
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
- If an endpoint's method name and path don't say what it does, add `@Operation(summary = "...")`. Swagger UI shows it next to the endpoint.
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
