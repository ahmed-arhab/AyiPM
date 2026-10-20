create table user_preferences (
    user_id             uuid        primary key references users (id) on delete cascade,
    language            text        not null,
    date_format         varchar(16) not null,
    time_format         varchar(8)  not null,
    week_start          varchar(8)  not null,
    notify_task         boolean     not null default true,
    notify_project      boolean     not null default true,
    notify_leave        boolean     not null default true,
    notify_attendance   boolean     not null default true,
    notify_system       boolean     not null default true,
    updated_at          timestamptz not null default now()
);

-- Actor name and role are copied so entries still read correctly after someone is renamed or changes role.
create table activity_log (
    id          uuid        primary key,
    actor_id    uuid        not null references users (id) on delete cascade,
    actor_name  text        not null,
    actor_role  varchar(32) not null,
    action      text        not null,
    entity_type varchar(16) not null check (entity_type in ('employee', 'project', 'task', 'attendance', 'leave', 'auth', 'settings')),
    entity_id   text,
    entity_name text        not null,
    details     text,
    created_at  timestamptz not null default now()
);
create index activity_log_created_at_idx on activity_log (created_at desc);
create index activity_log_actor_id_idx on activity_log (actor_id);

create table notifications (
    id           uuid        primary key,
    recipient_id uuid        not null references users (id) on delete cascade,
    title        text        not null,
    message      text        not null,
    category     varchar(16) not null check (category in ('task', 'leave', 'attendance', 'project', 'system')),
    priority     varchar(8)  not null check (priority in ('urgent', 'high', 'normal', 'low')),
    read         boolean     not null default false,
    link         text,
    sender_id    uuid        references users (id) on delete set null,
    created_at   timestamptz not null default now()
);
create index notifications_recipient_created_idx on notifications (recipient_id, created_at desc);
