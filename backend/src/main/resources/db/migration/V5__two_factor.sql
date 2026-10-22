-- Two-factor authentication with an authenticator app (TOTP). The secrets are AES-GCM ciphertext under the key in
-- ayipm.two-factor.encryption-key. The pending secret is the one shown during setup, before it is confirmed with a code.
-- The last step is the most recent 30-second TOTP time step accepted, so the same code can't be used twice.
alter table users
    add column two_factor_secret         text,
    add column two_factor_pending_secret text,
    add column two_factor_enabled_at     timestamptz,
    add column two_factor_last_step      bigint;

alter table workspace
    add column require_admin_two_factor boolean not null default false;

-- Stored as SHA-256 hashes. A code is deleted when it is used.
create table recovery_codes (
    id         uuid        primary key,
    user_id    uuid        not null references users (id) on delete cascade,
    code_hash  varchar(64) not null,
    created_at timestamptz not null default now(),
    unique (user_id, code_hash)
);

-- A sign-in whose password was right and that still needs a code, or two-factor setup when the workspace requires it.
create table login_challenges (
    id             uuid        primary key,
    token_hash     varchar(64) not null unique,
    user_id        uuid        not null references users (id) on delete cascade,
    remember       boolean     not null,
    setup_required boolean     not null,
    expires_at     timestamptz not null,
    created_at     timestamptz not null default now()
);
create index login_challenges_user_id_idx on login_challenges (user_id);
