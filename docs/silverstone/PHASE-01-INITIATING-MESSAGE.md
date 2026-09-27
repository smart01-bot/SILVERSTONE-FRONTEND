> Publication update — 27 September 2026: The user authorized remote development branches and publication of Phase 0 findings after the original read-only review. Both branches are based on the audited main commits. See README.md and PROJECT-STATE.md for current status. Historical statements below about unpublished documents or absent development branches describe the original review, not current state. Architecture proposals remain unapproved unless explicitly recorded otherwise.

Initiate Silverstone Phase 1 — Dependable Foundation.

Act as my full-stack engineering collaborator. Read the attached Phase 0 documentation pack completely. Preserve Silverstone branding, the existing registration wizard and useful screen layouts. Silverstone charges no service fee.

Verified Phase 0 source pins (re-fetch before use):
- smart01-bot/SILVERSTONE-FRONTEND main: e12cb22e802687e3e805d5d8f819779a6ee34452
- Frontend donor feat/registration-wizard: a2db831bc8d9e81d3d3cac9b78386723ed925e43
- smart01-bot/SILVERSTONE-BACKEND main: 17f7276198af5593fd277f940e7212768a8d0ddd

Proposed working branches: development in both repositories, created locally from the above main pins. They did not exist remotely at the Phase 0 review. No remote starting SHA is claimed for development.

Authority: LOCAL IMPLEMENTATION ONLY. I authorize isolated dependency installation, local builds and tests using disposable synthetic databases, overriding the historical frontend HANDOFF.md instruction against agent installs/builds for this phase only. Do not push, create remote branches, merge, modify main, change repository settings, deploy, access/change live databases or execute real payments. Publication authority: NONE.

Phase 0 decisions D03–D11 remain proposals. Before architecture-dependent edits, present the compact decision list and obtain my adoption or corrections: main-based development branches with selective wizard adaptation; frontend canonical docs; Expo→Express→PostgreSQL/Supabase/private storage; hardened Express as sole identity authority versus retained Firebase issuer if existing users justify it; scoped assignment/review; acceptance/reservation before collection; durable database jobs; versioned API and money representation. You may complete independent read-only verification and reversible test-harness preparation while these decisions are unresolved. Do not claim the Phase 0 agreement gate passed until decisions are recorded.

Before implementation:
1. Fetch current branches/pins; inspect changes if they differ. Never reset newer work to these pins.
2. Confirm local HEAD and clean/dirty status; preserve unrelated work; read all applicable AGENTS.md and current repo documents.
3. Read canonical project context/state, decisions, API contract, issues, design guidelines, permissions/dependencies, plan, evidence and Phase 0 handoff. If unpublished, use the attached pack and state that limitation.
4. Report exact bases, proposed branches, outstanding decisions, affected files, migration risks and validation plan before editing code.

Implement the adopted Phase 1 scope:
- Separate Express app from server/worker startup; repair model/import/schema mismatches.
- Establish ordered migrations, empty-db and sanitized legacy-fixture validation; no live-schema assumptions.
- Isolate tests before any table deletion/Redis cleanup. Fix actual lint/test configuration.
- Establish one consistent auth/API identity and DTO, restrictive current account/role/owner/assignment checks, purpose-bound recovery and revocable sessions.
- Connect login/me/pending behavior while preserving the wizard. Fix loader binding, id/profile/PIN inconsistencies and active legacy data paths.
- Keep financial execution disabled until later gates. Do not implement fake settlement to satisfy a test.
- Prepare canonical frontend docs/silverstone plus backend docs/SILVERSTONE-CONTEXT.md pointer locally.

Completion gate: reproducible isolated startup; migrations pass on empty and legacy-fixture databases; auth/API connection works; pending/suspended/unknown status cannot operate; cross-owner and cross-reviewer access denied; reset token cannot authenticate API requests; frontend Android bundle and relevant contract/static tests pass. Record actual commands and disclose native/device gaps. There is no root npm run build; establish an appropriate Expo validation command. No cloud publishing builds under this authority.

Outstanding external decisions: existing user/schema inventory and migration; required evidence/retention/terms; first main-agent approval; SMS/email/private storage access; provider capabilities/charges/settlement; native Android build ownership. Do not block independent synthetic foundation work on unrelated provider access, and do not declare missing dependencies resolved.

Finish with the Phase 1 handoff, files changed, exact local base/commit state, tests and limitations, unchanged remote/publication status, and a copy-ready Phase 2 initiating message. Do not advance automatically.
