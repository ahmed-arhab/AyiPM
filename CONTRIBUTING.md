# Contributing to AyiPM

This guide covers how we work on AyiPM: how to pick up work, name branches and commits, open pull requests, and what reviewers check.

## Finding something to work on

Open issues are labelled by difficulty, so you can pick one that fits your experience:

| Label | What to expect |
| --- | --- |
| `level: beginner` | Small, self-contained changes, usually in one or two files. Also labelled `good first issue`. |
| `level: intermediate` | Features or tooling across a few files. You should be comfortable with React state and the store in `frontend/src/store`, or with Spring Boot for backend work. |
| `level: advanced` | Backend, architecture or security work. Comment with your plan before you start. |

Unassigned issues by level:

- [Beginner](https://github.com/mahfoos/AyiPM/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3A%22level%3A+beginner%22)
- [Intermediate](https://github.com/mahfoos/AyiPM/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3A%22level%3A+intermediate%22)
- [Advanced](https://github.com/mahfoos/AyiPM/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3A%22level%3A+advanced%22)

Area labels (`frontend`, `backend`, `devops`, `testing`, `task`, `project`, `dashboard`, `settings`, `user-management`, `Authentication`, `accessibility`) tell you which part of the app an issue touches.

### Claiming an issue

1. **Comment on the issue** saying you'd like to work on it, and briefly how you plan to do it.
2. **Wait to be assigned.** A maintainer will assign you, usually within a day. Please don't start on an issue that is already assigned to someone else.
3. **Work on one issue at a time** if you are new to the project. Once your first pull request is merged, feel free to pick up more.

**The 7-day rule.** If there is no pull request or progress update within 7 days of being assigned, the issue may be unassigned so someone else can take it. If you need more time, just leave a comment; that's always fine.

If you get stuck, ask in the issue. Questions are welcome, and an early question saves a lot of rework.

## Workflow

Every change, however small, follows the same path:

**issue → branch → commits → pull request → review → merge**

### 1. Start from an issue

All work starts from a GitHub issue. If there isn't one for what you want to do, open it first.

A good issue has:

- **A short, imperative title**, for example "Build Project Details Page" or "Fix leave balance after rejection".
- **A task checklist** that describes what "done" means.
- **The route it affects**, if any, for example `/projects/[id]`.
- **Labels**: a level label (`level: beginner`, `level: intermediate`, `level: advanced`), an area label (see above) and a type label (`bug`, `enhancement`, `documentation`).

Make sure the issue is assigned to you before you start (see [Claiming an issue](#claiming-an-issue)), so two people don't pick up the same work.

### 2. Create a branch from the issue

Always branch from the latest `main`. Name the branch after the issue number and title:

```text
<issue-number>-<short-description>
```

For example `12-build-kanban-task-board` or `27-fix-leave-balance-after-rejection`.

The simplest way is the **Create a branch** link in the issue's sidebar on GitHub. It names the branch for you and links it to the issue. From the command line:

```bash
git checkout main
git pull
gh issue develop 12 --base main --checkout
```

Keep one issue per branch. If you find unrelated problems along the way, open a new issue for them instead of fixing them in the same branch.

### 3. Commit

Write commit messages in the [Conventional Commits](https://www.conventionalcommits.org/) style:

```text
<type>(<optional scope>): <summary in the present tense>
```

| Type | Use it for |
| --- | --- |
| `feat` | A new feature or user-visible behaviour |
| `fix` | A bug fix |
| `refactor` | Restructuring code without changing behaviour |
| `perf` | Performance improvements |
| `style` | Visual or CSS-only changes |
| `docs` | Documentation |
| `test` | Adding or changing tests |
| `chore` | Tooling, dependencies, clean-up |

Examples:

```text
feat(tasks): add drag and drop between Kanban columns
fix(leave): restore balance when a request is rejected
refactor(store): move invite links into their own module
```

Keep commits focused, and keep the summary line under about 72 characters. Add a body when the reason for a change isn't obvious from the code.

### 4. Open a pull request to `main`

Push your branch and open a pull request against `main`. The template asks for:

- **What changed and why**, in a few sentences.
- **The linked issue**, written as `Closes #12` so the issue closes automatically when the PR merges.
- **Screenshots** for UI changes, in light and dark mode.
- **How you tested it.**

Open the PR as a draft if you'd like early feedback. Mark it ready for review when the checklist below is done.

### 5. Review and merge

- Every PR needs at least one approval before it is merged.
- The author resolves review comments, or replies explaining why not.
- Merge only when the branch is up to date with `main` and the build passes.
- Delete the branch after merging.

## Before you ask for review

- [ ] Frontend changes: `npx tsc --noEmit` passes and `npm run build` succeeds (in `frontend/`).
- [ ] Backend changes: `./mvnw verify` passes (in `backend/`), with tests for new endpoints.
- [ ] The change works in light and dark mode, and at phone width.
- [ ] Permissions are respected: try it as an admin, a project manager and an employee where it matters (start the backend with the `demo` profile to get one account of each; see the README).
- [ ] Nothing in the code relies on placeholder data, test accounts or hardcoded people.
- [ ] No stray `console.log`, commented-out code or unused files.

## Code guidelines

The README describes the project structure. In practice:

### Frontend (`frontend/`)

- **Where code goes.** Route files in `src/app` only render a feature view. Feature UI lives in `src/features/<feature>/components`, feature hooks in `hooks/`, and pure helpers in `utils.ts`. Anything used by more than one feature belongs in `src/components/ui`, `src/hooks` or `src/lib`.
- **Reuse the UI kit.** Before writing a new button, modal, form field, table or empty state, check `src/components/ui`.
- **State.** Read state with narrow selectors (`useAppStore(s => s.projects)`, `useEmployeesById()`). Change it only through the actions in `src/store/actions`. Never read or write `localStorage` from a component.
- **Talking to the backend.** Call the API only through `api()` in `src/lib/api.ts`, from store actions. Use relative `/api/...` URLs; the dev server forwards them to the backend.
- **Permissions.** Check permissions with `usePermission(...)` in the UI. Store actions also call `authorize(...)`. Hiding a button is not enough on its own: the backend must refuse the action too.
- **Data.** Store ids, not copies. Resolve names and avatars through the id maps (`useEmployeesById`, `useProjectsById`).
- **Styling.** Use a CSS module next to the component, and the tokens in `globals.css` (`var(--text-primary)`, `var(--border-subtle)`, the `--gray-*` scale). Avoid large inline style objects and hardcoded colours.
- **Performance.** Memoise derived lists with `useMemo`, avoid `.find` or `.filter` inside loops over large lists, and keep per-second timers (`useNow`) inside small leaf components.
- **Comments.** Prefer clear names over comments. When a comment is needed, keep it to one line that explains *why*, not *what*.
- **Size.** If a component grows past roughly 200 lines, it is usually doing more than one job. Split it.

### Backend (`backend/`)

- **Where code goes.** Group code by feature under `com.ayitrix.ayipm` (`auth`, `employee`, `workspace`, ...). A feature has its JPA entities, Spring Data repositories, a service with the rules, and a controller. Shared helpers go in `common`.
- **Controllers stay thin.** Read the request, check the session with `SessionService.requireUser(request, permission)`, call a service, and return `ApiResponse.ok(...)`. Business rules and validation belong in the service.
- **Errors.** Throw `ApiException` with the status and a message the user can read. Anything else is logged and returned as a generic 500, so never put user-facing text in other exceptions.
- **API shape.** Responses are `{ "data": ... }` or `{ "error": "..." }`. Return records (like `EmployeeResponse`), never entities, and keep them in sync with the TypeScript types in `frontend/src/types`. Never send password hashes or tokens to the client, apart from the one-time invite or reset link an admin shares.
- **Activity and notifications.** When a change should appear in the activity log or notify someone, call `ActivityService.record(...)` and `NotificationService.notify(...)` from the service, inside the same transaction as the change. Never create them in the browser.
- **Permissions.** Every endpoint that needs a role checks it in the controller with `requireUser(request, Permission.X)`. Role permissions live in `employee/Role.java` and must match `frontend/src/constants/roles.ts`.
- **Database changes.** Add a new Flyway migration in `src/main/resources/db/migration` (for example `V2__add_projects.sql`) and update the entities to match. Never edit a migration that has been merged. Startup fails if the entities and tables disagree.
- **Tests.** Add integration tests next to the feature in `src/test/java`, extending `IntegrationTest`. They call the real API over HTTP against a temporary Postgres, so test behaviour, not internals.

## Reporting bugs

Open an issue with the `bug` label. Include:

- What you did.
- What you expected to happen.
- What happened instead.
- Your browser.
- Screenshots or console errors, if you have them.
