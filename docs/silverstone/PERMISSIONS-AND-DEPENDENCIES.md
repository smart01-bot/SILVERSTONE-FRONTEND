## Phase 2 current implementation boundary

Local review now requires a reviewer_grants record (unrevoked), active/approved main-agent status and current assignment. No self-review, unassigned review, role promotion or client verification writes. Transactional decision audit identifies reviewer/revision/reason/time; document reads record access. Unsubmitted draft contents remain applicant-only.

Disposable fixture bootstrap only: main@example.test authorized reviewer; pending@example.test assigned applicant with explicitly synthetic phone proof. This does not approve a production roster or provisioning policy. Production assignment/provisioning, required evidence/retention/terms, real OTP delivery and production private storage remain unresolved. Ordinary applicants can draft but cannot bypass the verification/assignment gate. See Phase 2 handoff before continuing.

> Publication update — 27 September 2026: The user authorized remote development branches and publication of Phase 0 findings after the original read-only review. Both branches are based on the audited main commits. See README.md and PROJECT-STATE.md for current status. Historical statements below about unpublished documents or absent development branches describe the original review, not current state. Architecture proposals remain unapproved unless explicitly recorded otherwise.

# Assignment, review and external dependencies

Status: proposed policy. Product owner must approve operating policy before implementation relies on it.

## Assignment and authorization

Recommend a main-agent invitation with server-recorded sponsor assignment, or an operator-managed assignment for walk-in applicants. A client cannot choose an arbitrary reviewer or set its own assignment. Initial main-agent provisioning is an audited administrative operation outside public registration. No such provisioning was performed.

One active main-agent assignment per sub-agent is the initial proposal. Snapshot assignment on each request: later reassignment must not silently move an in-flight financial obligation. Block reassignment while unresolved exchanges exist, unless an explicit audited handover accounts for them.

| Actor | Own profile/application | KYC documents | Exchanges | Review / assignment |
| --- | --- | --- | --- | --- |
| Anonymous | Register/login/recovery only | No | No | No |
| Pending/rejected applicant | Own permitted draft/corrections/status | Own only | No | No |
| Active sub-agent | Own allowed fields | Own only | Create/view own; cancel only if safe | No |
| Active main-agent | Own profile | Assigned applications only | Assigned queue/accounts/requests only | Assigned application review; no role promotion or self-review |
| Suspended account | Restricted status/support/logout, policy-defined | No new broad access | No new operations | No |
| Explicit operator capability | Minimum necessary | Only if separately granted | Recovery scope only | Provision/reassign with audit; no implicit unrestricted admin |
| Worker/provider callback | Service capability | No | Validated eligible job/event only | No |

Apply checks to reads, lists, downloads, updates, streams and workers, not only buttons. Do not trust JWT role alone. Review one submitted revision using optimistic locking; approve/reject/correction races return conflict. Include reason and required field corrections. Rejection never deletes evidence/history. A main-agent cannot review their own application or approve arbitrary agents. Define who approves main-agents before launch.

## Capability questions (unverified, no provider selected)

| Question to resolve | Required evidence | Gate / owner |
| --- | --- | --- |
| Can APIs transfer agent float, or only ordinary wallet value? | Written account/product compatibility and sandbox example | Phase 3/4; provider + owner |
| Which networks and identifier types work for both legs? | Provider capability matrix and verified test accounts | Phase 3/4 |
| Collection mechanism: push, merchant collection, agent transfer? Who authorizes it? | Request/consent sequence and supported authentication | Phase 4 |
| Can main-agent payout use the actual destination float account? | Contract entitlement and successful sandbox payout | Phase 4 |
| How is settlement distinguished from acceptance? | Status dictionary, lookup API, settlement statement | Phase 4 |
| Callback authenticity, replay protection, ordering, retries? | Provider signature/verification documentation and test fixtures | Phase 4 |
| Idempotency, reference uniqueness and timeout recovery? | Replay guarantee/window and query-by-reference semantics | Phase 4 |
| Balances, holds/reservations, limits and insufficient float? | Balance API semantics and operational capacity policy | Phase 3/4 |
| Fees and who pays? Net versus gross settlement? | Approved tariff and accounting mapping | Before displaying transaction totals |
| Reversals, refunds, partial completion and dispute ownership? | Supported API/manual process and reconciliation evidence | Phase 4/6 |
| Sandbox access and production onboarding? | Named provider contact, credentials supplied privately, approved accounts | Phase 4/7 |
| Availability, escalation and recovery targets? | Actual agreement, no invented SLA | Phase 6/7 |

Other dependencies: existing identity/schema/storage inventory; isolated PostgreSQL and optional Redis test instances; private storage access; SMS OTP delivery and email recovery provider; approved KYC evidence/retention/terms/support contacts; Android build environment and representative devices; app signing/hosting ownership; operational main-agent roster and account verification.

Manual coordination can be a separately approved mode, but must show operator-confirmed evidence and unresolved obligations. It does not meet the automated provider gate. No real payment, notification to another person or credential request was sent in Phase 0.
