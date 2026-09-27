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
