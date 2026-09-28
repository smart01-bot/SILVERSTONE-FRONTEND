# Silverstone Phase 2 — Registration, KYC/KYB and Manual Approval

Date: 27 September 2026 (Africa/Dar_es_Salaam). **Local implementation delivered; full acceptance PARTIAL. Nothing pushed or deployed. Phase 3 not started.**

## Baseline and authority

| Repository | Working branch | Expected and verified remote development | Required starting local HEAD |
| --- | --- | --- | --- |
| Frontend | development | e92ad465429b54aa5c707d330e7d67badbeee631 | 66bf0e479f422421bc1732bef314ac156867d989 |
| Backend | development | 8002e9b8d2c5d9393bad5c1fec5898ea0393adf0 | 2bd0e2818ad6e1841c0b6df7fbce6fcd20fc0af2 |

Both retained checkouts started clean, one unpublished Phase 1 commit ahead. Current remote refs matched the expected pins through the authenticated GitHub integration. No applicable repository or ancestor AGENTS.md was found. The attached context/handoff, canonical shared docs, both setup guides and repository Phase 1 handoff were read. Historical root handoff install/build restrictions are superseded by the user's explicit local implementation/verification authority. Main remains outside the work scope.

Final local commits and clean status are recorded in the closing delivery header; a commit cannot embed its own SHA. The remote branches still do not contain Phases 1 or 2. Retain the checkouts or the incremental bundles in the delivery ZIP. Do not start from remote Phase 0 alone.

Phase 1 was revalidated: its 15 backend and 6 frontend tests passed. The native Android and native PostgreSQL gaps remained open: no adb/emulator, PostgreSQL server/client or Docker executable was available. The approved Expo → Express → PostgreSQL foundation remains the active graph. Existing Firebase users, data and deployments were neither read nor changed. No live database, real notifications, payments or provider calls were used.

## Implemented

- Authenticated, version-checked server drafts. New applicants create pending sub-agent credentials in the personal step; subsequent resume starts from their saved details. Passwords/roles/verification flags are excluded from draft data. Business Save draft and each successful Next persist changes. Unsaved keystrokes are not promised durable. Back-stack versions update together, without remounting screens or restarting corrections.
- Existing phone/personal/business/map/selfie/review sequence, branding, typography and established styles retained. Phone step clearly says delivery unavailable. Selfie selects a real photo for private manual review; no simulated match/confidence claim. TIN, licence and selfie are prototype evidence requirements from the existing wizard, not confirmed compliance policy.
- Strict submission validation for personal/business fields, E.164 account phone, network codes, coordinates and whole-TZS string capacity. Partial drafts can be saved; submission requires completeness, an assignment and a server phone-verification record.
- Private PNG/JPEG upload, maximum 2 MiB/file, maximum 16 million pixels, 30 immutable objects/applicant. Validated filename, kind, MIME/content signatures, PNG chunk CRC/inflation bounds, JPEG dimensions; content hash deduplication. PDF/HTML/SVG rejected. Files remain in private ss_v1 bytea rows; no public URLs, filesystem paths or static route. Metadata and content reads authenticate, recheck scope and emit access audit events with no-store responses.
- Immutable submission snapshots, evidence links and one append-only decision per revision. Database triggers reject update/deletion of these historical records. Corrections preserve the prior revision and documents; applicants edit the existing draft and submit a new version.
- Main-agent application list/detail, private image inspection, reason input, fields-to-correct selection, approve/reject/request-corrections. Explicit reviewer grant AND current assignment AND active approved main-agent status required. Unsubmitted draft contents are excluded from reviewer responses. No public role provisioning/assignment/verification write endpoint exists.
- Transactional decisions lock accounts/grant/assignment, compare the current submitted version and prevent duplicate/concurrent decisions. Reviewer identity, reason, fields and time are server-recorded. Approval atomically sets application approved/account active. Rejection/corrections retain pending operational restrictions. Suspension is never cleared by an approval race.
- Pending, correction and rejection progress views display actual server status and review reason. Corrections resume saved fields/evidence. Approval enters existing PIN setup before dashboard access. Backend operation gates require active + approved; device PIN never substitutes for server authorization. PIN device behavior remains untested here.
- Controlled isolated bootstrap grants only main@example.test review authority and marks pending@example.test with source=synthetic_fixture. This is NOT an OTP or real phone-control check. Other main-agent fixture has no grant by default. Native/production startup never imports this bootstrap. No public API can generate this fixture proof.

## Verification evidence

| Command/check | Result |
| --- | --- |
| Backend npm test | 26 passing tests, zero failures, disposable embedded PostgreSQL |
| Backend npm run build | Passed: 19 JS files syntax checked; 8-file active import graph; no import-time startup |
| SILVERSTONE_FRONTEND_PATH=../frontend node scripts/client-integration.js | Passed actual frontend client → HTTP → Express → embedded PostgreSQL auth lifecycle |
| SILVERSTONE_FRONTEND_PATH=../frontend node scripts/onboarding-client-integration.js | Passed actual client + wizard field mapping: save/restore/private upload/submit/correction/resubmit/approve/access; payments still disabled |
| Frontend npm test | 9 passing tests, zero failures |
| EXPO_PUBLIC_API_URL=http://10.0.2.2:8800/api/v1 npm run build:check | Passed Android JavaScript/Hermes export; not an APK or device run |
| Changed frontend JS/JSX undefined-binding check | Zero undefined bindings (ESLint no-undef) |
| git diff --check, both repos | Passed |
| Native Android/PIN/SecureStore/camera picker/accessibility/keyboard screenshots | Not performed; device/emulator unavailable |
| Native PostgreSQL concurrency/upgrade | Not performed; external server unavailable; embedded-engine evidence only |

Negative tests cover protected payload injection, invalid inputs/uploads, missing OTP/assignment, suspended access, owner/reviewer document scope, no unsent-draft leak, self-review, missing/revoked grants, wrong assignment, reassignment with an existing token, pending/rejected financial denial, stale saves/reviews and concurrent decisions. Tests verify immutable history and additive upgrade from the actual Phase 1 schema with accounts and sessions preserved. Existing public-table coexistence tests remain passing. Frontend tests cover canonical draft mapping, excluding secrets/protected fields, restoration, version propagation and existing access gates.

Runtime inherited from Phase 1: Node 24.19.0/npm 11.9.0. Existing Expo root owner warning and frontend Node module-type warning remain non-fatal. This is not a dependency-security audit. Source changes restore original style definitions; no screenshot/device usability approval is claimed. Material review/OTP/selfie/status screen changes need the device checklist below.

## Completion gate and blockers

The **synthetic API/client journey gate passes**. The complete real-app onboarding acceptance gate remains **PARTIAL**, because:

1. **No agreed delivery provider/mechanism was present in the approved decisions.** POST /applications/me/phone-verification returns 503 PHONE_PROVIDER_UNAVAILABLE. Ordinary applicants can save drafts but cannot submit without a trusted phone record. No mock digits or preview animation produce verified status. A selected provider, server-bound challenge lifecycle, expiry/attempt limits/replay tests and genuine provider sandbox evidence are still required. The schema's provider source is reserved; no implementation produces it yet.
2. Private storage works in the isolated PostgreSQL database. Supabase/object-storage selection, credentials, encryption/backup/access policy, scanning pipeline and operational retention/deletion policy are unresolved. Image validation is not malware scanning or identity verification. PDF review is intentionally unsupported, not silently approved.
3. Evidence requirements, NIDA/TIN authority checks, terms/privacy text, reviewer roster and production bootstrap/assignment policy remain owner/partner decisions. Formatting checks and a review decision do not establish regulated KYC compliance. Reject is terminal in this phase; only request-corrections permits self-service resubmission. Reopening a rejected case needs a separately designed authorized action.
4. Native Android proof remains missing: use the manual checklist below for compact/normal width, dark/light, larger text, keyboard, picker/permissions, interrupted network/relaunch, corrections, PIN setup and screen-reader labels. No real screenshots were fabricated.
5. Native PostgreSQL verification remains open. PGlite serializes embedded transactions; the concurrent HTTP tests and explicit SQL locks are not native multi-connection proof. Review list is currently limited to the first 100 submitted assigned applicants; pagination is a pre-scale follow-up.
6. Production recovery email/SMS, session/rate-limit hardening and existing-user migration remain later/separate work. Preserve legacy code and data; do not remount historical payment routes.

Silverstone service fee remains zero. Exchange creation, financial mutations and provider execution remain disabled. This phase does not establish operational financial readiness.

## Migration and recovery

002-onboarding.sql adds draft, reviewer grant, phone record, document, submission/evidence, review decision and document access tables plus immutable-history triggers, within ss_v1. It does not alter legacy/public/Firebase records or rewrite 001. Existing accounts/sessions survive the tested additive upgrade. Run explicit migrations only against the guarded disposable local development/test database; a single migrator is required. There is no destructive down migration. Stop/discard only disposable test instances for reset. Production migration, retention-compatible deletion and rollback require separate approved plans. The isolated preview resets on restart by design; a persistent guarded local PostgreSQL database retains server drafts across server restarts once native verification is available.

## Local review checklist

1. Start backend npm run dev:isolated, then the existing Expo app with the isolated API address. Use only synthetic data.
2. pending@example.test / Synthetic-only-password-2026!: Resume saved draft; fill personal/business fields and select small synthetic PNG/JPEG TIN/licence/selfie images. Save, sign out/in and resume. Submit; operational screens remain inaccessible.
3. main@example.test: open Applications, inspect the submitted images, enter a reason, select correction fields and request corrections.
4. Applicant refreshes, sees reason, resumes details, saves and resubmits. Reviewer sees a new version and prior decision, then approves with a reason.
5. Applicant refreshes → PIN setup → dashboard. Verify PIN confirmation and re-entry on an Android device; this step is not covered by the HTTP script.
6. Repeat with rejection; try other-main@example.test and sub@example.test as unauthorized reviewers. Rejected/pending accounts remain restricted. A normal newly registered account without fixture proof must be blocked at submission, with its draft retained.

## Next phase

Do not start Phase 3 in this chat. The closing delivery includes an initiating message with actual local and remote pins. It must carry these partial-gate dependencies forward and keep live/provider actions disabled. Phase 3 scope is core exchange workflow; no payment integration, live rollout or fabricated settled state.

## Changed files

### Frontend

- `LOCAL-DEVELOPMENT.md`
- `docs/silverstone/API-CONTRACT.md`
- `docs/silverstone/DECISIONS.md`
- `docs/silverstone/DESIGN-GUIDELINES.md`
- `docs/silverstone/KNOWN-ISSUES.md`
- `docs/silverstone/PERMISSIONS-AND-DEPENDENCIES.md`
- `docs/silverstone/PROJECT-CONTEXT.md`
- `docs/silverstone/PROJECT-STATE.md`
- `docs/silverstone/README.md`
- `docs/silverstone/handoffs/PHASE-02-HANDOFF.md`
- `package-lock.json`
- `package.json`
- `src/api/documents.js`
- `src/api/onboarding.js`
- `src/context/AuthContext.jsx`
- `src/navigation/AppNavigator.jsx`
- `src/screens/auth/PendingScreen.jsx`
- `src/screens/auth/Step1Phone.jsx`
- `src/screens/auth/Step2OTP.jsx`
- `src/screens/auth/Step3Personal.jsx`
- `src/screens/auth/Step4Business.jsx`
- `src/screens/auth/Step5Selfie.jsx`
- `src/screens/auth/Step6Review.jsx`
- `src/screens/main-agent/ApprovalsScreen.jsx`
- `tests/onboarding.test.mjs`
### Backend

- `LOCAL-DEVELOPMENT.md`
- `docs/PROJECT-STATE.md`
- `docs/SILVERSTONE-CONTEXT.md`
- `foundation/app.js`
- `foundation/evidence.js`
- `foundation/onboarding.js`
- `migrations/002-onboarding.sql`
- `scripts/isolated.js`
- `scripts/onboarding-client-integration.js`
- `scripts/onboarding-fixtures.js`
- `tests/foundation/onboarding.test.js`
