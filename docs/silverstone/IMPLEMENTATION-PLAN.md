# Phase 5 — frontend refinement (local only)

28 September 2026, Africa/Dar_es_Salaam. Independent local implementation complete; **Phase 5 acceptance PARTIAL** pending observed Android journeys and visual review. Prior provider gate remains BLOCKED. Phase 6 not started.

Published Phase 4 baselines verified against authenticated remote development refs and clean retained local development checkouts: frontend `6d841de96272e44c21022b021784e90bb3ab57e8`; backend `a10e9fcf7f8dd0be8eda28a3fe237641440d2245`. These supersede older Phase 0 remote pins and pre-publication local IDs below. Phases 1–4 were published previously; Phase 5 is local only. No applicable AGENTS.md found in either checkout or ancestors.

Implemented real complete-list refresh, visible retryable read failures distinct from empty lists, retained reviewer reason/correction choices after stale-version conflict, explicit reload and disabled decisions on already-reviewed applications. Request detail has a current-state refresh, readable source/destination states, uncertainty/hold explanation and explicit unavailable payments. New Request validates whole-TZS strings without floating arithmetic and separates local save notices from errors, preserves unknown outbox entries and uses original retry keys. Selected documents explicitly remain unsaved until persistence succeeds. Added targeted accessible labels/selected/checked/busy states, keyboard avoidance for reviews, 48-point retry/choice targets and flexible input height. Restores both existing English and Swahili preferences on restart.

No rebrand, navigation/asset/token/translation replacement, provider policy, backend runtime, contract or migration change. Existing UI structure and wizard retained. New English copy needs reviewed Swahili translations; no translations invented. Payments, callbacks, manual settlement and real notifications remain disabled.

See `handoffs/PHASE-05-HANDOFF.md` for evidence, changed files, recovery and outstanding gates. Final exact local commits are recorded in the delivered handoff; remote development remains at the published Phase 4 baselines unless independently rechecked otherwise.

## Phase 4 checkpoint — 28 September 2026

Independent local provider boundary/evidence work complete. Full Phase 4 gate remains BLOCKED: no genuine provider sandbox entitlement or transaction evidence, no native PostgreSQL/Android acceptance. Read PHASE-04-HANDOFF and PROVIDER-EVIDENCE. Phase 5 remains Frontend refinement as defined below; only independent local refinement may proceed while prior gates stay explicit. Do not substitute ledger/reconciliation implementation for the approved sequence or imply payment readiness.

> Publication update — 27 September 2026: The user authorized remote development branches and publication of Phase 0 findings after the original read-only review. Both branches are based on the audited main commits. See README.md and PROJECT-STATE.md for current status. Historical statements below about unpublished documents or absent development branches describe the original review, not current state. Architecture proposals remain unapproved unless explicitly recorded otherwise.

# Phased implementation and measurable gates

Status: proposed sequence. Each phase runs in a separate chat and closes with updated state, affected docs and a handoff. No phase automatically grants push, deploy, live DB or real payment authority.

| Phase | Scope | Measurable completion gate |
| --- | --- | --- |
| 0 Baseline | Pinned source review, decisions, shared contract and handoff | Baselines and artifacts delivered; architecture/branch/contract adoption remains outstanding |
| 1 Foundation | Import/startup repair, schema baseline, selected identity, API connection, permission middleware and safe test harness | Clean isolated setup; migrations succeed on empty DB and sanitized legacy fixture; pending/unknown/suspended denied operational access; reset token rejected as access token; cross-owner/reviewer reads denied; frontend login→me→pending works; Android JS bundle validates |
| 2 Onboarding | Wizard drafts, genuine OTP if required, document uploads, submission revisions, scoped review/corrections | Applicant can resume draft, submit, receive correction, resubmit and be approved/rejected; unauthorized document/review tests fail closed; evidence/retention policy resolved or marked release blocker |
| 3 Exchanges | Verified accounts, assignment, request commands, two legs, reservation, durable queue/history | Ten concurrent requests remain traceable; repeated idempotency keys create no duplicate request; two workers cannot double claim/effect; capacity cannot oversubscribe; failed offline uploads remain bound to owner |
| 4 Provider bridge | Supported collection/payout, callbacks, lookup, reconciliation, recovery | Provider sandbox success/decline/timeout/duplicate/out-of-order/partial completion evidence; no duplicate payout in replay tests; unsupported capability blocks gate; mocks insufficient |
| 5 Frontend refinement | Polish existing workflows and accessible states without rebranding | Observed onboarding and exchange journey on representative Android devices, compact screens, keyboard, larger text and slow network; visual changes reviewed |
| 6 Operations | Exception ownership, reconciliation, alerts, privacy, backup/restore and scoped pause | Unknown/aged obligations visible and assigned; recovery drills and isolated restore verified; ledger/reconciliation discrepancies explained; audit reads scoped |
| 7 Controlled pilot | One main-agent and small approved group, explicit live authority and limits | Pre-agreed number/duration/limits and intervention targets documented before pilot; daily reconciliation, no unexplained differences or duplicate payouts |
| 8 Release | Explicitly authorized build publication and gradual expansion | Earlier gates met, named release owner, support/escalation, rollback and monitoring evidence; distinguish manual coordination readiness from automated payment readiness |

## Phase 1 work order

1. Re-fetch pins, inspect differences, confirm local HEAD/status and instructions. Adopt or resolve D03–D11 before architecture-dependent edits. Existing-user migration remains blocked until inventory; synthetic development can proceed after a single auth direction is approved.
2. Create proposed local development branches without remote writes. Put canonical docs in frontend and pointer in backend. Preserve old docs as historical, correct startup instructions and mark obsolete claims.
3. Separate backend app creation from server listen/worker startup and external connection initialization. Current tests import an app that is not exported and perform broad deletes/Redis flushAll. Add fail-closed test environment guards and disposable fixtures before executing them.
4. Align controllers/services/analytics with a single schema and DTO layer; define ordered migrations. Do not restore mock “completed” behavior merely to fix missing imports. Disable unimplemented financial endpoints/worker explicitly until their later gate.
5. Implement adopted authentication contract and server role/account/ownership/assignment checks. Public registration cannot grant roles or verification; recovery tokens single-use/purpose-bound; logout revokes session; no permissive unknown-status fallback.
6. Adapt central API client and auth screen wiring with main UI preserved. Fix loader binding, id/uid and profile fields, PIN reset email/endpoint mismatch and unlock callbacks. Remove active Firebase data paths only after mapping them; unused notifications must not create a second identity/data system.
7. Validate using isolated dependencies and synthetic data only. Frontend package has no npm run build: establish a reviewed local Expo Android bundle/export check and selected static/contract tests. Backend npm test/lint need harness/config repair first. Record actual commands/versions/results. Native APK/device check is separate from JS bundle validation; no EAS publishing under local-only authority.
8. Update state/decisions/issues, preserve donor hunk record, create Phase 1 handoff and next launch prompt. Any blocked essential gate leaves phase partial.

## Migration and rollback boundary

No live schema assumptions or destructive migrations. Test empty-schema bootstrap, additive upgrade, backfill counts/totals, unique constraints and transaction rollback in isolation. Keep legacy data accessible for mapping/reconciliation. Payments remain disabled through Phase 1. Existing database or identity cutover needs separately named environment and authorization.
