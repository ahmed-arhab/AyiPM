create table projects (
    id            uuid        primary key,
    name          text        not null,
    client        text        not null default '',
    description   text        not null default '',
    start_date    date        not null,
    end_date      date        not null,
    status        varchar(16) not null check (status in ('planning', 'in_progress', 'in_review', 'on_hold', 'completed')),
    manager_id    uuid        references users (id),
    budget        text,
    created_by_id uuid        not null references users (id),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    check (end_date >= start_date)
);

create table project_members (
    project_id uuid not null references projects (id) on delete cascade,
    user_id    uuid not null references users (id) on delete cascade,
    primary key (project_id, user_id)
);
create index project_members_user_id_idx on project_members (user_id);

-- "position" orders a task within its status column; it is shared across projects, like the board.
create table tasks (
    id            uuid        primary key,
    project_id    uuid        not null references projects (id) on delete cascade,
    title         text        not null,
    description   text        not null default '',
    assignee_id   uuid        references users (id),
    priority      varchar(8)  not null check (priority in ('urgent', 'high', 'medium', 'low')),
    status        varchar(16) not null check (status in ('backlog', 'in_progress', 'review', 'done')),
    due_date      date        not null,
    position      integer     not null,
    created_by_id uuid        not null references users (id),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);
create index tasks_project_id_idx on tasks (project_id);
create index tasks_status_position_idx on tasks (status, position);

create table task_comments (
    id         uuid        primary key,
    task_id    uuid        not null references tasks (id) on delete cascade,
    author_id  uuid        not null references users (id),
    text       text        not null,
    created_at timestamptz not null default now()
);
create index task_comments_task_id_idx on task_comments (task_id);

create table task_history (
    id         uuid        primary key,
    task_id    uuid        not null references tasks (id) on delete cascade,
    actor_id   uuid        not null references users (id),
    action     text        not null,
    created_at timestamptz not null default now()
);
create index task_history_task_id_idx on task_history (task_id);
