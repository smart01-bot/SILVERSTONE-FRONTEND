## Phase 5 contract status

No API or schema changes. Existing paginated requests are now fetched by the My Requests refresh control; incomplete-page failures preserve the previous screen list. Reviewer uses existing status/version to disable stale or non-submitted decisions. New Request validates the existing positive whole-TZS BIGINT string range exactly before enqueueing. Server authorization remains decisive.

## Phase 4 implemented additions — disabled provider, synthetic evidence only

- `GET /api/v1/provider-status`: active approved session; `{provider:null,mode:"unconfigured",executionEnabled:false,callbackEnabled:false,manualSettlementEnabled:false,agentFloatSupport:"unverified",providerFees:{status:"unknown",amountTzs:null}}`.
- `/api/v1/provider-events/*`: disabled before app authentication; valid requests return 503 PROVIDER_UNCONFIGURED. No inbox writes, signatures accepted, or actual settlement. Malformed/oversized JSON still fails normal parsing limits.
- Request detail/list gains `provider` with the same boundary and `providerEvidence` summaries: id, legId, synthetic reference, source=synthetic_fixture, scope=embedded_test, evidenceStatus, createdAt, actualSettlementVerified=false, reconciliationRequired=true. Existing owner/assignment restrictions apply. No inbox payload, claim token or provider credential is returned.
- Evidence states are unknown/acknowledged/confirmed/failed/reversed **within a synthetic evidence projection only**. Even confirmed evidence leaves actual leg unknown, request needs_attention and reservation held. No financial effects, payout/retry or completion is available.
- No public endpoint can prepare attempts, ingest fixtures, apply evidence, release unknown holds or manually confirm. Existing exchange command/idempotency and offline contracts remain intact. Fee zero applies only to Silverstone; unknown provider charges use null, not zero.

See PROVIDER-EVIDENCE.md for normalized fixture protocol, transitions and rejected/conflicting event behavior. Prior phase descriptions below remain historical where superseded.

## Phase 3 implemented exchange contract (local synthetic only)

All requests require a live Express session and active approved account. Every exchange command also rechecks both participants and current assignment under locks. Status, owner, assignment, verification and capacity cannot be client-written. The synthetic fixture source is not provider verification.

| Route under /api/v1 | Contract |
| --- | --- |
| GET /me/accounts | Owned typed identifiers and explicit verification status/source |
| POST /me/accounts | networkCode, identifierType (phone/agent/till/account), identifier; always creates unverified; 30 per owner maximum |
| POST /requests | sourceAccountId, destinationAccountId, amountTzs (positive decimal string within BIGINT), currency TZS, urgent boolean; Idempotency-Key required; exactly two not_started legs |
| GET /requests | Scoped current-assignment list; FIFO queueSequence; limit 1–100, decimal cursor, page.nextCursor |
| GET /requests/:id | Canonical state/version, immutable account snapshot, legs, reservation, history, nextAction, zero service fee |
| POST /requests/:id/accept | Assigned main-agent; expectedVersion, optional reason; stable Idempotency-Key; conditional capacity reservation + state + history + job in one transaction |
| POST /requests/:id/reject | Assigned main-agent; expectedVersion and reason 3–1000 chars; same idempotency rule; only safely closable requests |
| POST /requests/:id/cancel | Owner; expectedVersion; same idempotency rule; only before movement/uncertainty/claimed work |

Idempotency is actor+operation+key and normalized-payload hash, stored with the original response. Keys are 16–128 ASCII letters/digits/underscore/hyphen. A changed payload returns 409 IDEMPOTENCY_CONFLICT. Same key/body returns original response, even if later status has changed; refresh detail for current status. Accept replay does not reserve twice. Lists' cursor changed from Phase 1 UUID to FIFO decimal sequence; treat it as opaque.

Create requires different networks and owned synthetic_fixture accounts; assigned main-agent must have one unambiguous synthetic account on each network. Native startup never seeds these accounts/capacity. Publicly added accounts remain unusable for exchange until a separately designed verification mechanism exists.

Allowed local path: awaiting_review → awaiting_source (reserved, provider disabled) → cancelled/rejected if safe. Internal conservative unknown recording sets origin leg unknown and request needs_attention; retains hold and records reconciliation job. No public worker, provider callback, verification, capacity, arbitrary-state or manual-confirmation endpoint. No completed transition or ledger settlement is implemented.

Durable prepare_collection jobs: ready → claimed → blocked (provider disabled), ready (pre-execution retry, 5-second backoff), or reconciliation (unknown). Claims default 30 seconds, configurable 1–300; claim token and unexpired server-clock lease are both required for finish. Worker claims lock request rows with SKIP LOCKED. Failed/expired preparation can recover, but reconciliation cannot requeue. This is not a provider exactly-once claim. Recheck all actual provider capabilities before extending it.

## Phase 2 implemented contract — local only

This section supersedes the Phase 1 unavailability notes for onboarding below. Other proposed endpoints remain unimplemented. All routes require a current session. Owner routes deny main-agent/suspended/closed identities; editing requires pending + draft/changes_requested.

| Route relative to /api/v1 | Behavior |
| --- | --- |
| GET /applications/me | Own status, version, draft data, registered email/phone, phoneVerification source, immutable revisions/decisions |
| PUT /applications/me/draft | {expectedVersion,data}; strict allowlist, optimistic concurrency, server version increment |
| POST /applications/me/phone-verification | 503 PHONE_PROVIDER_UNAVAILABLE; no simulated delivery or verification |
| POST /applications/me/submit | {expectedVersion}; validate fields, owned evidence kinds, assigned main-agent and trusted phone record; append immutable snapshot and set submitted/pending |
| POST /documents | {kind,name,mime,base64}; authenticated PNG/JPEG only, 2 MiB/16M pixels, private database bytes, deduplicate owner+kind+hash; no client verified flag |
| GET /documents/:id | Private image bytes in base64 to owner or explicitly granted currently assigned reviewer; reviewer only sees evidence linked to submitted revisions; no-store and access audit |
| GET /documents/:id?metadata=1 | Same scope, without file bytes |
| GET /review/applications | Active approved main-agent + unrevoked reviewer_grants record; first 100 assigned submitted/pending applicants |
| GET /review/applications/:agentId | Same scope; submitted history only, never unsent draft content |
| POST /review/applications/:agentId/decisions | {expectedVersion,decision,reason,fieldsToCorrect?}; approved/rejected/changes_requested, reason 3–1000 chars, correction fields required for changes_requested; one decision/revision; transactional activation only for approved |

Draft data keys: name, nida, businessName, businessLocation, coordinates {lat,lng}, networks (canonical codes), floatCapacity (whole-TZS string), businessTIN, businessLicenceNumber, documentIds. No password, role, assignment, status or verification field. Prototype evidence kinds tin/licence/selfie are launch-policy dependent. Rejected is terminal for applicant edits; request-corrections reopens the existing draft.

Phone sources provider/synthetic_fixture are distinct. No active provider adapter exists; only isolated bootstrap writes synthetic_fixture. Private database storage is the local implementation, not a claim that production object storage is configured. Approval is a recorded human decision, not proof of external identity checks. PDF is unsupported. 409 APPLICATION_CHANGED protects stale/concurrent saves/reviews; PHONE_VERIFICATION_REQUIRED and ASSIGNMENT_REQUIRED block submission. The full gate remains partial; see PHASE-02-HANDOFF.

## Phase 1 architecture approval — 27 September 2026

The user explicitly approved Expo → Express → PostgreSQL; Express authentication with revocable sessions; one assigned main-agent per sub-agent; and the proposed consistent API representation (D06, D07, D08 and D11). These supersede earlier proposed/unapproved wording for those decisions. D09 payment sequencing and D10 durable worker design remain proposals for later phases.

Authority: local implementation and verification on `development` in both repositories. Preserve the UI and charge no Silverstone service fee. Use isolated synthetic accounts; keep payments disabled. Do not delete, migrate or access existing Firebase users/data. Existing-user migration and live changes are separate. No push, main changes or deployment.

## Implemented Phase 1 surface

Canonical prefix `/api/v1`; JSON camelCase, UUID IDs, whole-TZS decimal strings, ISO UTC dates, `{data}` success and `{error:{code,message,fieldErrors,requestId}}` errors. Account, application and request states are distinct. This is local-only; network codes do not imply provider support.

| Route | Implemented behavior |
| --- | --- |
| POST /auth/register | Allow only email/password/name/phone; creates pending sub-agent and draft application status. No evidence/submission/approval. |
| POST /auth/login | Email/password, returns accessToken/refreshToken/agent. Pending and suspended can view own status. Closed accounts denied. |
| POST /auth/refresh | Rotate hashed refresh credentials; reuse revokes session. |
| POST /auth/logout | Authenticated server session revocation. |
| POST /auth/reauthenticate | Check current password for device PIN reset; issues no new credential. |
| GET /me | Current identity, role, accountStatus, applicationStatus, assignment summary. PIN is device-local, not a server approval field. |
| PATCH /me | Active approved account; name only. Role/status/assignment rejected. |
| GET /networks | Authenticated registry codes and display names. |
| GET /agents; GET /agents/:id | Active approved main-agent gets assigned sub-agents; detail also permits own active account. No global admin access. |
| GET /requests; GET /requests/:id | Active approved owner or request's recorded main-agent only. Read-only foundation. |
| POST /auth/recovery; POST /auth/reset | 503 RECOVERY_UNAVAILABLE; no token leaks or simulated delivery. |
| Exchange mutations / transfers / agent review mutations | Unavailable; no workers or provider calls. |

Lists use `limit` (1–100, default 100) and an opaque-to-client UUID cursor ordered by ID. Agent DTO: id, email, name, phone, role, accountStatus, applicationStatus, mainAgentId, createdAt. Request DTO: id, subAgentId, mainAgentId, sourceNetwork, destinationNetwork, amountTzs, currency, status, createdAt. Server derives read scope from the current authenticated account; no client owner selector grants access.

Session access lifetime 15 minutes; server session absolute lifetime seven days; issuer silverstone-api, audience silverstone-mobile, algorithm HS256, purpose access. Secrets and refresh-token hashes never appear in DTOs. Local error 413 covers payloads exceeding 32 KiB. Unknown/unmounted routes return 404. `/health` checks database connectivity and reports paymentsEnabled false.

The remaining contract below is the longer-term target. Only the routes above are implemented. KYC submission/review, network-account records, PIN recovery delivery, exchange commands, reservations and durable processing are future work; D09/D10 remain proposed.

> Publication update — 27 September 2026: The user authorized remote development branches and publication of Phase 0 findings after the original read-only review. Both branches are based on the audited main commits. See README.md and PROJECT-STATE.md for current status. Historical statements below about unpublished documents or absent development branches describe the original review, not current state. Architecture proposals remain unapproved unless explicitly recorded otherwise.

# Database and API direction — proposed v1

Status: review draft, not an implemented or approved OpenAPI contract. Existing /api endpoints remain legacy evidence, not this specification. Finalize machine-readable schemas and contract tests in Phase 1 after architecture adoption.

## Common representation

- API prefix /api/v1; JSON camelCase; database snake_case, mapped once in server DTOs.
- Server-generated UUID identity; user.id/agent.id consistently. No operational client-supplied role, approval, owner, reviewer, settled flag or mainAgentId.
- Money: currency TZS; amountTzs positive base-10 integer string, e.g. "100000". Store BIGINT with explicit positive/range constraints; no JS floating arithmetic for financial values. Whole-TZS scope is proposed; revise contract before integration if a provider needs fractional units. Limits come from approved configuration, not invented amounts.
- Network registry: immutable code plus display name and provider mapping. Proposed codes vodacom, airtel, yas, halotel. Display Voda maps to vodacom; do not infer old Tigo account compatibility from a label. Registry presence does not mean provider support.
- Phone E.164 where the account type is a phone. Agent/till/account identifiers remain typed strings, not numbers or assumed phone numbers. Store verified account records; requests reference account IDs.
- Times: server UTC ISO 8601, display in Africa/Dar_es_Salaam. Version number for concurrent edits. Paginated scoped collections with opaque cursor and bounded limit.
- Success: {data: object} or {data: [], page: {nextCursor}}. Error: {error: {code, message, fieldErrors, requestId}}. 400 invalid input, 401 invalid session, 403 disallowed operation/account, 404 inaccessible or absent resource, 409 stale version/idempotency conflict, 429 throttled, 503 temporary dependency failure. Do not return internals or credentials.

## Separate state domains

| Domain | Proposed values | Rule |
| --- | --- | --- |
| Account | pending, active, suspended, closed | Operational access only active; unknown value denies |
| Application | draft, submitted, changes_requested, approved, rejected | Review immutable submitted version; correction creates new revision |
| Request | awaiting_review, awaiting_source, source_confirmed, payout_pending, completed, rejected, cancelled, expired, needs_attention, refund_pending, refunded | No arbitrary client status patch |
| Leg | not_started, submitted, confirmed, failed, unknown, reversed | Provider acknowledgement means submitted, not confirmed |
| Reservation | held, consumed, released | Unknown payout keeps hold until reconciled |

Approving an application atomically activates its eligible account. Suspending an account leaves historical application decisions unchanged. Only confirmation of both legs completes an exchange. A source-confirmed request with a failed/unknown payout remains an explicit recovery obligation.

Proposed request transitions: create → awaiting_review; scoped accept + atomic reservation → awaiting_source; confirmed source → source_confirmed → payout_pending; confirmed payout → completed. Reject/cancel/expire only before unresolved or confirmed money movement. After any movement or uncertainty use needs_attention/refund workflow; never silently cancel or erase. Late source confirmation after expiry opens recovery; do not automatically release destination funds without a valid reservation and policy. Reversals append correcting records and reopen an exception.

## Principal endpoints

| Method / path (relative to /api/v1) | Actor / input | Result and invariant |
| --- | --- | --- |
| POST /auth/register | Anonymous: allowlisted credentials/profile | Sub-agent pending account only; transactionally persist profile |
| POST /auth/login; POST /auth/refresh; POST /auth/logout | Account/session | Revocable session; logout invalidates server session |
| GET /me | Any authenticated account | id, email, role, accountStatus, applicationStatus, pinSet, assignment summary |
| POST /auth/recovery; POST /auth/reset | Recovery flow | Uniform response; delivered single-use token; revoke existing sessions on reset |
| PATCH /me | Own allowed contact/profile fields | Protected fields rejected; sensitive changes may trigger review |
| POST /applications; PATCH /applications/:id | Owner, draft/corrections, expectedVersion | Revision with explicit required/missing evidence |
| POST /applications/:id/submit | Owner, version | Validate completeness; immutable submitted version |
| POST /documents/upload-intents; POST /documents/:id/complete | Owner, allowed type/size/hash | Private object reference; verify actual uploaded object before accepting |
| GET /documents/:id/access | Owner or assigned authorized reviewer | Short-lived scoped access; record access; no public KYC URLs |
| GET /review/applications; GET /review/applications/:id | Assigned active reviewer | Only assigned application details |
| POST /review/applications/:id/decisions | Reviewer: decision, reason, fieldsToCorrect, expectedVersion | Immutable reviewer/time/revision record; one effective decision per revision |
| GET /networks; GET /me/accounts; POST /me/accounts | Authenticated; appropriate status | Typed account records; verification before operational use |
| POST /requests | Active sub-agent, approved verified accounts | Idempotent create; derive owner and current assignment |
| GET /requests; GET /requests/:id | Owner or assigned main-agent | Scoped list/detail with legs and next allowed actions |
| POST /requests/:id/accept; POST /requests/:id/reject | Assigned active main-agent, expectedVersion | Reserve atomically on accept; preserve decision audit |
| POST /requests/:id/cancel | Owner before money movement | Server validates cancellable state |
| POST /provider-events/:provider | Verified provider, not app user | Durable deduplicated inbox; no client settlement assertion |
| POST /requests/:id/manual-confirmations | Explicitly enabled scoped operator capability | Evidence/reference and audit; independent confirmation policy still open |

Future assignment/admin endpoints must be restricted to explicit operator capability. Generic PUT /agents/:id must not enable role changes or review of all agents.

Example request:
```json
{"sourceAccountId":"<UUID>","destinationAccountId":"<UUID>","amountTzs":"100000","currency":"TZS","urgent":false}
```
Use Idempotency-Key on creation and financial commands. Bind key to actor+operation and a normalized payload hash; repeat same key/body returns original result; different body returns 409. Retention must cover provider reconciliation/replay windows. Offline records retain the same key and originating identity; do not replay another user's queue after switching accounts.

## Database direction

| Table / group | Required relationships and constraints |
| --- | --- |
| agents, identities, sessions | Unique trusted issuer+subject mapping, normalized email/phone constraints as approved; revocable sessions; role/status never public writable |
| applications, application_revisions, documents, review_decisions | Owner, immutable revision, private storage key; reviewer FK and decision timestamp; version check |
| main_agent_assignments | One active assignment per sub-agent; audited effective dates; authorized assignment acceptance |
| networks, network_accounts | Code uniqueness; typed identifiers; account owner, verification, provider mapping and status |
| transfer_requests | Owner and assignment snapshot, both account snapshots, positive amount/currency, version; immutable financial terms after acceptance |
| transaction_legs, provider_attempts | Unique request+leg type (origin_in, destination_out); multiple attempts tracked separately; unique provider references where guaranteed |
| float_reservations, float_ledger, agent_float_balances | Atomic reserve with nonnegative available capacity; confirmed movements append ledger entries exactly once; cache reconciles to ledger; reservations separate from actual movement |
| jobs, outbox, provider_event_inbox, audit_events | Unique event/dedupe keys; attempts, lease expiry, next attempt, last error, recovery owner; durable audit |

Existing transferRequest/transactionLeg/floatLedger model intent is useful but constraints mentioned in comments are NOT proven installed. Current migration.sql only alters legacy agents/requests and cannot bootstrap an empty database. Create ordered migrations with checksums and a schema version table; include all required constraints and indexes. Rehearse empty-db install and upgrade from a sanitized legacy fixture. Stop on unknown schema; never blindly run the existing SQL against live Supabase.

Backfill into new tables with legacy ID mapping, record counts and amount totals; preserve unknown states as exceptions. Keep legacy tables during transition. Rollback before external effects may restore application routing; after confirmed payments use reconciliation/compensating entries, never destructive down-migrations that erase movements.

## Atomicity and worker rules

Accept decision + reservation + outbox job must commit together. Claim jobs with a transaction, row lock and lease; recover expired claims. Use stable provider idempotency/reference per leg. If a timeout leaves outcome unknown, query/reconcile before retrying; never assume exactly-once provider execution. Verify callback authenticity, amount, currency, account, request/leg and provider reference, then commit inbox result + leg + ledger effect atomically. Handle duplicate/out-of-order callbacks. Do not call a provider while holding a long database transaction.

## Current drift to eliminate

Wizard sends dest_network/source_phone/agent_name/urgent; backend expects requested_network/source_phoneNumber/subagent_name/urgency. Wizard reads queue_position; backend returns queuePosition. Wizard NewRequest uses user.uid though auth exposes id. Profile reads use camelCase while backend frequently returns snake_case. Detail modal posts /api/transfers, but server registers /api/transfers/process. Approvals list omits document columns while UI expects certificate URLs. Fix one contract at the boundary, not ad hoc aliases spread across screens.
