## Mandatory branch policy — all phases

Confirmed by the user on 27 September 2026: all Silverstone phases must be implemented on `development` in BOTH `smart01-bot/SILVERSTONE-FRONTEND` and `smart01-bot/SILVERSTONE-BACKEND`. All phase code, fixes, tests, documentation and handoffs belong on those branches. Any authorized publication of phase work must target `development` only.

Never implement on, commit to, push to or merge into `main` under phase authority. A later main-branch release requires separate explicit user authorization. Keep `feat/registration-wizard` as a donor reference; do not use it as the continuing implementation branch. Fetch the latest `development` refs and compare with the preceding handoff before every phase; never reset newer work to historical main pins.

This policy selects the implementation branches; it does not start a phase or independently authorize deployment, live data changes or real payments. Historical proposed-branch wording is superseded by this confirmed rule. Include it in every future phase initiating message and handoff.

# Silverstone current project state

Updated: 27 September 2026.

## Branch setup authorized

The user requested separate development branches for frontend and backend and Phase 0 findings in repository state. This authorizes branch creation and documentation publication only; it does not authorize Phase 1 implementation, deployment, changes to main or live databases.

| Repository | Working branch | Source main commit |
| --- | --- | --- |
| smart01-bot/SILVERSTONE-FRONTEND | development | e12cb22e802687e3e805d5d8f819779a6ee34452 |
| smart01-bot/SILVERSTONE-BACKEND | development | 17f7276198af5593fd277f940e7212768a8d0ddd |

Both source refs were rechecked before publication and matched Phase 0. Frontend feat/registration-wizard remains at a2db831bc8d9e81d3d3cac9b78386723ed925e43 as a donor reference, not merged. Development starts with documentation-only commits on top of main. Read live development refs for current tip SHAs; this file cannot embed its own commit SHA.

## Phase status

Phase 0 source audit and documentation delivered. Branch setup and canonical documentation publication are now authorized. D03/D04 branch-base recommendations are adopted for this setup; frontend docs/silverstone is the documentation home with a backend pointer. D06–D11 architecture/operating proposals remain to be adopted or revised. Other external dependencies remain open. Phase 1 has not started.

No source fixes, installations, builds, migrations, deployment, settings changes or payment tests are part of this publication. Existing application defects remain. Main and the donor branches must remain unchanged.

## Important findings

- Backend imports missing legacy model files while newer models and legacy schema expectations diverge.
- Registration privilege/status checks, ownership and reviewer scope need repair.
- Reset-token purpose validation and session revocation need repair.
- Wizard OTP/selfie behavior is simulated and evidence persistence is incomplete.
- Frontend main uses Firebase; donor branch has incomplete API/JWT integration and inconsistent fields.
- Queue claiming, retries, offline persistence and payment confirmation are not dependable.
- No real payment-provider execution was verified.
- Current tests require isolation before execution; Phase 0 did not run them.

Read KNOWN-ISSUES.md for evidence and qualifications, API-CONTRACT.md for proposed direction, and the Phase 0 handoff before implementing. Documentation publication is not production readiness.

## Original audit baseline

# Verified repository baseline

Observed: 27 September 2026. Evidence: authenticated GitHub branch lists, recursive trees pinned to commits, commit comparisons and source reads. All three inspected source trees returned truncated=false.

| Repository | Remote ref | Verified SHA | Comparison with main |
| --- | --- | --- | --- |
| Frontend | main | e12cb22e802687e3e805d5d8f819779a6ee34452 | Baseline |
| Frontend | feat/registration-wizard | a2db831bc8d9e81d3d3cac9b78386723ed925e43 | 13 ahead, 0 behind |
| Frontend | main's-mirror | c2c50e6f0fde3e6777bb793e059349da4467198c | 13 ahead, 76 behind; merge base 77a983aa718bd1df7674a7be77c05616a13e5bef |
| Backend | main | 17f7276198af5593fd277f940e7212768a8d0ddd | Baseline |
| Backend | branch-from-main | 7f6cab162b5a1c78643e459a05baaf920f602f2a | 0 ahead, 3 behind |

Historical pins match. Branch-list responses report all listed branches protected=false. This is not a full ruleset/administration audit. Both main combined-status endpoints returned zero statuses (aggregate state pending); no .github/workflows files occur in the three inspected trees. This does not establish absence of all external CI.

## Local state

No Git checkout was created or modified. Local HEAD and Git working-tree cleanliness: not applicable. SHA-pinned text snapshots were used for source review; they are not runnable complete checkouts. Frontend git ls-remote independently returned the same branch pins. Repository refs were fetched through GET APIs; no claim of a local git fetch or clean checkout is made.

## Instructions and documents

No AGENTS.md exists in the complete frontend main, wizard or backend main trees. No applicable AGENTS.md was found in workspace ancestor paths. Gitlink targets were not recursively inspected and are not implementation targets.

Read: supplied SILVERSTONE-PROJECT-CONTEXT.md completely; frontend README.md, SETUP.md, HANDOFF.md, DEVLOG.md and nested silverstone/README.md; corresponding wizard root documents are byte-identical in the local source copies. Backend README.md, migration.sql, models, auth/agent/request/transfer controllers, routes, middleware, queue/transfer services and tests were inspected. Frontend auth context, navigator, registration steps, pending/rejected/PIN paths, approval screen, request submission, offline queue, theme, security rules and API client were inspected across main and wizard; supporting navigation, notifications, network editing and detail-modal source were also checked.

Existing HANDOFF.md says not to let the agent install/build. No install or build was performed in Phase 0. A future implementation prompt should explicitly authorize isolated dependency installation and validation if desired; do not silently treat the old instruction as removed.

## Actual stack

Root frontend package.json: Expo ~51.0.28, React Native 0.74.5, React 18.2.0. main uses Firebase Auth / Firestore. Wizard replaces core auth with Express JWT / SecureStore but retains Firebase code, including notification listeners. Nested silverstone/ is a separate starter, not the root app. Root scripts have no npm run build, lint or test script; most invoke shell-specific nvm setup. Wizard adds native Android source and changes android/ios scripts to expo run commands.

Backend: Express ^5.1.0, pg-promise ^11.15.0, Redis ^5.8.1, jsonwebtoken ^9.0.2, bcrypt ^6.0.0. These are declared ranges, not verified installed versions. Code connects using DATABASE_URL. Live schema, deployed version, users, storage contents and provider credentials were not examined.

## Phase state

Phase 0 inspection and documentation preparation are delivered. Essential architecture-agreement gate remains open: decisions are proposed, and there is no agreed API contract or selected working branch yet. No implementation phase is complete. No application build, runtime exploit test, Android test, database migration test or provider test was run.

See DECISIONS.md, KNOWN-ISSUES.md, API-CONTRACT.md and handoffs/PHASE-00-HANDOFF.md.
