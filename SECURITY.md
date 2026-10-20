# Security Policy

## Reporting a vulnerability

Please **do not** report security problems in public issues, pull requests or discussions.

Report them privately through GitHub instead:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Describe the problem, how to reproduce it, and what an attacker could do with it.

You'll get an acknowledgement within a few days. Once the issue is confirmed, we'll work on a fix and agree with you on when to disclose it publicly. If you'd like to be credited, say so in your report.

## What's in scope

The areas we most care about are:

- Sign-in, sessions and password handling (`backend/src/main/java/com/ayitrix/ayipm/auth`)
- Invitation and password reset links
- Permission checks in the backend controllers
- Anything that could expose one user's data to another

## Supported versions

AyiPM is under active development and has no versioned releases yet. Security fixes are made on the `main` branch.
