# Phase 1 authentication activation — REOPENED

Date: 8 October 2026

Phase 1 authentication is **not accepted as complete** until the installed Android app can authenticate against the hosted Silverstone environment. Earlier local PostgreSQL/API tests remain useful implementation evidence, but they are not release acceptance.

## Target architecture

- GitHub stores the frontend/backend source and development history.
- Render runs the Silverstone Express API from `SILVERSTONE-BACKEND`.
- Supabase PostgreSQL stores the authoritative `ss_v1` Silverstone records, including agents, applications, assignments, sessions and refresh-token records. Supabase Auth is not required for this architecture; Express remains the credential/session authority.
- Upstash Redis is supporting infrastructure for distributed ephemeral concerns such as rate limiting/coordination. It is not the agent identity database.
- The APK talks to Render over HTTPS. The APK must never connect directly to PostgreSQL or receive database credentials.

## Required agent journey

1. New agent begins registration from the app and supplies credentials and onboarding information.
2. Express writes the account and onboarding state into the hosted `ss_v1` schema in Supabase PostgreSQL.
3. Registration remains pending until the assigned authorized main-agent reviews the submitted application.
4. Approval sets `application_status=approved` and `account_status=active`. Rejected/corrections states remain non-operational.
5. An approved agent signs in with email/password through `POST /api/v1/auth/login` on Render.
6. On the first approved sign-in on a device, the app requires a four-digit PIN and confirmation. The PIN is device-local and stored in the platform secure store; it is not an agent password and is not stored in Supabase.
7. Later app launches restore the revocable Express session from secure storage and show the PIN screen instead of asking for email/password again.
8. The in-app Sign Out/lock action returns the retained account to the PIN screen without revoking the server session.
9. `Not <first name>?` on the PIN screen performs the real server logout/session revocation, clears the retained credentials, and returns to email/password so another account can sign in.
10. Invalid credentials, pending, suspended/closed and unknown states must fail or route appropriately and never gain operational access.

## Repository activation changes

Backend development now supports an explicitly enabled remote PostgreSQL target while preserving local-only defaults. Hosted targets require SSL and remote migrations require a separate explicit opt-in. Hosted API startup can bind to `0.0.0.0` for Render.

Frontend development now documents a hosted `EXPO_PUBLIC_API_URL`, directs fully signed-out users to email/password, retains secure session restoration into the PIN screen, and separates app lock from account switching.

## Live environment gate

Do not mark Phase 1 complete until all of the following are observed against the real hosted environment:

- Render backend is reachable over HTTPS and `/health` succeeds against the intended Supabase PostgreSQL database.
- All expected `ss_v1` migrations are reviewed and applied to the intended Supabase project without damaging unrelated existing data.
- At least one securely provisioned authorized main-agent/reviewer account exists through an approved bootstrap procedure.
- A new sub-agent can register from the APK and the resulting rows/draft/submission are visible in the intended Supabase database.
- Main-agent approval activates that exact sub-agent account.
- The approved account logs in from a physical Android APK using email/password.
- First login requires PIN creation + confirmation; subsequent app restart requires PIN only.
- In-app lock returns to PIN while `Not <name>?` revokes the current account session and returns to email/password.
- Refresh/session restoration and logout revocation are verified after app/process restart.
- Pending, suspended/closed and invalid-credential journeys are verified.
- Production APK contains no fixture/mock authentication path and points only at the intended public API URL.
- Upstash production rate-limiting/coordination configuration is verified separately; failure of optional cache features must not create an authentication bypass.

## Current limitations

No live Supabase schema was modified by this repository change. No Render service/environment variable was changed. No Upstash credentials were configured. No APK/device verification was performed in this change. Those actions require the corresponding hosted service access and remain part of this reopened Phase 1 completion gate.
