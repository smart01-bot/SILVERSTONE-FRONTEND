# Phase 4 — local provider boundary and synthetic transaction evidence

28 September 2026. Independent local scope complete; **external provider gate BLOCKED and release acceptance PARTIAL**. No provider selected, no authorized external sandbox scope, no real payment/notification, no manual settlement. Phase 5 not started. Both repositories remain on development; nothing pushed, main/live databases/Firebase untouched.

Exact recovered Phase 3 local bases: frontend e04b47f07eb05ba9dfe649afe2d6c6d264feb238; backend 9111f7682257d3c6b8bd1935e4984f1ec679751d. Fresh remote development refs still frontend e92ad465429b54aa5c707d330e7d67badbeee631 and backend 8002e9b8d2c5d9393bad5c1fec5898ea0393adf0. Final local Phase 4 pins accompany the delivered handoff/recovery bundles.

Implemented disabled typed adapter, additive immutable attempt/inbox/result/effect tables, atomic synthetic evidence application and truthful detail copy/unknown charges. Synthetic confirmation never settles actual legs, completes an exchange, posts money or releases a hold. The API/worker cannot invoke the fixture harness.

Verified: 50 backend tests, 15 frontend tests, backend build, the three previous HTTP journeys plus a new provider-evidence HTTP journey, Android JS/Hermes export, provider-boundary JSDoc type check and unchanged existing detail StyleSheet. Native Android/PostgreSQL multi-connection and genuine provider evidence remain unavailable. Earlier OTP/storage/evidence/retention/reviewer-bootstrap gates remain open.

Read [Phase 4 handoff](handoffs/PHASE-04-HANDOFF.md) and [provider evidence/gates](PROVIDER-EVIDENCE.md). This heading supersedes historical current-phase wording below.

# Silverstone Phase 3 — local delivery

Status: local synthetic core-exchange gate passes; release acceptance remains PARTIAL. D09/D10 explicitly approved. Phase 4 not started. All changes on development, unpublished; main/live data untouched.

Starting local Phase 2: frontend 419fef2fb218ca3c4d3091f88c6bbd9d2c25213f; backend e4f31b46f6bdfa0868db19a5fd3e9136c78d0057.
Remote development: frontend e92ad465429b54aa5c707d330e7d67badbeee631; backend 8002e9b8d2c5d9393bad5c1fec5898ea0393adf0. Remote Phase 0 alone is not a valid continuation base. Final local SHAs are in the delivered handoff header and recovery bundles.

Implemented typed accounts, immutable two-leg request terms/history, FIFO queue, actor-bound idempotency, atomic synthetic reservations, durable preparation jobs/claim recovery, identity-bound offline retries and existing-screen controls. No provider execution/manual settlement, fee or fabricated financial completion.

Verification: 36 backend tests, 13 frontend tests, backend build, three actual frontend-client HTTP journeys and Android JS/Hermes export passed. Native Android and native multi-connection PostgreSQL evidence remain unavailable. Phase 2 OTP/storage/evidence/retention/bootstrap dependencies remain open. Read handoffs/PHASE-03-HANDOFF.md.

## Current phase pointer — Phase 2

Read PROJECT-STATE.md and handoffs/PHASE-02-HANDOFF.md for current local implementation. Older phase/proposal descriptions below remain historical. Both development branches contain unpublished local Phases 1–2; remote development still holds Phase 0. No live operation or Phase 3 started. Real phone verification and production evidence/storage policy remain unresolved; synthetic test success is not full onboarding acceptance.

## Phase 1 architecture approval — 27 September 2026

The user explicitly approved Expo → Express → PostgreSQL; Express authentication with revocable sessions; one assigned main-agent per sub-agent; and the proposed consistent API representation (D06, D07, D08 and D11). These supersede earlier proposed/unapproved wording for those decisions. D09 payment sequencing and D10 durable worker design remain proposals for later phases.

Authority: local implementation and verification on `development` in both repositories. Preserve the UI and charge no Silverstone service fee. Use isolated synthetic accounts; keep payments disabled. Do not delete, migrate or access existing Firebase users/data. Existing-user migration and live changes are separate. No push, main changes or deployment.

## Mandatory branch policy — all phases

Confirmed by the user on 27 September 2026: all Silverstone phases must be implemented on `development` in BOTH `smart01-bot/SILVERSTONE-FRONTEND` and `smart01-bot/SILVERSTONE-BACKEND`. All phase code, fixes, tests, documentation and handoffs belong on those branches. Any authorized publication of phase work must target `development` only.

Never implement on, commit to, push to or merge into `main` under phase authority. A later main-branch release requires separate explicit user authorization. Keep `feat/registration-wizard` as a donor reference; do not use it as the continuing implementation branch. Fetch the latest `development` refs and compare with the preceding handoff before every phase; never reset newer work to historical main pins.

This policy selects the implementation branches; it does not start a phase or independently authorize deployment, live data changes or real payments. Historical proposed-branch wording is superseded by this confirmed rule. Include it in every future phase initiating message and handoff.

> Publication update — 27 September 2026: The user authorized remote development branches and publication of Phase 0 findings after the original read-only review. Both branches are based on the audited main commits. See README.md and PROJECT-STATE.md for current status. Historical statements below about unpublished documents or absent development branches describe the original review, not current state. Architecture proposals remain unapproved unless explicitly recorded otherwise.

# Silverstone Phase 0 — complete review

Documentation draft; decisions not approved, nothing published.

# Silverstone — project context

Date: 27 September 2026, Africa/Dar_es_Salaam. Phase 0 review draft; not committed, approved as architecture, or deployed.

## Confirmed requirements

Silverstone coordinates two-leg float exchanges between approved sub-agents and their assigned main-agent. Its purpose is to reduce interruptions, overlapping requests, payment matching and reconciliation work. Silverstone is free and charges no service fee. Provider charges remain unknown; exchange volume must never be labelled Silverstone revenue.

The sub-agent supplies source-network float to the designated main-agent account; the main-agent supplies destination-network float to the sub-agent account. Each leg belongs to one traceable request. A provider's acknowledgement is not settlement confirmation.

Preserve the existing Silverstone brand and six-step registration wizard. Applicants may sign in while awaiting approval, but cannot perform operational actions. Authorized main-agents review applications, request corrections, approve or reject. Backend checks must enforce every permission; UI routing alone is insufficient.

## Proposed architecture (not approved)

Retain the root Expo / React Native app and Express service. Use PostgreSQL as the authoritative application and exchange store, with Supabase as the proposed host and private object storage. Keep one identity authority: recommended hardened Express authentication for the initial integration, subject to the existing-user inventory. Do not retain disconnected Firebase and Express identities.

Mobile app → versioned Express API → PostgreSQL. A separate durable worker processes eligible payment jobs through provider adapters. Provider events enter a verified callback inbox; reconciliation resolves uncertain outcomes. Redis may remain a cache or wake-up signal, but never the only record of pending money movements. Phase 1 keeps provider execution disabled.

## Context ownership

Recommended canonical home: SILVERSTONE-FRONTEND, continuing working branch, docs/silverstone/. Backend docs/SILVERSTONE-CONTEXT.md points to it and records the verified frontend documentation commit in each handoff. Backend-specific migrations, tests and runbooks stay in the backend. Avoid a second editable project bible.

Until these files are published with explicit authority, attach this Phase 0 pack to subsequent chats. Existing README, DEVLOG and HANDOFF records are historical evidence, not the current contract.

## Authority

Phase 0 permits read-only repository inspection and reviewable documentation only. No repository writes, pushes, merges, settings changes, deployments, live database access or payment tests were performed. Proposed branches and design decisions below are not approved merely because they appear in this pack. Each later launch message must state local implementation and publication authority separately.
