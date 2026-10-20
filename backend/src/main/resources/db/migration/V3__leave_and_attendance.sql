-- Approved leave writes "leave" rows here. Check-in and check-out are added by the attendance API (#103).
create table attendance_records (
    id            uuid             primary key,
    user_id       uuid             not null references users (id) on delete cascade,
    date          date             not null,
    check_in_at   timestamptz,
    check_out_at  timestamptz,
    working_hours double precision,
    status        varchar(16)      not null check (status in ('present', 'late', 'half_day', 'absent', 'leave')),
    notes         text,
    created_at    timestamptz      not null default now(),
    updated_at    timestamptz      not null default now(),
    unique (user_id, date)
);

create table leave_requests (
    id               uuid        primary key,
    user_id          uuid        not null references users (id) on delete cascade,
    leave_type       varchar(8)  not null check (leave_type in ('Annual', 'Sick', 'Casual', 'Unpaid')),
    start_date       date        not null,
    end_date         date        not null,
    days             integer     not null check (days > 0),
    reason           text        not null,
    status           varchar(8)  not null check (status in ('pending', 'approved', 'rejected')),
    applied_on       date        not null,
    reviewed_by_id   uuid        references users (id),
    reviewed_at      timestamptz,
    rejection_reason text,
    created_at       timestamptz not null default now(),
    check (end_date >= start_date)
);
create index leave_requests_user_id_idx on leave_requests (user_id);
