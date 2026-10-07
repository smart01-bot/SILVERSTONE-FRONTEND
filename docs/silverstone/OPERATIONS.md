# Phase 6 continuation: implemented local controls

October 7, 2026 · Africa/Nairobi. This heading supersedes older implementation-status descriptions below. The user requested finishing Phase 6 under the existing local-only rules. Configurable controls and synthetic fixtures were implemented; the user's “which is best” response did not approve a production roster, SLA, retention period or financial-resolution policy.

## Scope and access

`operations_grants` explicitly binds an active approved main-agent actor to a recorded main-agent scope and one capability: `cases.read`, `cases.manage`, `cases.own`, `evidence.record`, `audit.read` or `pause.manage`. No registration, role claim or public API can grant these capabilities. The new migration grants nobody access. Normal native startup seeds nobody. Only explicit disposable fixtures grant main@example.test its own scope; other-main@example.test receives delegated case visibility/ownership as a synthetic backup, without pause/audit/evidence authority. Grants and account status are checked and locked in transactions; revocation/suspension fail closed.

Operational access intentionally follows the immutable request main-agent scope and explicit grants, so an independently authorized backup can see an obligation even if its original participant is suspended. This does not widen normal /requests reads or KYC access. Grants are not inherited from reviewer_grants. There is no global audit endpoint or self-grant.

## Responsibility, escalation and diagnostics

Cases are derived from needs_attention, unknown legs or reconciliation-required provider evidence. Missing assignment and suspended/revoked owner or backup authority are visible, never hidden. Stored ownership is not treated as usable access. Owner and distinct backup must each hold cases.own and cases.read in the same scope and have active approved main-agent accounts. Assignments use expectedVersion, reason, actor and append-only history; a stale retry conflicts instead of overwriting responsibility. Owner change does not change financial terms, assignment or settlement.

A deadline is explicitly entered per case, in UTC, or remains unconfigured. No default 5/15-minute SLA or recipient is invented. The panel labels overdue cases “Escalation due” and reports scoped unresolved/unassigned/escalation counts, oldest request creation time, held capacity strings and expired preparation claims. These are in-app alerts/read-only diagnostics, not delivered SMS/email, a financial balance or a settlement discrepancy calculation. The full scoped list is paginated; later-page failures never masquerade as a complete empty list.

## Reconciliation boundary

Scoped evidence view includes immutable account/leg terms, actual leg state, held reservation and recorded observations. Authorized operators can append a bounded source/reference, exact whole-TZS amount, leg, both account IDs and observation timestamp. The server compares these with original terms, records discrepancies, deduplicates unchanged references and rejects changed terms under a reused reference. Every observation is unverified; synthetic_fixture and submitted_statement are distinct labels. A matching statement is not proof of authenticity or settlement. No operator can mark paid/complete, consume/release an unknown hold, retry an uncertain payout, issue a refund or alter a financial record through these routes.

`operations_events`, `reconciliation_observations` and now `document_access_events` reject row UPDATE/DELETE using immutable triggers. This is application/database row protection, not tamper-proof storage against database owners, TRUNCATE or disabled triggers. Least-privilege production database roles and external audit custody remain required. Existing cache no-store and safe error/request-ID behavior are retained. No diagnostics log tokens, PINs, document bytes, account identifiers or raw provider payloads.

## Scoped pause behavior

One durable control row per main-agent scope separately pauses new requests, acceptance and preparation claims. Changes require pause.manage, expectedVersion and reason and are audited. New mutations check the shared control gate inside their transaction; a concurrent pause waits for an existing gate and fences later work. Known idempotency replay can return its original result while paused. Reads, evidence recording and safely allowed pre-movement cancellation continue. Unknown holds are never released by pause or resume.

Already claimed preparation may finish recording provider-disabled, retryable preparation or unknown outcome. A paused scope issues no new claims; expired claims can recover only after explicit resume. Unknown reconciliation jobs are never redispatched. There is still no real provider dispatch. Future network-level or emergency global pause and behavior of actual external operations require a separately approved design; no implicit global authority was added.

## Verified backup and restart procedure

`scripts/backup.js` provides test-only AES-256-GCM archive encryption with authenticated manifest and SHA-256 integrity checks. Explicit 32-byte keys stay in process memory. Wrong key, corruption, truncated archive and wrong integrity metadata reject before restore. Snapshot helper requires syntheticOnly and is excluded from the active API/worker graph. It reads no environment database URL and has no default destination or schedule.

`scripts/native-operations-drill.js` creates its own uniquely named disposable Docker PostgreSQL 16 container at a random loopback-only port, using a pinned image digest. It ignores user database URLs, compares count/digest of all 32 ss_v1 tables, writes only an encrypted synthetic pg_dump archive to a private temporary directory, kills/restarts that dedicated container, restores to a newly created separate empty database, rechecks every table/migration, then verifies replay, pauses, holds and fresh/stale claim tokens. It exercises ten actual concurrent same-key HTTP requests and two independent PostgreSQL connections for pause fencing. Private synthetic evidence bytes and access events are included. Key/archive, test container and anonymous volume are removed at exit. No real database or existing container is targeted.

Run from backend: `node scripts/native-operations-drill.js` after locked dependencies and the managed Docker daemon are available. It is an isolated drill, not a production backup utility. The embedded encrypted-restore test additionally rejects wrong keys/corruption and preserves grants, private bytes, document-access events and uncertainty.

Observed successful native drill: 32 tables identical; restart 1182 ms and restore 632 ms. No external effects occur after the snapshot in this scenario. These measurements establish neither production RPO/RTO nor offsite durability, disaster recovery, key-custodian recovery, ransomware resistance, load behavior or provider reconciliation. Production destination/region, custodians, protected keys, schedule, retention and recovery targets remain D20 owner decisions.

## Operational runbooks

1. Unknown or partial exchange: inspect recorded support reference, immutable terms, both actual legs and reservation; assign eligible owner/backup and an explicit deadline where agreed. Preserve all evidence and holds. Request independent authorized provider/statement evidence through the future approved process. Append an unverified observation if authorized. Never infer settlement, cancel an unknown, retry a payout or compensate from a synthetic/matching observation. Escalate to the named owner via an explicitly authorized channel; this build sends no messages.
2. Duplicate/reference conflict: retain the original immutable observation. A repeated identical reference has one record; changed terms return EVIDENCE_CONFLICT. Do not edit or delete the original to make a later statement fit. Record distinct evidence/reason and keep the case unresolved until approved independent reconciliation.
3. Pause: inspect current scope/version, choose the specific request/acceptance/preparation flags and record reason. Re-read controls after a conflict. Continue read/evidence work; confirm holds and unknowns remain. Before resume inspect in-flight claims and unresolved obligations, then explicitly save a current-version resume; no automatic expiry/resume exists.
4. Restart: normal runtime does not seed or erase native data. Recheck DB/migration readiness and controls before allowing claims. Expired preparation may receive a fresh fenced token; old tokens fail. Reconciliation jobs stay unretryable. Never run the legacy Redis consumer.
5. Restore rehearsal: use only the named disposable drill. For a future real recovery, obtain separate authorization for environment, backup and keys; preserve an isolated destination, prohibit dispatch, authenticate archive and migration state, compare records/private evidence, invalidate or deliberately handle restored sessions and reconcile every external effect after snapshot before any resume. No live restore or payment is authorized by this document.
6. Suspension/access: revoke the scoped grant or suspend the actor using the separately approved provisioning process. Existing sessions then fail protected operations. Ensure a separately granted eligible backup remains; assignment alone grants no access. Document access still requires the existing owner/reviewer policy. This build adds no public suspension, provisioning or secret-recovery endpoint.

## Remaining decisions and gates

D16–D20 remain production-policy OPEN: named owner/backup roster and off-hours coverage, deadlines/delivery destination; evidence authenticity/sufficiency and independent financial reviewers; approved pause scope and real in-flight behavior; evidence/privacy/retention/audit/device rules; backup destination/key custody/schedule/retention/targets. No automatic data deletion, alerts, compensation, ledger posting or settlement authority adopted. The new interface uses existing tokens/branding; native screenshot/keyboard/TalkBack/large-text and reviewed Swahili copy are still unverified. Provider, genuine phone verification, existing-user migration and live /api versus development /api/v1 compatibility remain earlier independent blockers.


## Historical Phase 6 assessment

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
