create table workspace (
    id                       varchar(32)      primary key,
    company_name             text             not null,
    timezone                 text             not null default 'Asia/Colombo',
    work_day_start           varchar(5)       not null default '09:00',
    grace_period_minutes     integer          not null default 15,
    half_day_threshold_hours double precision not null default 4.5,
    annual_leave_days        integer          not null default 20,
    sick_leave_days          integer          not null default 10,
    casual_leave_days        integer          not null default 7,
    employee_id_prefix       varchar(5)       not null default 'AX',
    created_at               timestamptz      not null default now(),
    updated_at               timestamptz      not null default now()
);

create table users (
    id                          uuid         primary key,
    employee_id                 varchar(32)  not null unique,
    email                       varchar(320) not null unique,
    name                        text         not null,
    department                  text         not null,
    designation                 text         not null,
    role                        varchar(32)  not null check (role in ('admin', 'project_manager', 'employee')),
    status                      varchar(16)  not null default 'active' check (status in ('active', 'inactive')),
    join_date                   date         not null,
    avatar                      text,
    phone                       text,
    location                    text,
    bio                         text,
    password_hash               text,
    password_updated_at         timestamptz,
    password_reset_requested_at timestamptz,
    created_at                  timestamptz  not null default now(),
    updated_at                  timestamptz  not null default now()
);

create table sessions (
    id           uuid        primary key,
    token_hash   varchar(64) not null unique,
    user_id      uuid        not null references users (id) on delete cascade,
    expires_at   timestamptz not null,
    created_at   timestamptz not null default now(),
    last_seen_at timestamptz not null default now()
);
create index sessions_user_id_idx on sessions (user_id);

create table invites (
    id            uuid        primary key,
    token_hash    varchar(64) not null unique,
    user_id       uuid        not null references users (id) on delete cascade,
    created_by_id uuid        not null references users (id) on delete cascade,
    expires_at    timestamptz not null,
    created_at    timestamptz not null default now()
);
create index invites_user_id_idx on invites (user_id);

create table password_resets (
    id         uuid        primary key,
    token_hash varchar(64) not null unique,
    user_id    uuid        not null references users (id) on delete cascade,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);
create index password_resets_user_id_idx on password_resets (user_id);

-- Keyed by "user:<id>" for known accounts and "email:<address>" otherwise.
create table login_attempts (
    key             varchar(400) primary key,
    failures        integer      not null default 0,
    first_failed_at timestamptz  not null,
    locked_until    timestamptz
);
