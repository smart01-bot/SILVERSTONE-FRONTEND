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
