-- Sign-in with Google. The subject is Google's permanent id for the account (the "sub" claim). It is saved the first
-- time someone signs in with Google, so a different Google account that later gets the same address can't sign in as
-- them. People who accept their invitation with Google have a subject and no password.
alter table users
    add column google_subject varchar(255) unique;

-- Only Google accounts of this Google Workspace domain (the "hd" claim) may sign in with Google. Null allows any
-- Google account whose verified address belongs to a member.
alter table workspace
    add column allowed_google_domain text;

-- A sign-in that was sent to Google and hasn't come back yet. The browser keeps a random token in a cookie; the state,
-- nonce and PKCE verifier are derived from it, so only the token's hash is stored. The row is deleted when used.
-- The invited user is set when the sign-in started from an invitation, which only that person's Google account accepts.
create table google_sign_ins (
    id              uuid        primary key,
    token_hash      varchar(64) not null unique,
    invited_user_id uuid        references users (id) on delete cascade,
    expires_at      timestamptz not null,
    created_at      timestamptz not null default now()
);
create index google_sign_ins_invited_user_id_idx on google_sign_ins (invited_user_id);
