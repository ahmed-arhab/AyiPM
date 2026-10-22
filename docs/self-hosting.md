# Self-hosting AyiPM

This guide runs AyiPM on a Linux server for real users. It sets your own database password, turns on the backend's `prod` profile, puts AyiPM behind HTTPS, and covers backups and upgrades.

To try AyiPM on your own machine, you don't need any of this: `docker compose --profile app up --build` from the [README](../README.md#run-with-docker) is enough.

## What you need

- A Linux server. Plan for at least 2 GB of memory, because the images are built on the server.
- Docker Engine with the Compose plugin, version 2.24.4 or newer. Check with `docker compose version`. The commands below assume your user can run `docker` without `sudo`.
- Git.
- A domain name, such as `ayipm.example.com`, with a DNS record that points to the server.
- Ports 80 and 443 open to the internet. Nothing else needs to be public.

## How it fits together

```text
browser ──HTTPS──> Caddy or nginx on the server (ports 80 and 443)
                     └─HTTP──> frontend, 127.0.0.1:3000 (Next.js, in Docker)
                                 └─/api──> backend:8080 (Spring Boot, in Docker)
                                             └──> postgres:5432 (in Docker)
```

Only the reverse proxy is reachable from outside. The frontend listens on 127.0.0.1 only, and the backend and Postgres aren't published at all; they talk over Docker's internal network.

The production settings are in `compose.prod.yaml`, which Docker Compose applies on top of `compose.yaml`. Your password goes in a `.env` file that git ignores. `compose.yaml` itself keeps its development defaults, so local development works as before. [What the production setup changes](#what-the-production-setup-changes) lists the details.

## 1. Get the code

The commands in this guide use `/opt/ayipm`, but any directory works.

```bash
sudo git clone https://github.com/mahfoos/AyiPM.git /opt/ayipm
sudo chown -R "$USER" /opt/ayipm
cd /opt/ayipm
```

## 2. Set the database password

Copy the example settings and fill in a random password:

```bash
cp .env.example .env
chmod 600 .env
sed -i "s/^DATABASE_PASSWORD=.*/DATABASE_PASSWORD=$(openssl rand -hex 32)/" .env
```

You can also edit `.env` by hand. A hex password like the one above is safest, because it has no characters that need quoting.

Besides the password, `.env` sets `COMPOSE_FILE=compose.yaml:compose.prod.yaml` and `COMPOSE_PROFILES=app`. Compose reads `.env` from the directory you run it in, so every `docker compose` command in this guide uses the production settings and includes the backend and frontend, without extra flags. Always run them from `/opt/ayipm`. Without `.env`, the same thing would be `docker compose -f compose.yaml -f compose.prod.yaml --profile app ...`.

Postgres sets the password only when it creates its data volume, on the first start. To change it later, see [Changing the database password](#changing-the-database-password).

## 3. Start AyiPM

```bash
docker compose up -d --build
```

The first build downloads dependencies and takes a few minutes. Then follow the backend's log until it says `Started AyipmApplication` (press Ctrl+C to stop following):

```bash
docker compose logs -f backend
```

Check that the frontend, backend and database work together:

```bash
curl http://127.0.0.1:3000/api/setup
```

It prints `{"data":{"needsSetup":true}}` until you create the workspace.

## 4. Put AyiPM behind HTTPS

The reverse proxy accepts HTTPS from browsers and forwards each request to the frontend on `127.0.0.1:3000` (or the `FRONTEND_PORT` from `.env`). It must:

- keep the original `Host` header;
- set `X-Forwarded-Proto` to `https`;
- set `X-Forwarded-For` to the client's address, replacing any value the client sent.

The backend only ever sees plain HTTP from the frontend, so it learns from `X-Forwarded-Proto` that the browser used HTTPS. That is what makes it mark the session cookie `Secure`. The frontend passes `X-Forwarded-Proto` and `X-Forwarded-For` on to the backend unchanged, and sends the `Host` it received as `X-Forwarded-Host`. The backend trusts these headers from whoever sends them, which is why the frontend listens on 127.0.0.1 only and the backend isn't published.

### Caddy

[Caddy](https://caddyserver.com) is the simplest choice. It gets and renews a Let's Encrypt certificate by itself, and by default it keeps the `Host` header and sets `X-Forwarded-Proto` and `X-Forwarded-For`, ignoring any values sent by clients.

1. Install Caddy by following [its instructions for your system](https://caddyserver.com/docs/install). On Debian and Ubuntu it then runs as the `caddy` service.
2. Replace the contents of `/etc/caddy/Caddyfile` with:

   ```caddyfile
   ayipm.example.com {
   	reverse_proxy 127.0.0.1:3000
   }
   ```

3. Reload Caddy:

   ```bash
   sudo systemctl reload caddy
   ```

Caddy gets the certificate within a few seconds of the reload. Open https://ayipm.example.com; if it doesn't load, `sudo journalctl -u caddy` shows what went wrong, usually DNS or a closed port 80.

### nginx

nginx needs the headers set explicitly and a certificate from somewhere else, for example [Certbot](https://certbot.eff.org). Create `/etc/nginx/sites-available/ayipm`:

```nginx
server {
    listen 80;
    server_name ayipm.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

Then enable it and let Certbot add HTTPS and the redirect from HTTP:

```bash
sudo ln -s /etc/nginx/sites-available/ayipm /etc/nginx/sites-enabled/ayipm
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ayipm.example.com
```

Use `$remote_addr`, not `$proxy_add_x_forwarded_for`. The backend takes the first address in `X-Forwarded-For` as the client's, and appending would let the client choose it.

### Check the session cookie

After you sign in over HTTPS (next step), open your browser's developer tools and look at the cookies for your domain. The `ayipm_session` cookie must be marked `Secure` and `HttpOnly`. If it isn't `Secure`, the reverse proxy isn't sending `X-Forwarded-Proto: https`.

## 5. Create the workspace

Open https://ayipm.example.com. AyiPM sends you to **/setup**, where you create the workspace and its owner account. The setup page locks itself as soon as that first account exists.

Do this right after AyiPM is reachable: until the owner account exists, anyone who can open the site can create it. To create it before the site is public, open an SSH tunnel with `ssh -L 3000:127.0.0.1:3000 you@your-server` and use http://localhost:3000/setup on your own machine.

Then add your team from **Team → Add member**. AyiPM doesn't send email yet, so share each invitation link yourself.

Never start a server with the `demo` profile. `compose.prod.yaml` always sets the profile to `prod`, and the backend refuses to start with `demo` and `prod` together.

## 6. Sign in with Google (optional)

To let your team sign in with their Google accounts, create a web client in Google Cloud as described in [Setting up Google](../README.md#setting-up-google). Its authorised redirect URI is your address followed by `/api/auth/google/callback`, such as `https://ayipm.example.com/api/auth/google/callback`. Then add the address and the client's ID and secret to `.env`:

```text
PUBLIC_URL=https://ayipm.example.com
GOOGLE_CLIENT_ID=1234-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
```

Run `docker compose up -d`, and check that `docker compose logs backend` says `Sign-in with Google is on. Its authorised redirect URI is https://ayipm.example.com/api/auth/google/callback`. The login page then shows **Continue with Google**. Only people who already have an account or an invitation can use it. To allow only accounts of your Google Workspace, enter its domain under **Settings → Workspace → Security**.

## Backups

All data is in Postgres, in the `postgres-data` volume. Back it up with `pg_dump`, which runs inside the Postgres container and writes the backup to the server:

```bash
mkdir -p backups
docker compose exec -T postgres pg_dump -U ayipm -d ayipm --format=custom > backups/ayipm-$(date +%F).dump
```

`-T` stops Docker from allocating a terminal, which would corrupt the output. The custom format is compressed and is restored with `pg_restore`. Copy the backups somewhere other than the server.

To take a backup every night at 03:00, add a line like this with `crontab -e` (in a crontab, `%` has to be written as `\%`):

```text
0 3 * * * cd /opt/ayipm && docker compose exec -T postgres pg_dump -U ayipm -d ayipm --format=custom > backups/ayipm-$(date +\%F).dump
```

### Restoring a backup

A restore replaces everything in the database with the contents of the backup. Stop the backend, recreate the empty database, restore into it, and start the backend again:

```bash
docker compose stop backend
docker compose exec -T postgres dropdb -U ayipm ayipm
docker compose exec -T postgres createdb -U ayipm ayipm
docker compose exec -T postgres pg_restore -U ayipm -d ayipm --no-owner < backups/ayipm-2026-10-22.dump
docker compose start backend
```

The database password isn't part of the backup, so it stays as it is. If the backup is from an older version of AyiPM, the backend brings the database up to date when it starts, as it does after an upgrade.

## Upgrading

Back up first, then pull the new version, rebuild and restart:

```bash
cd /opt/ayipm
docker compose exec -T postgres pg_dump -U ayipm -d ayipm --format=custom > backups/before-upgrade-$(date +%F).dump
git pull
docker compose pull postgres
docker compose build --pull
docker compose up -d
docker compose logs -f backend
```

`docker compose pull postgres` fetches the latest Postgres 18 patch release, and `build --pull` rebuilds the backend and frontend on up-to-date base images. `up -d` then replaces only the containers that changed. After `git pull`, compare `.env` with `.env.example` in case a new setting was added.

When the backend starts, it runs any new database migrations (Flyway) before it accepts requests. If a migration fails, the backend stops and logs the reason, and Postgres rolls that migration back. To go back to the previous version, check it out with `git checkout <commit>`, restore the backup you took, and run `docker compose up -d --build`.

`compose.yaml` pins Postgres to major version 18. A new major version can't read an older data volume, so if AyiPM ever moves to one, the upgrade notes will explain how to move your data with `pg_dump` and `pg_restore`.

`docker image prune` removes the old images afterwards.

## Day-to-day commands

| Command | What it does |
| --- | --- |
| `docker compose ps` | Show the containers and their status |
| `docker compose logs -f backend` | Follow the backend's logs |
| `docker compose restart backend` | Restart the backend |
| `docker compose down` | Stop everything; your data is kept |
| `docker compose up -d` | Start everything again |

Never run `docker compose down -v` on the server: `-v` deletes the database volume.

## Changing the database password

Postgres reads the password from `.env` only when it creates the data volume. If you change `DATABASE_PASSWORD` later, or the volume was created earlier with the development password `ayipm`, the backend logs `password authentication failed for user "ayipm"`. Change the password inside Postgres to match:

```bash
docker compose exec postgres psql -U ayipm -d ayipm -c '\password ayipm'
```

Enter the password from `.env` twice, then restart the backend with `docker compose restart backend`.

## Changing other settings

Don't edit `compose.yaml` or `compose.prod.yaml` on the server, because `git pull` would then conflict. Put your changes in a file of your own, such as `compose.local.yaml`, and add it to `COMPOSE_FILE` in `.env`:

```text
COMPOSE_FILE=compose.yaml:compose.prod.yaml:compose.local.yaml
```

For example, the backend's logs are plain text, one line per event. To get JSON instead, for a log system such as Loki or Elasticsearch, use Spring Boot's structured logging:

```yaml
# compose.local.yaml
services:
  backend:
    environment:
      LOGGING_STRUCTURED_FORMAT_CONSOLE: ecs
```

Run `docker compose up -d` after any change to `.env` or a compose file.

## What the production setup changes

`compose.prod.yaml`:

- Takes the database password from `DATABASE_PASSWORD` in `.env`. Compose refuses to start if it is missing or empty.
- Runs the backend with the `prod` profile. The profile is written in the file rather than read from `.env`, so the `demo` profile can't be turned on by accident.
- Stops publishing Postgres on port 5432, and publishes the frontend on 127.0.0.1 only.
- Restarts the containers after a crash or a reboot, and rotates their logs with Docker's `local` log driver, which keeps about 100 MB per container.

The backend's `prod` profile (`backend/src/main/resources/application-prod.yml`):

- Has no default database username or password. If `DATABASE_USERNAME` or `DATABASE_PASSWORD` is missing, the backend stops before it connects to the database and prints:

  ```text
  ***************************
  APPLICATION FAILED TO START
  ***************************

  Description:

  DATABASE_PASSWORD is not set. The prod profile has no default database credentials.

  Action:

  Set DATABASE_PASSWORD, for example in the .env file next to compose.yaml (see docs/self-hosting.md).
  ```

  It also refuses to start when the `demo` profile is on.
- Shows only `UP` or `DOWN` at the backend's `/actuator/health`, without details about the database or disk. Only containers on the Compose network can reach it.
- Turns off the startup banner and colour codes, so the logs read cleanly in `docker compose logs` and journald.

If you run the backend without Docker, start it with `SPRING_PROFILES_ACTIVE=prod` and set `DATABASE_URL`, `DATABASE_USERNAME` and `DATABASE_PASSWORD` yourself. The reverse proxy still points at the frontend, which forwards `/api` to the backend.
