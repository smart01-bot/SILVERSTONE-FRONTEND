## Phase 6 current boundaries

Read-only unresolved filters, exact held amounts/history timestamps and API cache protection implemented. D16–D20 remain open; cases are not assigned to an approved incident owner. No escalation/SLA, scoped pause, financial reconciliation, alert delivery or durable backup acceptance. Embedded close/load is not native crash recovery. Document-access audit has no immutable trigger; privileged DB role hardening remains open. Suspension restricts outstanding-obligation reads until a scoped operations role is approved. Native visual/localization gates and all earlier external gates remain unresolved. See OPERATIONS.md.

## Phase 5 current boundaries

Fixed timer-only My Requests refresh, hidden read failures, lost review input on 409, unclear synthetic leg/reservation copy and ignored saved English preference. Improved targeted accessible controls and keyboard accommodation. Native screenshots/Android compact and normal widths, keyboard, larger text, TalkBack, dark/light, offline/reconnect and app-kill acceptance remain UNVERIFIED. No native tools available. Selected documents and unsaved wizard input are not durable until Save/Next succeeds. Draft conflicts preserve current mounted input but do not automatically merge competing versions; compare before reopening (which can replace unsaved input). Reviewer reason/corrections survive in-screen conflict/reload, not process death. New workflow text remains English pending reviewed Swahili copy. This is not full accessibility/localization certification.

Real OTP, provider integration, production evidence/retention/reviewer bootstrap, native PostgreSQL concurrency/process restart and existing-user migration remain blocked/unverified. No Phase 6 operations implemented.

## Phase 4 current boundaries

Disabled provider contract and synthetic-only durable evidence model now exist. The external gate remains BLOCKED: no selected provider, approved sandbox account/scope, verified agent-float entitlement/network identifiers, actual balance/reservation policy, tariff/limits, callback protocol/replay guarantee, settlement dictionary, reversal/refund or real reconciliation policy. Public documentation is discovery only.

The fixture harness is deliberately outside the active API/worker graph, source-leg-only, one attempt per leg, and restricted to embedded synthetic databases. Confirmation/reversal markers are not a money ledger. No destination dispatch or complete exchange flow exists. All fixture attempts retain holds and reconciliation obligations. Unknown references are retained as rejected evidence, not automatically reassociated; production quarantine/review is future work. Native process restart and multi-connection locking, production scheduling/retention/monitoring and native UI acceptance remain open. PGlite serializes transactions; Promise concurrency is not native proof.

50 backend/15 frontend tests, four actual-client HTTP journeys, backend build and Android Hermes export pass. Earlier phone verification, production evidence/storage/retention/reviewer bootstrap and migration-policy blockers remain. No full phase/release acceptance implied.

## Phase 3 current boundaries

S08 and S10 active paths now have identity-bound persistent outboxes, stable request keys, atomic capacity holds and PostgreSQL job claims. Existing UI styles were retained; undefined loading bindings corrected; request controls now perform scoped commands. Sample dashboard activity, fixed growth and fake chart bars were removed. Financial summaries count completed states only; no local operation creates completed states.

Release remains partial: no native Android/PIN/UUID/picker/offline/keyboard/accessibility screenshots; no native multi-connection PostgreSQL test or database-process restart demonstration. PGlite serializes transactions; embedded concurrent promises verify invariants but do not prove native concurrency. Real phone provider, evidence/storage/retention/production reviewer bootstrap remain open. No provider capability, real account verification/balance source, reservation freshness, settlement/ledger/refund/callback policy or production retry/SLA is established.

The isolated preview resets on process exit. Native guarded database persists records but was not run. Owner-specific AsyncStorage holds account IDs, amount, retry key/error and cached typed identifiers; it holds no passwords, API tokens or KYC evidence. Native device storage/privacy/retention policy remains unverified. Failed entries are deliberately retained; there is no discard/edit UI for an uncertain outbox entry. Retry reuses its original payload/key. Legacy queue entries are untouched.

Prototype constraints: same-network requests rejected; urgency does not reorder FIFO; public accounts start unverified; only synthetic fixture account/capacity records are operational. Request reads hydrate history/legs per row (bounded pages; optimize before scale). No production worker scheduler/monitoring or automatic reservation expiry. Unknown outcomes keep capacity held until an authorized reconciliation workflow exists. Before-funds cancellation/rejection releases once; account suspension blocks preparation and does not silently release holds.

# Phase 2 disposition — current

Local drafts, evidence uploads, immutable submissions and scoped review/corrections/rejection/approval now pass automated tests. S12/S13 active-path simulated behavior was replaced: no OTP acceptance or face-match claims. Main-agent review uses explicit grants/current assignment, with server authorization.

Open release blockers: real SMS verification (ordinary submission blocked), production storage/retention/evidence/terms policy and reviewer provisioning, native Android/PIN/device screenshots, native PostgreSQL concurrency/upgrade. PNG/JPEG only; PDF and malware/authority verification unavailable. First 100 submitted review results only; add pagination before scale. Unsaved edits are not durable; use Save draft/Next. Isolated preview database resets on server exit. Existing Firebase users/rules/live data and legacy modules remain untouched. Exchange mutations/payments disabled.

See handoffs/PHASE-02-HANDOFF.md for evidence and precise limitations. Historical Phase 1/0 findings below are superseded only for the active local paths explicitly covered here.

# Phase 1 disposition — 27 September 2026

The Phase 0 findings below remain historical evidence. Current local dispositions:

| Findings | Phase 1 disposition |
| --- | --- |
| S01/S02 startup/schema | Active foundation graph and ss_v1 migrations pass checks. Legacy source still has incompatible imports/schema and is deliberately unmounted; do not run it. |
| S03/S04 authorization | Active API rejects privileged registration fields; checks current account/application status, roles and object scope. Negative tests pass. |
| S05 recovery/sessions | Strict access-token validation, refresh replay revocation and server logout tested. Password recovery is unavailable (503) until real delivery exists. |
| S06 Firebase | No active app path uses Firebase. Existing remote users, data and deployed rules are untouched; their historical exposure is not fixed by this local work. |
| S07 loader/identity | NewRequest loader binding fixed; active user IDs use id. Exchange submission explicitly unavailable. |
| S08 offline | Legacy queue is neither read, replayed nor deleted; durable identity-bound submission remains Phase 3. |
| S09 PIN | Unlock callbacks clear sessionLocked; password reauthentication used for local PIN reset. Device/biometric verification remains open. |
| S10/S11 queue/payment | Legacy worker/payment routes unmounted. No fake completion. No provider execution. |
| S12/S13 onboarding | Preview labels no longer claim verified identity; final wizard submission and review remain unavailable. Private evidence/drafts/submission are Phase 2. |
| S14/S15 setup/tests | Current setup guides and isolated checks provided; legacy unsafe tests excluded from npm test. Native PostgreSQL/Docker not executed. |
| S16 metrics | No active backend revenue endpoint. Full accurate exchange display/aggregation remains Phase 3. |
| S17 integration | Existing screen reads use API adapter; unsupported writes fail. Active graph contains no Firebase imports. |
| S18 DB TLS | Current foundation permits only explicitly named loopback dev/test databases. Legacy connection configuration remains unmounted; production TLS configuration is not claimed. |

New limitations: process-local rate limiting; no native app/screenshots/device proof; no actual legacy-schema migration; full KYC and password recovery unavailable. PGlite is embedded PostgreSQL, not an external server or provider sandbox. Phase 1 does not establish operational readiness.

## Historical Phase 0 findings

> Publication update — 27 September 2026: The user authorized remote development branches and publication of Phase 0 findings after the original read-only review. Both branches are based on the audited main commits. See README.md and PROJECT-STATE.md for current status. Historical statements below about unpublished documents or absent development branches describe the original review, not current state. Architecture proposals remain unapproved unless explicitly recorded otherwise.

# Known issues and audit revalidation

Date: 27 September 2026. All issues open. Owners are proposed phase responsibilities, not assigned people. Severity reflects source risk; no live exploit, deployed exposure or test pass is claimed.

## S01 — Blocker

Evidence status: Confirmed.

Source: Backend controllers/requestController.js, controllers/transferController.js, services/queueService.js, services/transferService.js.

Imports models/request.js and models/transaction.js; neither exists in the complete pinned tree. Static resolver found seven missing relative import edges including tests.

Next: Phase 1: align imports, services and schema; startup smoke check.

## S02 — Blocker

Evidence status: Confirmed.

Source: Backend models/transferRequest.js, transactionLeg.js, floatLedger.js; migration.sql; README.md.

New models refer to transfer_requests, transaction_legs, networks, float_ledger and agent_float_balances. Repository migration only alters legacy agents/requests; no complete schema bootstrap. Comments are not proof of deployed constraints.

Next: Phase 1: ordered migration baseline and fixture upgrade tests.

## S03 — Critical

Evidence status: Confirmed source exposure.

Source: Backend controllers/authController.js register; models/agent.js; middleware/auth.js.

Public role accepts all ROLES, including main-agent/admin; accepts selfieVerified. Pending tokens are issued and auth does not query approval status. Pending authentication itself is intended; missing operational restriction is the defect.

Next: Phase 1: public sub-agent allowlist, server verification ownership, current-state gate.

## S04 — Critical

Evidence status: Confirmed source exposure.

Source: Backend routes/agentRoutes.js, requestRoutes.js, transferRoutes.js; corresponding controllers.

auth() reads arbitrary IDs without ownership/assignment checks. /transfers/process requires only a valid token. auth(true) means main-agent in active middleware, but admin in duplicate middleware; update allows privileged fields globally.

Next: Phase 1: explicit capabilities, current account and object scope checks.

## S05 — Critical

Evidence status: New finding; static inference.

Source: Backend controllers/authController.js forgotPassword/resetPassword/logout; middleware/auth.js.

Reset JWT uses same secret and ordinary auth accepts any verified JWT without purpose validation. Non-production recovery returns reset token without proof of mailbox control; production email delivery is TODO. Reset token is reusable within expiry; logout clears cookie but does not revoke bearer token. Not runtime exploited.

Next: Phase 1: purpose separation, single-use recovery, uniform responses, revocation and rate limits.

## S06 — Critical

Evidence status: Confirmed rule text, deployment unknown.

Source: Frontend both refs: firestore.rules, storage.rules.

Own agent create/update permits privileged fields. Agent reads and document reads allow any authenticated user; transaction reads are broad. No deployed-rule inspection.

Next: Phase 1: deny unintended paths in isolated tests; live Firebase rule changes require explicit authority.

## S07 — High

Evidence status: Confirmed.

Source: Frontend both refs: src/screens/sub-agent/NewRequestScreen.jsx.

showLoader/hideLoader called without binding useLoader in component. Feature adds API field mismatch and user.uid versus user.id; queue_position versus queuePosition.

Next: Phase 1 loader/auth shape; Phase 3 full exchange contract.

## S08 — High

Evidence status: Confirmed.

Source: Frontend both refs: src/hooks/useOfflineQueue.js; NewRequestScreen.jsx.

Queue removed even after upload errors; fields stored in snake_case are read as camelCase. Single shared queue key and no durable idempotency guard can lose work or replay under another identity.

Next: Phase 3: identity-bound durable records, retain failures, retry same idempotency key.

## S09 — High

Evidence status: Confirmed path; device reproduction pending.

Source: Frontend both refs: AppNavigator.jsx sessionLocked branch; PinEntryScreen.jsx.

Overlay onSuccess sets pinVerified but does not clear sessionLocked; PinEntry delegates to callback. Earlier gate/effects may affect reachability: not claimed universal lock failure. Feature ForgotPin reads user.email, absent in new user shape, and resetPin calls a main-agent-only endpoint.

Next: Phase 1: exercise cold-start, background lock, biometrics and recovery paths on device.

## S10 — High

Evidence status: Confirmed.

Source: Backend requestController.js; queueService.js; index.js.

Urgency adds 1,000,000 to score while zRange selects lowest first. Read/remove is non-atomic and removes before successful processing. setInterval may overlap; no durable leased claim/retry.

Next: Phase 1 disable automatic execution; Phase 3 durable queue/concurrency.

## S11 — Blocker for payments

Evidence status: Confirmed.

Source: Backend services/transferService.js.

Provider call commented out. Same-network path marks completed without real payment evidence; cross-network path fabricates local pending transaction. New model comments disallow same-network while old service supports it.

Next: Phase 1 stop false completion; Phase 3 scope decision; Phase 4 real provider evidence.

## S12 — High

Evidence status: Newly explicit.

Source: Frontend both refs: Step2OTP.jsx handleVerify; Step5Selfie.jsx startScan/handleNext.

Any six digits advance; resend only resets UI timer. Selfie is a timed animation, no camera capture, and passes selfieVerified=true.

Next: Phase 2: actual capture and server-bound OTP if required; truthful labels immediately when wiring.

## S13 — High

Evidence status: Confirmed.

Source: Frontend Step4Business.jsx, Step6Review.jsx, AuthContext.jsx; feature ApprovalsScreen.jsx; backend agentController.js getAllAgents.

Business step passes local tinCertUri/licenceUri. Review reads URL parameters and does not upload those local files. Main review bypasses AuthContext uploader; feature removes upload logic. Approval list omits evidence columns and UI uses different field names.

Next: Phase 2: private upload pipeline, detail DTO, revision/evidence completeness.

## S14 — Medium

Evidence status: Confirmed.

Source: Frontend README.md, SETUP.md, HANDOFF.md, DEVLOG.md; root/nested package.json; backend README.md/package.json.

README claims Vite app, old docs conflict on Expo and branch state. Nested starter/cache/Gitlinks need deliberate cleanup. Backend lint/format target absent src; README setup.sql is absent.

Next: Phase 1: corrected actual setup, archive historical claims, scoped cleanup.

## S15 — High

Evidence status: New finding.

Source: Backend index.js, config/database.js, config/redis.js, tests/*.test.js.

Tests import default app not exported by index, which starts server/worker. Config connects eagerly. Tests delete tables and flushAll with no dedicated-environment guard. Tests not executed.

Next: Phase 1: app factory, injected dependencies, disposable DB/Redis and fail-closed test isolation.

## S16 — Medium

Evidence status: New finding.

Source: Backend dashboardController.js getRevenueMetrics/getDashboardData.

SUM(transaction amount) exposed as revenue; misleading for free product. This is not evidence of implemented Silverstone fees.

Next: Phase 1/3: rename to exchange volume; fee always zero, provider charge separate.

## S17 — High

Evidence status: Confirmed.

Source: Feature src/components/RequestDetailModal.jsx; backend routes/transferRoutes.js; feature hooks/useNotifications.js.

Modal posts /api/transfers but backend registers /api/transfers/process; notification hook still imports Firestore helpers after core auth moved to JWT.

Next: Phase 1 contract migration and active import audit; Phase 3 action wiring.

## S18 — High

Evidence status: Confirmed configuration; live effect unknown.

Source: Backend config/database.js.

TLS rejectUnauthorized:false disables certificate validation; startup error names a different variable from DATABASE_URL.

Next: Phase 1: verified CA/connection config in isolated environment and clear startup validation.

## Historical audit disposition

All historical bullets remain supported by current source, with qualifications: deployed Firebase rules and real runtime PIN behavior are unverified; no external CI absence is asserted. The source branches are unchanged at the observed pins. New explicit findings include simulated OTP/selfie, purpose-confused reset JWT validation, missing document persistence, test isolation hazards, modal endpoint mismatch and misleading revenue terminology.
