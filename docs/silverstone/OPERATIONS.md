# Phase 6 operations — partial, local only

28 September 2026, Africa/Dar_es_Salaam. No operational/payment readiness claimed. D16–D20 below are proposals, not approvals. Existing D09/D10 remain authoritative. Phase 7 has not started.

## Implemented visibility

Queue and My Requests use only their existing server-scoped paginated records. An Unresolved filter includes needs_attention, any unknown leg, or evidence explicitly requiring reconciliation—even synthetic confirmed evidence. Queue All retains such records. Reserved amounts remain decimal strings; no floating-point totals or ledger is inferred. Request detail shows recorded UTC creation/history timestamps. Age is time since request creation, not time since uncertainty or an escalation deadline, and updates with screen rendering/refresh. Invalid/future age is unavailable. Existing failures remain visible and retained results may be stale.

No new global exception list, owner assignment, notification, audit endpoint, provider query, reconciliation command or pause switch exists. Queue's undocumented 5/15-minute colour thresholds were removed; age does not imply an approved SLA. Existing request participants are not automatically appointed incident owners. A held reservation is capacity, not confirmed funds. No real payment is verified by fixture evidence.

## Approval proposals — unresolved decisions

| ID | Proposed behavior for review | Required owner decision before implementation |
| --- | --- | --- |
| D16 Exception ownership and escalation | Explicit per-case assignment to a separately granted operations capability, restricted to named main-agent scope. Assigned main-agent supplies evidence; it does not gain settlement authority. Record actor, assignment/handover, reason and time append-only. No self-grant, global admin or automatic reassignment. | Name eligible people/roles and backup owner; choose which main-agent scopes each may access; define acceptance, escalation thresholds, destination and off-hours coverage. No deadlines/contact invented. |
| D17 Reconciliation and compensation | Read-only evidence comparison first: immutable request/leg IDs, both typed accounts/networks, amount/currency, stable attempt reference, authenticated provider lookup and independent statement references with timestamps/source. Missing, mismatched or contradictory evidence remains unresolved. Dual review is recommended for any later financial resolution. | Approve evidence sources, sufficiency rules, reviewers and discrepancy handling, including partial/reversed outcomes. Compensation/refund/retry authority and ledger design require separate approval; no new payment based on synthetic evidence. |
| D18 Scoped pause | Separate durable controls for new requests/acceptance and future dispatch, scoped to an approved main-agent/network combination. Every command/worker would recheck scope under concurrency controls. Continue authorized reads and evidence intake/reconciliation; preserve in-flight unknowns and holds. Reason, actor, version and explicit audited resume required; no automatic release/expiry. | Approve scope dimensions, who can pause/resume, treatment of already claimed work and emergency global authority. Existing provider-disabled boundary is not an operational pause implementation. No pause API adopted. |
| D19 Privacy and retention | Minimize collected evidence and diagnostic fields; preserve records needed for unresolved obligations and idempotency. Do not introduce automatic deletion until retention and disputes policy is approved. Audit access capability separate from KYC and settlement capability. | Decide evidence/terms categories, retention periods, lawful handling/deletion/export process, audit reader scope and device-cache policy. No indefinite-retention policy is being approved by leaving deletion disabled. |
| D20 Backup and restore | Encrypted backups to an owner-approved private destination; separate restore role; integrity manifest; isolated restore with dispatch blocked until external effects after snapshot are reconciled. Include DB, evidence storage and required configuration/key recovery under distinct secret controls. | Choose destination/region, custodians, key custody, RPO/RTO, frequency, retention and authorized recovery environment. No provider, destination, schedule or durability SLA selected. |

These can be reviewed independently. Approval of a design would still not authorize a real notification, provider call, live DB restore, pilot or payment.

## Privacy and audit assessment

- Express rechecks session/account status; existing request reads require owner/recorded main-agent and current assignment. No access widened for incident visibility. Suspension can make an outstanding obligation inaccessible to that actor: an independently approved operations role remains a release blocker, not a reason to bypass the gate.
- Exchange history/revision decisions are read only through scoped request/application DTOs. No global audit-read endpoint exists. Provider DTOs exclude claim tokens, command hashes and raw inbox. Existing raw DB access is privileged infrastructure access, not an application capability.
- Document reads record document/actor/time and require owner or granted assigned reviewer with submitted evidence. `document_access_events` has no immutable trigger; database-role hardening and audit tamper resistance are open. Do not equate append-only exchange history with a tamper-proof external audit system.
- Phase 6 extends Cache-Control: no-store to all /api/v1 responses, including authentication and exchange reads/errors. Applications/reviews/documents already had no-store. This prevents instructed HTTP caching; it does not erase existing caches, secure device storage or prove absence of OS screenshots/backups.
- API errors expose safe codes and request IDs rather than raw exceptions. No new logs emit personal information, auth secrets, KYC bytes or full provider payloads. Health checks DB connectivity and payments-disabled state only; it does not prove worker/provider/backup health.
- Private evidence remains local database bytea; production storage/access/key/retention controls are unverified. Owner-bound device outbox holds identifiers, amounts, stable keys and errors, not KYC/passwords. Native storage, device backup and old cache behavior remain unverified.

## Recovery evidence and limits

Backend `tests/foundation/operations.test.js` creates fresh embedded PGlite with fixed synthetic identities/accounts, accepts two requests and prepares one synthetic unknown source attempt. A synthetic confirmation is recorded without settling its leg. The second preparation lease is explicitly expired in the fixture.

The test captures and compares complete rows in 14 tables: requests, legs, reservations, capacity, history, commands, jobs, provider attempts/inbox/results/projection/effects and migration checksums. It creates an in-memory snapshot, closes the engine, loads a new engine from that snapshot and compares every captured row before mutations. Migration checksums still validate. It then verifies original-key replay, retained unknown hold, no uncertainty redispatch, fresh lease recovery, stale-token rejection, duplicate evidence without a second effect, scoped API reads, suspension denial and no global audit endpoint. All restored sessions/data are synthetic.

Run from backend: `node --test tests/foundation/operations.test.js`. The helper accepts only an explicit in-memory snapshot Blob; it reads no database URL, persists no backup file and connects to no external service. It stays outside the active server import graph. No snapshot is shipped or uploaded.

This is embedded restore evidence only. It is not native database-process restart, independent multi-connection locking, crash-consistent backup, encrypted/durable/offsite backup, corruption detection, production key recovery, native app restart or achieved RPO/RTO. No native postgres/psql, Docker or adb/emulator executable was available.

## Proposed native restore drill — not executed

After a named isolated environment and backup policy are approved: inventory version/migrations and synthetic fixtures; stop test dispatch; produce an integrity-checked backup; restore to a separate empty disposable native PostgreSQL instance with outbound execution denied; verify rows, immutable history, holds, capacity, private evidence, idempotency and claims; run two independent connections and terminate/restart the test database/worker; reconcile post-snapshot external effects before any resume. Never restore a live financial system and immediately replay an old queue. Record actual restore time/data-loss bounds against approved targets, plus failure/corruption and key-recovery cases. Keep manual settlement disabled.

## Observability readiness

In-app unresolved visibility is not an alert service. No real notifications, recipients or external monitoring integration configured. Proposed diagnostic events should use request/correlation IDs and bounded error codes, not KYC content/account identifiers/tokens. Candidate measures: oldest unresolved timestamp, held capacity, expired claims, rejected/conflicting evidence and last successful restore evidence. Each requires approved read scope, thresholds, destination and ownership before deployment. No aggregate cross-agent view or automated alert budget is implemented.

There is no financial ledger or independent settlement statement, so financial reconciliation differences cannot yet be calculated or declared zero. Fixture evidence consistency and held capacity are the only demonstrated invariants. Provider, phone verification, production storage/evidence/retention/terms/bootstrap, existing-user migration and native Android/PostgreSQL gates remain open.
