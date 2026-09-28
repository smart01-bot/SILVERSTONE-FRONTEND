# Silverstone Phase 3 — Core Exchange Workflow

Date: 27 September 2026, Africa/Dar_es_Salaam. **Local synthetic implementation verified. Release acceptance remains PARTIAL. Nothing pushed, deployed or settled. Phase 4 not started.**

## Authority and baseline

The user explicitly approved D09/D10 in this chat, directed that they be recorded as approved, and authorized local implementation and verification on development in both repositories. No main changes, live database access, Firebase migration, real notifications, provider execution or manual settlement were authorized or performed. Silverstone service fee remains zero.

| Repository | Starting local Phase 2 HEAD | Remote development, reverified unchanged |
| --- | --- | --- |
| smart01-bot/SILVERSTONE-FRONTEND | 419fef2fb218ca3c4d3091f88c6bbd9d2c25213f | e92ad465429b54aa5c707d330e7d67badbeee631 |
| smart01-bot/SILVERSTONE-BACKEND | e4f31b46f6bdfa0868db19a5fd3e9136c78d0057 | 8002e9b8d2c5d9393bad5c1fec5898ea0393adf0 |

Both retained checkouts were clean before implementation. No applicable ancestor/repository AGENTS.md was found. Both setup guides, canonical shared context/state/decisions/API/issues/dependencies/design docs and full Phase 2 handoff were read. Phase 2's 26 backend/9 frontend tests, backend build and both HTTP journeys passed before changes. No unrelated work was overwritten. Main was also reverified unchanged: frontend e12cb22e802687e3e805d5d8f819779a6ee34452, backend 17f7276198af5593fd277f940e7212768a8d0ddd.

Final local SHAs are supplied in the closing delivery header and Phase 4 initiating message; a commit cannot embed its own SHA. Retained paths: /workspace/scratch/513e9cb0b272/frontend and /workspace/scratch/513e9cb0b272/backend. Recovery bundles carry all three unpublished phases from known remote Phase 0 bases. Remote Phase 0 alone is not a valid continuation base.

## Decisions implemented

- D09 approved: main-agent acceptance reserves destination capacity atomically before source collection is eligible. Insufficient capacity leaves the request awaiting review. Unknown outcomes keep the hold until reconciliation.
- D10 approved: PostgreSQL jobs, row locks, expiring leases and unique claim tokens. Expired preparation can be reclaimed; only the current unexpired token can finish. Uncertain external outcomes never enter automatic retry.
- Only explicit synthetic_fixture network accounts and capacity are operational. Public account creation always produces unverified records. No real provider capabilities, account-control check, actual balance or production reservation policy is inferred.
- FIFO server sequence establishes queue ordering. Urgency remains a visible review flag. The main-agent may choose a request to accept; no promise of strict acceptance order is made. Same-network exchanges are unavailable in this prototype.

## Delivered behavior

1. Typed owned network accounts (phone, agent, till, account), explicit verification status/source, strict field validation, bounded account creation. Existing network cards can save new unverified identifiers. Main-agent account selection is server-controlled and must be unambiguous; no client assignment or capacity field is accepted.
2. Each request has one immutable account snapshot, owner/assignment, exact whole-TZS amount string, server sequence, version, two distinct not_started legs and append-only actor/reason/time history. Database triggers protect Phase 3 financial terms and audit history. Existing requests are preserved, with nullable new fields; historical rows cannot be accepted automatically.
3. Actor/operation/key idempotency stores normalized payload hash and original response transactionally. Simultaneous duplicate create requests yield one request/two legs. Conflicting reuse returns 409. Repeated acceptance/cancellation cannot double-reserve or double-release. Original response replay is not a current-state read; refresh the request afterward.
4. Acceptance checks both current approved active participants, owner account verification and assignment under locks; conditional BIGINT capacity update prevents oversubscription. Request update, reservation, history and job commit together. No source or destination money movement occurs.
5. Safe rejection/cancellation requires pre-movement state, both legs not_started and no unresolved claim. Holds release once. Any unknown leg/request blocks closure. Outstanding Phase 3 exchanges block direct assignment replacement/removal until an explicit handover policy exists.
6. Internal preparation jobs use request-first lock order and SKIP LOCKED. Default lease 30 seconds, configurable 1–300. Expired claims recover with a fresh token; stale/expired completion rejects. Pre-execution retry uses 5-second backoff. Default finish blocks with provider_disabled. Conservative unknown recording moves request to needs_attention/job reconciliation and retains its reservation. No confirmation, ledger posting or completed transition exists.
7. Owner-specific AsyncStorage outbox persists the stable key and payload before transport. Failures/uncertainty survive outbox reconstruction; retry reuses the original key. Transport checks the authenticated owner before sending. Switching users cannot replay another user's queue. Corrupt records fail closed without deletion. Cached owned identifiers allow offline preparation after initial online loading. Legacy offline records are neither read nor removed.
8. Existing request, queue, network, card and detail controls are wired to the canonical API. Main-agent can inspect both legs/history and accept/reserve or reject; applicant can safely cancel. Existing undefined loading references were fixed. Status and next-action copy distinguishes saved/submitted/reserved/reconciliation. Exact request amounts use strings; dashboard sums use BigInt. Dashboard placeholder transfers/networks, hard-coded growth and synthetic chart bars were removed. New requests never inflate completed-volume metrics.

Existing StyleSheet definitions remain byte-for-byte unchanged on affected screens/components. Registration wizard files were not changed. Native layout/usability was not verified.

## Migration and safety boundary

003-exchanges.sql is additive in ss_v1: network accounts, request extensions, synthetic capacity, reservations, command responses, immutable history, jobs and protection triggers. 001/002 checksums and existing records remain unchanged. The upgrade test seeds Phase 2 requests, a leg, a session and private document, applies migrations twice, and verifies preservation. Existing foundation/onboarding coexistence and immutable-evidence tests still pass.

Do not apply to a live database. Run one explicit migrator against a disposable guarded local database. No destructive down migration exists. For preview recovery, stop/discard only disposable data. Real rollback after financial effects requires reconciliation/compensating entries, not deletion. None occurred here.

The isolated API uses in-memory PGlite and resets when stopped. Database tables provide durable design for the guarded native database; actual native process restart and multi-connection behavior were not exercised. The manual scripts/exchange-worker.js accepts only the existing localhost silverstone_dev/test guard; it drains preparation to provider-disabled blocked status and executes no payment. No worker/scheduler starts automatically in the API or isolated preview.

## Verification

| Check | Result |
| --- | --- |
| Backend npm test | 36 tests passed, zero failures, embedded PostgreSQL |
| Backend npm run build | Passed; 24 JS syntax checks, 9-file active import graph, no import startup |
| Frontend npm test | 13 tests passed, zero failures |
| scripts/client-integration.js with actual frontend client | Passed auth lifecycle / pending denial over HTTP |
| scripts/onboarding-client-integration.js | Passed draft/upload/submit/correct/resubmit/approve/access over HTTP |
| scripts/exchange-client-integration.js | Passed actual frontend outbox/client: response lost after server commit, restart, same-key retry, one request/two legs, reserve, provider-blocked preparation, safe cancel |
| EXPO_PUBLIC_API_URL=http://10.0.2.2:8800/api/v1 npm run build:check | Android JavaScript/Hermes export passed; no APK/device execution |
| Changed/new frontend JS/JSX no-undef and syntax check | Zero findings |
| Existing affected StyleSheet definitions | Unchanged compared with Phase 2 |
| git diff --check | Passed both repositories |

Specific tests cover typed identifier validation, protected fields, account ownership/verification, lossless amounts, duplicate concurrent creates, conflicting keys, queue pagination, pending/rejected/suspended/unassigned/wrong-reviewer denial, concurrent capacity contention, repeated accepts, assignment protection, competing workers, expired/replaced tokens, retry backoff, retained unknown holds, forbidden manual settlement, one-time release, revocation with existing token, immutable history/terms and migration preservation.

These are embedded concurrency tests. PGlite serializes transactions: this is not native multi-connection PostgreSQL proof. No adb, PostgreSQL executable/client or Docker was available. Native races, process crashes/restart, Android PIN/SecureStore/UUID/AsyncStorage/network switching/picker, keyboard, compact width, larger text, dark/light and screen-reader tests remain open. Runtime warnings about frontend module type/npm environment and Expo root ownership remain nonfatal. This is not a dependency audit. expo-modules-core was made an explicit dependency at its already locked installed version; an offline metadata install was unavailable, so package and lockfile root declarations were aligned with the existing resolved entry, and export/import checks passed.

## Release blockers and limits

Phase 2 ordinary applicant submission remains blocked without real phone verification. SMS provider, production private evidence/storage/retention/terms, reviewer bootstrap and identity migration remain unresolved. All fixture verification stays explicitly synthetic.

Phase 3 lacks an approved real capacity source/freshness rule, real network-account verification, provider capability/fee/limit matrix, settlement evidence/callback inbox, ledger/reconciliation/refund implementation, production worker scheduling/monitoring and retry budgets. Blocked/unknown reservations do not automatically expire. Unknown status recording here is a conservative internal synthetic test, not evidence that an actual provider was called. Manual settlement remains unavailable; future authorization must define scoped operator roles, independent evidence/reference verification, duplicate protection and immutable audit.

Offline records contain owned account IDs/amount/key/error; cached identifiers are local AsyncStorage, not encrypted KYC storage. Native storage/retention/privacy acceptance is open. Failed or uncertain outbox entries have retry but no discard/edit UI. A changed form is a new request; do not erase uncertain older entries. Tests reconstruct the outbox against shared injected storage; native app-kill persistence is not claimed.

Provider fees remain unknown; only Silverstone fee is asserted as zero. This phase does not establish financial or production readiness.

## Local review checklist and continuation

1. Start backend npm run dev:isolated and the existing Expo app pointed at the isolated API. Use synthetic accounts only (password in LOCAL-DEVELOPMENT.md).
2. sub@example.test: select Voda → Airtel, amount 600,000 TZS; submit two distinct requests. No funds move.
3. main@example.test: inspect Queue detail and accept one. Acceptance of the second must report insufficient capacity (1,000,000 TZS total test capacity).
4. Applicant cancels the unclaimed accepted request; verify released capacity. A repeated command must not release twice. Reject another request with a reason; verify history.
5. Offline after loading accounts: save a request, reconnect on New Request or tap retry; switch accounts and ensure another owner's records never submit. Failures stay visible and retained.
6. Run the automated scripts for claim expiration/stale-token/unknown-outcome cases; no mobile client can invoke these internal worker operations.
7. Next chat must recover exact final local commits, verify fresh remote refs and carry all open gates forward. Phase 4 initiating message is provided separately. Do not begin Phase 4 in this chat.
