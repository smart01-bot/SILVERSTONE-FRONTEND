# Silverstone current state — Phase 1

Updated 27 September 2026, Africa/Dar_es_Salaam.

## Branch and authority

All work belongs on `development` in both repositories. Never modify or merge into main under phase authority. Current phase is local-only: no push, deployment, live database operation or Firebase migration. The user approved Expo → Express → PostgreSQL, Express authentication with revocable sessions, one assigned main-agent per sub-agent, and the proposed consistent API format. Payments stay disabled; preserve the existing UI and zero Silverstone service fee.

| Repository | Verified remote base / local parent |
| --- | --- |
| Frontend development | e92ad465429b54aa5c707d330e7d67badbeee631 |
| Backend development | 8002e9b8d2c5d9393bad5c1fec5898ea0393adf0 |

Both bases were fetched and clean before editing. Changes since the earlier main audit were documentation-only. No AGENTS.md was found in applicable repository/ancestor paths. Local final commit IDs appear in the closing handoff artifact and chat; this document cannot contain its own final commit SHA. Remote branches have not received Phase 1.

## Result and gate

Local foundation implemented; automated API/client and embedded PostgreSQL checks pass. Native Android execution and native PostgreSQL/Docker verification remain open, so full device/environment acceptance is not claimed.

- New active backend graph: index.js → foundation/. No eager external connections or payment worker when imported; old broken legacy routes are unmounted.
- Isolated, transactional ss_v1 schema with checksum migrations; synthetic tests preserve legacy/public fixture data.
- Express login, registration of pending test accounts, current-state permission checks, scoped agent/request reads, strict tokens, rotating refresh and server logout.
- Existing mobile login and status flows use the API and separate SecureStore keys; no active Firebase imports. PIN reset requires password reauthentication; pending/unknown/suspended states cannot enter dashboards.
- Existing wizard layout remains, with preview labels and explicitly unavailable final submission. No false OTP/selfie verification, application submission or demo approval.
- Exchange writes, review decisions, network-account edits, provider operations and offline replay remain unavailable. Legacy offline/Firebase data is preserved.

See LOCAL-DEVELOPMENT.md in each repo and handoffs/PHASE-01-HANDOFF.md for commands, evidence and limitations. Phase 2 has not started. Password recovery delivery, complete onboarding and native verification remain blockers; do not treat synthetic API registration as completed KYC.
