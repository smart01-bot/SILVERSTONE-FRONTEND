## Phase 6 decisions remain OPEN

D16 exception ownership/escalation; D17 reconciliation evidence/compensation; D18 scoped pause; D19 privacy/retention/audit scope; D20 backup destination/custody/RPO/RTO. These are concrete proposals in OPERATIONS.md, not approvals. Existing participants are not incident owners. No policy-dependent mutation implemented. D09/D10 preserved. Independent read-only presentation and no-store header require no new operating-policy adoption.

## Phase 5 decisions

No new policy/design approval inferred. Local refinement only; existing D09/D10/identity/authorization/idempotency remain unchanged. Read errors do not imply empty successful data. Reviewer conflicts retain screen inputs, require explicit reload and cannot act on a non-submitted revision. Unknown outbox entries retain the original key/payload. No automatic conflict merge, overwrite, discard or payment retry introduced.

## Phase 4 local choices — no new provider/policy approval

D09/D10 remain approved. D14 remains OPEN: no provider selected, no agent-float entitlement, tariff, sandbox scope or manual-settlement authority inferred. Official public discovery is recorded in PROVIDER-EVIDENCE.md. Independent implementation uses a disabled adapter plus an embedded-only synthetic protocol; real callback authentication remains unimplemented/disabled. One synthetic source attempt per leg is conservative and not a provider retry guarantee. Synthetic evidence never becomes real settlement. This does not approve ledger/refund/reconciliation policy or production operation.

## Phase 3 — D09 and D10 approved, 27 September 2026

The user explicitly approved D09 and D10 as presented, and authorized local Phase 3 implementation/verification on development in both repositories. No push, main changes, deployment, live database, real notifications or payments. These approvals supersede historical proposed wording below.

- D09 APPROVED: assigned main-agent accepts and atomically reserves destination capacity before source collection becomes eligible. Insufficient capacity blocks acceptance. Unknown payment outcomes retain the hold pending reconciliation.
- D10 APPROVED: PostgreSQL durable jobs with expiring leases and unique claim tokens. Expired preparation claims can recover; stale tokens cannot finalize. Unknown external outcomes must be reconciled before any retry.
- Capacity and verified operational accounts remain explicit synthetic fixtures only. Public account registration creates unverified identifiers, never verification/capacity. Provider execution and manual settlement remain disabled.

Local implementation details: FIFO server queue sequence; urgency is a review flag, not priority or a guarantee. Same-network exchange requests are rejected in this prototype. Existing terms/account snapshots are immutable. No money ledger entries are created without settlement evidence. Preparation jobs can become blocked, retryable or reconciliation-required, never settled. These details do not establish real provider capabilities or production balance policy.

## Phase 2 implementation decisions — 27 September 2026

User authorized local Phase 2 implementation/verification only on both development branches. No push/live changes/notifications/payments. Existing identity migration remains excluded.

Local implementation choices: PostgreSQL private bytea evidence for isolated tests; PNG/JPEG only with bounded content validation; database reviewer grant plus current assignment; immutable submitted versions and decisions; reject terminal, corrections resubmittable. Existing wizard fields determine prototype evidence requirements only. Production evidence/retention, first-reviewer roster/bootstrap and storage selection remain OPEN, not approved by this implementation.

No agreed OTP provider was found. Fail closed with unavailable delivery and block ordinary submission; synthetic fixture proof remains explicitly synthetic and test-only. Do not replace this with accepting arbitrary digits. Phase 2 full acceptance remains partial until dependency/device checks are closed.

## Phase 1 architecture approval — 27 September 2026

The user explicitly approved Expo → Express → PostgreSQL; Express authentication with revocable sessions; one assigned main-agent per sub-agent; and the proposed consistent API representation (D06, D07, D08 and D11). These supersede earlier proposed/unapproved wording for those decisions. D09 payment sequencing and D10 durable worker design remain proposals for later phases.

Authority: local implementation and verification on `development` in both repositories. Preserve the UI and charge no Silverstone service fee. Use isolated synthetic accounts; keep payments disabled. Do not delete, migrate or access existing Firebase users/data. Existing-user migration and live changes are separate. No push, main changes or deployment.

## Mandatory branch policy — all phases

Confirmed by the user on 27 September 2026: all Silverstone phases must be implemented on `development` in BOTH `smart01-bot/SILVERSTONE-FRONTEND` and `smart01-bot/SILVERSTONE-BACKEND`. All phase code, fixes, tests, documentation and handoffs belong on those branches. Any authorized publication of phase work must target `development` only.

Never implement on, commit to, push to or merge into `main` under phase authority. A later main-branch release requires separate explicit user authorization. Keep `feat/registration-wizard` as a donor reference; do not use it as the continuing implementation branch. Fetch the latest `development` refs and compare with the preceding handoff before every phase; never reset newer work to historical main pins.

This policy selects the implementation branches; it does not start a phase or independently authorize deployment, live data changes or real payments. Historical proposed-branch wording is superseded by this confirmed rule. Include it in every future phase initiating message and handoff.

> Publication update — 27 September 2026: The user authorized remote development branches and publication of Phase 0 findings after the original read-only review. Both branches are based on the audited main commits. See README.md and PROJECT-STATE.md for current status. Historical statements below about unpublished documents or absent development branches describe the original review, not current state. Architecture proposals remain unapproved unless explicitly recorded otherwise.

# Decision register

All proposals dated 27 September 2026. “Confirmed” means directly required by the user; “Proposed” requires explicit adoption. Nothing here implies remote publication authority.

| ID | Status | Decision / recommendation | Reason / dependency |
| --- | --- | --- | --- |
| D01 | Confirmed | No Silverstone service fee | Product requirement; provider fees unknown |
| D02 | Confirmed | Preserve brand and registration wizard; pending authentication without operations | Product requirement |
| D03 | Approved | Frontend development from verified main; selectively adapt wizard work | main already includes the wizard; feature branch has contract regressions and broad component rewrites |
| D04 | Approved | Backend development from verified main | Alternate branch has no unique commits and is three behind |
| D05 | Approved | Canonical cross-repo docs in frontend docs/silverstone; backend pointer | One editable source of truth |
| D06 | Approved | Root Expo app → Express → PostgreSQL, Supabase host/private storage | Fits current app and relational two-leg models; hosting/access unverified |
| D07 | Approved | Harden Express as single authentication authority | Reuses backend bcrypt and integration work; requires explicit existing-user migration plan |
| D08 | Approved | One active main-agent assignment per sub-agent; restricted reviewers | Prevent global review and cross-agent leakage |
| D09 | Approved | Main-agent accepts and reserves destination capacity before source collection | Avoid knowingly collecting funds without a destination plan; provider/operating policy must confirm |
| D10 | Approved | PostgreSQL durable jobs/outbox, leased workers; optional Redis | Recover work after worker/Redis failure without losing financial state |
| D11 | Approved | Versioned camelCase API, UUIDs, integer whole-TZS strings | Remove current shape drift and floating-point ambiguity; provider precision remains an external question |
| D12 | Open | Existing users/documents and schema migration | Owner must provide authorized non-sensitive inventory; do not assume empty database |
| D13 | Open | Evidence requirements, retention, reviewers and first main-agent bootstrap | Product/partner policy; no invented compliance claims |
| D14 | Open | Provider support, charges, limits, reversals and manual confirmation | No working provider execution verified |
| D15 | Open | Native Android source versus reproducible prebuild ownership | Compare native config/plugin changes before adopting; no automatic upgrade or regeneration |

## Historical Phase 0 rationale (superseded where noted above)

## Base selection and wizard preservation

Recommend creating LOCAL development branches from each main only when Phase 1 is authorized. Neither remote has a development branch in the observed branch inventory. Do not create them remotely under Phase 0 authority. If development appears later, inspect its history instead of resetting it.

Keep the feature branch intact as the donor reference. No merge or blanket cherry-pick is proposed. The compare is 13 commits ahead with zero behind, so it is technically mergeable by ancestry, but that does not make its integration correct.

| Area | Disposition | Verification before acceptance |
| --- | --- | --- |
| Step1Phone, Step2OTP, Step3Personal, Step4aMap, Step5Selfie and AuthNavigator | Already present on main; preserve structure | Compare source and screenshots; replace simulated verification in Phase 2 |
| Step4Business and Step6Review changes | Adapt field mapping and centralized submission intent | Persist actual documents, correct field names, durable pending profile |
| src/config/api.js | Reuse central client concept | Explicit environment, timeout, error envelope, token lifecycle, request idempotency |
| AuthContext and AppNavigator edits | Rework against agreed identity DTO | id/uid, email, pinSet, status and reset flow consistent; unknown status denies access |
| Approval/pending screen API changes | Retain screen design and adapt calls | Scoped detail endpoint, private documents, correction workflow |
| RequestCard, RequestDetailModal, NetworkBadge, time.js rewrites | Review separately; preserve main visuals until demonstrated improvement | Compare amount/network/next-action readability and all actions |
| Offline queue rewrite | Do not copy as working implementation | Keep failed items, bind queue to identity, use stable idempotency keys |
| Android project and custom settings plugin | Preserve donor source; defer automatic adoption | Native configuration audit and reproducible local Android build |
| main's-mirror | Do not merge | Diverged 76 commits behind; inspect individual ideas only if a concrete need emerges |
| Nested starter, Firebase hosting cache and Gitlinks | Propose targeted cleanup later | Confirm ownership and references first; no deletion in Phase 0 |

For each adapted hunk record donor SHA, destination file, reason and test evidence. Keep registration step order, input values, navigation/back behavior, map selection and document picker. Do not preserve false claims of OTP or selfie verification.

## Authentication proposal and alternatives

Recommended initial choice: Express-owned identity with bcrypt credentials, short-lived access tokens and revocable server sessions/rotating refresh tokens stored appropriately by the native client. This is a proposal, not current behavior. Tokens must have distinct purposes and checked issuer/audience/algorithm; reset tokens cannot authenticate API operations. Reload current account status, role and assignment on protected operations so suspension takes effect immediately. PIN/biometric unlock is a device convenience, never a replacement for server authorization.

Alternative: retain Firebase Auth as the sole issuer and validate it in Express with an explicit subject-to-agent mapping. This may be preferable if a material existing user base is confirmed. Supabase Auth is another option but adds a further migration; it is not selected merely because the database is hosted there. Select one approach before replacing credential flows. Do not accept both unrelated issuers indefinitely.

Migration: inventory existing identities and documents with separate authorization; map legacy IDs to immutable agent IDs; verify ownership through the existing trusted issuer or recovery flow, not email matching alone; rehearse export/import with synthetic data; plan re-login/reset and rollback; preserve read-only legacy records until reconciliation and retention decisions permit retirement. No live migration is authorized.

JWT validation rationale: RFC 8725 §3.12 recommends mutually exclusive validation rules for different token kinds: https://www.rfc-editor.org/rfc/rfc8725.html. Durable worker proposal: PostgreSQL documents SKIP LOCKED for queue-like consumers, not as a general consistency mechanism: https://www.postgresql.org/docs/14/sql-select.html. These sources support design proposals, not deployment or compatibility claims.
