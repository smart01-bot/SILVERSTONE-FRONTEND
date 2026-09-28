## Phase 3 UI wiring

Existing StyleSheet definitions, brand, wizard and navigation are preserved. Existing network cards now save typed unverified identifiers; New Request selects an unambiguous synthetic verified account per network and displays its identifier. Offline banner/retry state distinguishes saved from submitted. Queue/card/detail controls use current versions and recorded server states; main-agent detail exposes both legs/history and next action. Accept means reserve, never paid. Unknown shows reconciliation needed. Dashboard placeholders and fake growth/chart removed. No native screenshot or usability acceptance is claimed.

## Phase 2 review status

Existing style definitions, wizard order and brand tokens retained. Functional changes remove OTP/face-match simulation, add explicit draft persistence/resume and replace disconnected approval buttons with scoped detail/reason/correction actions and private image inspection. Pending/rejected/correction views show actual state and retained reviewer feedback. No fabricated metrics, fees or compliance claims added.

Android screenshots, compact/normal-width, keyboard, larger text, dark/light and picker/SecureStore checks remain unperformed because no native environment is available. Follow the Phase 2 handoff checklist before accepting UI/device readiness. Source preservation and a successful Hermes export do not satisfy that visual gate.

> Publication update — 27 September 2026: The user authorized remote development branches and publication of Phase 0 findings after the original read-only review. Both branches are based on the audited main commits. See README.md and PROJECT-STATE.md for current status. Historical statements below about unpublished documents or absent development branches describe the original review, not current state. Architecture proposals remain unapproved unless explicitly recorded otherwise.

# Design preservation and usability

Confirmed: keep Silverstone's identity and registration wizard. No visual change was made or approved in Phase 0. Source review is not device usability evidence.

Existing source tokens: light background #FFFFFF, dark #000000, primary #C8102E (light) / #E01535 (dark). Manrope display/headings, Inter body, platform monospace token; some wizard text explicitly uses RobotoMono. Preserve assets/images/SilverS.png and established navigation. Reconcile fonts against actual loading before changing them.

Preserve phone → OTP → personal → business/map/documents → selfie → review structure, with pending/rejected/correction states. OTP and selfie currently simulate verification; retain their place in onboarding but replace their behavior and false success wording. Copy changes required for truthfulness are not a redesign.

Operational hierarchy: amount, source account/network, destination account/network, request age/state, next authorized action. Main-agent queue should make 5–10 simultaneous requests distinguishable. No invented revenue, success rates or decorative dashboards. No new generic gradients, card grids or animations without a workflow purpose. Existing effects may be reduced only with reviewable before/after evidence.

Use clear wording: “Request saved on this device,” “Awaiting source payment,” “Payment confirmation pending,” “Action needed.” Never label an offline draft submitted, a provider acknowledgement paid, a selected document uploaded, or an animation verified. Silverstone fee is zero; provider fees stay unknown until confirmed.

Review criteria for every material UI change: screenshot at a compact Android width and a normal width; keyboard open; larger text; dark/light; natural EN/SW where supported; screen-reader labels and touch targets; slow/offline/reconnect; interruption and return. Preserve input on server errors. Confirmation view clearly identifies amount and both accounts. Do not expose sensitive documents on list cards. Keep uncertainty visible and actionable.

Phase 1 records baseline screenshots when a runnable build is available; no screenshot approval or Android behavior was demonstrated in this audit. Functional wiring changes should not silently replace the screen layout.
