# Phase 4 provider evidence and external acceptance gate

Reviewed 28 September 2026. **No provider selected or configured. No sandbox account/test scope approved. No external API calls made.** This is a local boundary and synthetic evidence model, not a working payment integration. D14 remains OPEN.

## Authoritative discovery, not account entitlement

[Selcom official API reference](https://developers.selcommobile.com/) documents wallet cashin, POS/agent cashout, vendor balance, C2B collection and status queries. Its Wallet Pull Funds section explicitly distinguishes successful push acknowledgement from a completed debit. Its ambiguous/in-progress guidance calls for status queries and escalation instead of immediate resubmission. C2B callback authentication is described separately from outbound request signing. These are product-level descriptions, not evidence that Silverstone can transfer agent float between its intended network accounts. A vendor balance endpoint is not proof of a reservation on each main-agent network account.

[M-Pesa official business developer page](https://business.m-pesa.com/developers/) describes developer access and C2B, reversal and transaction-status APIs. It does not establish Silverstone's Tanzania-specific account entitlements or the two required legs. No Mozambique/Kenya API or identifier mapping is adopted for Tanzania.

The following requirements are Silverstone's unresolved integration questions, not inferred provider capabilities or approved policy:

| Area | Verified Silverstone evidence | Required before a real adapter |
| --- | --- | --- |
| Provider/product/legal account scope | None selected | Owner selection plus provider-approved product, country and account scope |
| Agent float versus wallet value | Unverified | Written entitlement for source collection and destination agent-float delivery |
| Networks and identifier types | Local registry only | Per-leg network, phone/agent/till/account matrix and verified account ownership |
| Collection and consent | Unconfigured | Approved consent mechanism and test proof; app must never collect wallet PINs |
| Balance/reservations | Synthetic capacity only | Actual balance source, freshness, concurrent holds, funding and expiry policy |
| Fees/limits | Provider fee unknown; Silverstone fee zero | Tariff, payer, gross/net mapping, precision, minimum/maximum and limits |
| Stable references/idempotency | Synthetic per-leg UUID reference only | Provider reference syntax, uniqueness scope, replay window and lookup semantics |
| Callbacks | Real endpoint disabled | Exact product protocol, signature/token verification, raw body rules, replay protection and rotation |
| Settlement/status | No genuine evidence | Status dictionary, lookup and independent settlement evidence; acknowledgement is insufficient |
| Reversal/refund | Synthetic evidence states only | Provider capability and recovery/dispute policy; no automatic compensating payment |
| Sandbox | No approved access | Named provider/account/test scope, isolated credentials and authorized cases |
| Manual confirmation | Disabled | Separate scoped operator authority, independent reference/evidence checks, immutable audit and dispute ownership |

No selection, fees, manual settlement or production capacity policy is approved by implementing this document. Supply approved non-secret documentation and scope before connecting an external sandbox. Secrets must not enter repository files or handoffs.

## Implemented local boundary

`foundation/provider-boundary.js` provides JSDoc types, read-only capabilities and an adapter whose collection, payout, lookup, reversal and callback-verification operations always throw PROVIDER_UNCONFIGURED. There is no environment-variable escape hatch or SDK. `GET /api/v1/provider-status` requires an active approved session. `/api/v1/provider-events/*` rejects before app-session authentication and cannot persist or apply events. This is disabled behavior, not a callback authentication implementation.

Request detail/list includes provider flags, unknown fee/null amount, and separately labelled synthetic evidence summaries. No claim tokens, idempotency keys or inbox payloads are exposed. Existing owner/current-assignment authorization remains. The detail screen preserves its StyleSheet and clearly labels synthetic evidence as no real payment verified.

## Synthetic-only model

Migration 004 adds five tables: immutable provider_attempts, immutable provider_event_inbox, immutable provider_event_results, mutable provider_evidence_state and immutable provider_evidence_effects. Database CHECKs restrict the provider/scope to synthetic_fixture/embedded_test. No existing rows or prior migrations are changed. No real-provider records can be inserted into these tables without a later reviewed migration.

`scripts/synthetic-provider-evidence.js` is a test-only normalized protocol harness. The API and worker do not import it. It requires the explicitly marked embedded database wrapper; native database wrappers lack that marker. This prevents accidental runtime use, not a security boundary against someone editing local source.

Only a live, token-matching source-preparation claim with approved participants, synthetic accounts and a held reservation can prepare an attempt. Preparation writes immutable terms, one stable synthetic reference/key, and unknown evidence atomically; it marks the actual source leg unknown, request needs_attention and job reconciliation. The token is consumed before any simulated response. Crash/timeout recovery cannot redispatch that job. One attempt per leg is deliberately enforced; no replacement attempt/retry, destination dispatch, completed transition, financial ledger entry or hold consumption is implemented.

Intake validates bounded normalized fields and deduplicates provider/scope/event key plus canonical payload hash. Reuse with changed content conflicts. Accepted inbox rows survive a failed application transaction. Application locks request then event, validates request/leg/reference/amount/currency/network/both accounts, and commits projection, effect, history and immutable result together. Rejected matching errors are retained with reason; malformed/wrong-scope intake and conflicting key reuse are rejected without a second inbox row. Unknown references get a rejected result, not automated later reassociation.

| Existing synthetic evidence | Incoming evidence | Local treatment |
| --- | --- | --- |
| unknown/acknowledged | acknowledged/unknown/confirmed/failed | Record distinct state; actual settlement remains unverified |
| any except reversed | reversed | Record reversal once; hold remains |
| confirmed/failed | old acknowledgement/unknown | Ignore regression |
| confirmed | failed | Record conflict; retain confirmation evidence and reconciliation requirement |
| failed | confirmed | Record conflict; retain failure evidence and reconciliation requirement |
| reversed | confirmation/acknowledgement/unknown/failure | Preserve reversal; never re-confirm |
| same state | same or duplicate event | No repeated effect |

Confirmation/reversal effects have a unique attempt+effect key. They are synthetic evidence markers, **not monetary ledger postings**. Even synthetic confirmation keeps actual legs unconfirmed and reservations held. Every summary reports actualSettlementVerified=false and reconciliationRequired=true. Event IDs/timestamps do not imply provider ordering guarantees. A concrete provider's authentication, out-of-order resolution and reconciliation rules must replace this fixture protocol under separate review.

## Verification and remaining risks

Embedded tests verify duplicates, mismatched terms, stale leases, acknowledgement then timeout, retained holds, contradictory/out-of-order terminal events, reversal before confirmation, atomic rollback/retry, immutable records, disabled public mutation and scoped reads. These tests cannot prove a real provider's authentication/replay behavior, exactly-once external delivery, native PostgreSQL row-lock races or crash recovery. No genuine provider success or settlement is claimed.

Apply migration 004 only through the existing single explicit migrator against disposable local data. Additive tables still require DDL locks and application/migration version coordination. Preserve old code/data for rollback; only disposable test data may be discarded. Do not use destructive rollback after financial effects. Production scheduling, retention, retry budgets, monitoring, ledger/reconciliation and operational recovery remain future work.
