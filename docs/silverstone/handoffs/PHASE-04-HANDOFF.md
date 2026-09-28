# Silverstone Phase 4 — Provider Boundary and Transaction Evidence

28 September 2026, Africa/Dar_es_Salaam. **Independent local work complete. External provider integration BLOCKED. Release acceptance PARTIAL. Nothing pushed. Phase 5 not started.**

## Baseline and authority

| Repository | Exact Phase 3 starting local development | Fresh remote development, unchanged |
| --- | --- | --- |
| smart01-bot/SILVERSTONE-FRONTEND | e04b47f07eb05ba9dfe649afe2d6c6d264feb238 | e92ad465429b54aa5c707d330e7d67badbeee631 |
| smart01-bot/SILVERSTONE-BACKEND | 9111f7682257d3c6b8bd1935e4984f1ec679751d | 8002e9b8d2c5d9393bad5c1fec5898ea0393adf0 |

Exact clean retained worktrees recovered at /workspace/scratch/513e9cb0b272/frontend and /workspace/scratch/513e9cb0b272/backend. No reset or Phase 0 reconstruction used. Remote refs fetched through authenticated GitHub integration. Main unchanged: frontend e12cb22e802687e3e805d5d8f819779a6ee34452; backend 17f7276198af5593fd277f940e7212768a8d0ddd. No applicable AGENTS.md found. Both setup guides and required shared context/state/decisions/API/issues/dependencies/design/Phase 3 handoff read completely.

User authority: local implementation and verification on development only in both repositories. No pushes, main modification, deployment, live database access, Firebase migration/deletion, external provider/sandbox calls, real notifications/payments or manual settlement. D09/D10 remain approved; D14/provider policy remains unresolved. No new material provider choice made. Prior 36 backend/13 frontend tests, backend build, three HTTP journeys and Android export passed again before implementation.

Final local commit pins are in the delivery header and Phase 5 initiating file; a commit cannot include its own hash. The incremental bundles include all four unpublished phases from the known remote Phase 0 baselines. Remote Phase 0 alone is NOT a valid continuation base.

## Delivered

1. Typed, explicitly disabled provider boundary. Collection, payout, lookup, reversal and callback verification always fail closed. No SDK, account credential, configured provider or environment toggle. Authenticated provider-status reports unconfigured/disabled, agent-float support unverified and provider charges unknown.
2. Additive migration 004-provider-evidence.sql: immutable per-leg attempt/reference records, durable deduplicated inbox, immutable application results, synthetic evidence projection and unique per-attempt confirmation/reversal markers. Prior migrations and records unchanged.
3. Test-only normalized event protocol, guarded to embedded synthetic databases and excluded from the active API/worker graph. Current live source claim is consumed transactionally into reconciliation before any simulated response. One stable synthetic reference/idempotency key per leg; no blind retry/replacement attempt or automatic hold release.
4. Scope/reference/request/leg/amount/currency/network/both-account validation. Duplicate event keys replay one inbox row; changed payload conflicts. Event application locks request then event and commits result/projection/history/effect atomically. Failure before result commit rolls everything back; durable intake remains for retry.
5. Distinct acknowledgement, unknown, confirmation, failure and reversal evidence. Out-of-order acknowledgements cannot regress terminal evidence; conflicting confirmation/failure is recorded for reconciliation; reversal dominates late confirmation and never deletes earlier evidence. Unique attempt/effect keys prevent duplicate local markers.
6. Synthetic evidence cannot settle real legs, complete requests, create monetary ledger entries, dispatch a payout or release/consume capacity. Actual source stays unknown, request needs_attention and hold retained. Every evidence DTO explicitly reports actualSettlementVerified=false and reconciliationRequired=true. Destination execution and real settlement remain unimplemented.
7. Existing request detail now distinguishes Silverstone fee zero from unknown provider charges, says provider unavailable/do not send funds, and labels synthetic evidence clearly. Existing StyleSheet is unchanged; registration wizard, assets and navigation untouched. No native visual acceptance claimed.
8. Provider discovery and required capability matrix in docs/silverstone/PROVIDER-EVIDENCE.md, shared docs and local guides updated. Selcom/M-Pesa public product documentation was reviewed; no account entitlement or Tanzania agent-float compatibility inferred.

## Verification after code changes

| Check | Result / scope |
| --- | --- |
| Backend npm test | 50 passed, zero failures; embedded PGlite |
| Frontend npm test | 15 passed, zero failures |
| Backend npm run build | Passed: 28 JS syntax checks, 10-file active import graph; no import startup |
| scripts/client-integration.js | Existing actual frontend client auth HTTP journey passed |
| scripts/onboarding-client-integration.js | Existing draft/private evidence/correction/approval HTTP journey passed |
| scripts/exchange-client-integration.js | Existing lost-response/outbox/idempotency/reservation/disabled worker/cancellation HTTP journey passed |
| scripts/provider-client-integration.js | New actual client/DTO/presentation HTTP journey passed; scoped reads, synthetic confirmation labelled, hold retained, callback disabled |
| Android npm run build:check | JS/Hermes export passed with explicit isolated API URL; no APK/device execution |
| JSDoc adapter type check | TypeScript checkJs passed using existing frontend compiler; no new dependency |
| Frontend syntax/styles | Changed JS/JSX parsed; existing detail StyleSheet byte-identical to Phase 3 |
| git diff --check | Passed both repositories |

14 additional backend checks (including group/upgrade tests) cover disabled transport and callback, expired/replaced claims, timeout after acknowledgement, deduplication/content conflicts, wrong terms/scope/reference, rollback/retry, contradictory/out-of-order events, once-only reversal markers, reversal-before-confirmation, scope privacy and participant suspension. Migration upgrade snapshots every preexisting ss_v1 table and validates prior checksums; existing Phase 2 document/session/legacy preservation tests continue passing.

Embedded Promise concurrency is serialized by PGlite: NOT native multi-connection PostgreSQL proof. Service reconstruction and injected transaction failure are NOT native database-process crash tests. No postgres, psql, Docker or adb executable available. Native Android PIN/SecureStore/UUID/AsyncStorage/app-kill/network switching/picker/screenshots/compact width/keyboard/large text/accessibility remain open. Frontend module-type/npm proxy/Expo ownership warnings remain nonfatal. No dependency audit claimed.

## Migration and recovery

Run only the existing single explicit migrator on disposable local data. 004 adds tables/indexes/triggers only, no existing record backfill or deletion. Old SQL checksums unchanged; no legacy/public/Firebase tables touched. Additive DDL still takes locks and needs application/migration version coordination. Native and production migration readiness is unverified.

No destructive down migration. Preserve original code/data; disposable preview data can be discarded. Recovery after actual financial effects would require approved reconciliation/compensating entries, never history deletion. No such effects occurred. The isolated preview remains in-memory and resets on stop. Fixture inbox tables are durable within the database design; persistent/native restart is not proven here.

## Remaining gates and conservative limits

- No selected provider/account/product or approved sandbox scope. Need written two-leg agent-float entitlement, network/identifier compatibility, collection consent, true balance/reservation freshness, fee/limit/precision policy, reference/idempotency window, callback authentication/replay contract, status/settlement/lookup meanings, reversals and escalation ownership. Public docs do not close these gates.
- Real callbacks stay disabled; forged request rejection is NOT proof of a provider signature implementation. Normalized fixture events use no invented signature protocol.
- Tables accept only synthetic_fixture/embedded_test. A real provider requires reviewed schema/adapter changes. One source attempt only; no destination dispatch, multi-attempt policy, ledger, real settlement, refunds or reconciliation-resolution endpoint. All unknown/synthetic attempts keep reservations indefinitely. No automated expiry/retry/consumption.
- Unmatched references are retained with rejected result; no automated later reassociation. Key collisions return conflict without a second event record. Production ingress retention/quarantine, monitoring, retry budgets and scheduler remain open.
- Manual confirmation remains disabled pending separate scoped operator authorization, independent evidence/reference verification and audit policy.
- Earlier gates remain: genuine phone verification (ordinary applicants cannot submit), production evidence/storage/retention/terms, reviewer bootstrap, existing-user migration and native device/database acceptance.
- No Silverstone fee. Provider charges unknown. No financial/production readiness or external successful transaction claimed.

## Changed files and package

Frontend: LOCAL-DEVELOPMENT.md; src/components/RequestDetailModal.jsx; src/api/providerEvidence.js; tests/providerEvidence.test.mjs; docs/silverstone/{README,PROJECT-CONTEXT,PROJECT-STATE,DECISIONS,API-CONTRACT,KNOWN-ISSUES,PERMISSIONS-AND-DEPENDENCIES,DESIGN-GUIDELINES,EVIDENCE,PROVIDER-EVIDENCE,IMPLEMENTATION-PLAN}.md; docs/silverstone/handoffs/PHASE-04-HANDOFF.md.

Backend: LOCAL-DEVELOPMENT.md; docs/{PROJECT-STATE,SILVERSTONE-CONTEXT}.md; foundation/{app,exchanges,provider-boundary}.js; migrations/004-provider-evidence.sql; scripts/{embedded,synthetic-provider-evidence,provider-client-integration}.js; tests/foundation/provider-evidence.test.js.

Delivery ZIP contains only Phase 4 affected files, verification logs, documentation and two incremental recovery bundles carrying Phases 1–4. No node_modules, Expo dist, credentials or full repository archive. See README-PHASE-4.md inside the ZIP for exact base/pin/recovery instructions.

## Next chat

Recover exact delivered local commits on development and verify remote pins before any edits. Carry partial external/native/OTP gates forward. Read Phase 5 initiating message as the planned frontend-refinement task with existing branding/styles preserved; it does not enable payments or resolve D14. Phase 5 was not started here.
