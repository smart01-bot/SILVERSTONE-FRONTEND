# Silverstone agent UI refinement — 11 October 2026

Scope: opening screen, shared pre-login/PIN/recovery controls, and the four sub-agent tabs (Home, Requests, History, Profile). Presentation only; authentication, ownership, API contracts, payment orchestration, offline idempotency and manual approval remain unchanged.

## Direction

Android-first financial coordination for agents, with confident silver/AMOLED contrast, clear numbers, selective translucent chrome, and restrained responsive interactions. Design variance 5/10; motion 4/10; density 4/10. Preserve the Silverstone mark, existing fonts and navigation, English/Swahili, fixed header and uncluttered screens.

Guidance read and used:
- https://github.com/RubenGlez/mobile-design — mobile hierarchy, forms, interaction states, accessibility, platform behavior and review.
- https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md — deliberate art direction, limited decoration, purposeful motion and self-critique.

User preferences override generic skill recommendations. No wholesale skill installation or design-system replacement. Improve hierarchy before adding decoration. Do not invent balances, activity, agent identifiers or payment success to fill space.

## Changes

- Brighter silver light canvas, retained true-black dark canvas and clearer surface separation. Shared tokens also improve registration contrast.
- Home has one inverse branded focal area for starting a request, with a compact latest-request surface and useful empty-state guidance.
- Request endpoints use distinct collection/payout labels, focus-responsive rails and larger numeric emphasis. Wallet/agent/till selectors have explicit selected treatment and 48dp minimum height. Review and submission keep their existing payloads.
- History retains real list data, with stronger amount hierarchy, responsive pressed rows, clearer filter affordance and a designed empty state.
- Profile uses a stronger identity block, real email fallback, account/preferences grouping and explicit accessible row labels.
- Shared buttons respond with restrained spring feedback; reduced motion and disabled states reset transforms. No action is triggered by animation.
- Bottom navigation has visible labels and a moving selection surface; existing route names, drafts and lazy scene mounting remain intact.
- Auth typography, focused fields, primary actions and PIN progress have stronger emphasis. The opening screen uses the existing mark more prominently. The indeterminate loader remains truthful.
- Sheets have a clearer elevated surface and larger close target; no drag affordance is shown because these Modal sheets do not implement dragging.

## Verification

Frontend test suite and Android bundle export passed. Isolated React Native Web component previews exercised light/dark agent screens, compact Swahili layouts, navigation into requests, profile editing, exact originating/destination payload preservation, PIN creation/mismatch/unlock, recovery, short viewport access, enlarged text and fixed auth headers. Preview services and example records were isolated from the app/backend and are not shipped.

No new package or native module. Spring API was checked against installed React Native 0.74 source. Current platform docs were consulted; archived documentation URL redirected/was unavailable, so no newer API was adopted from those pages.

Limits: browser component checks are not Android device verification. Real keyboard/insets, TalkBack, frame timing and the installed APK still need device review. No financial transaction was executed. Backend and database are untouched by this UI task.
