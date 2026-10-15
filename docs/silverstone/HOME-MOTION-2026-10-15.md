# Home and theme interaction — 15 October 2026

## User direction

The user's recording compares Selcom and Silverstone. Their explicit feedback:

- Keep the PIN screen unchanged.
- Replace the home hero with rotating promotional banners for transfers and future credit.
- Credit is **coming soon**, confirmed by the user.
- Show previous completed transfer activity and totals inside a glass panel matching the navigation bar.
- Switch themes with one tap, using Selcom's expanding circular reveal as the reference.
- Provide a preview before an app build.

## Implementation

Three swipeable promotional banners cover moving float/cash, starting a float transfer, and upcoming Silverstone credit. Transfer actions open the existing Requests form and preserve its draft. The credit action explains that eligibility, limits and applications will be announced at launch. No invented credit score or active application flow is shown. Banners advance every 6.5 seconds; manual navigation pauses them. Autoplay pauses when unfocused, backgrounded, a screen reader or reduced motion is enabled, or the credit sheet is open. A pause/play control is available. Small pagination dots remain; the numeric banner counter was removed at the user’s request.

Following the user’s refinement, the home chart and its totals sit inside a rounded glass panel matching the navigation bar’s translucent fill, fine border, iOS blur and reduced-transparency fallback, with 7/30-day ranges, completed-transfer amount/count, and selectable daily amounts. It uses the signed-in agent's request history, excludes pending and unresolved transfers, deduplicates IDs, and groups actual completion timestamps in Tanzania time. `processedAt` or a confirmed payout history timestamp is required; request creation time is not treated as completion. Whole-shilling totals use BigInt. Missing or invalid completion data is excluded with a notice. Loading, empty, failed and stale-data states are distinct. The old 10,000-item slice was removed from the query; the adapter already loads all pages. The previous route-picker hero and its form-prefill changes were superseded by these banners.

The header theme button toggles immediately. Native builds use an in-memory screenshot of the current frame and an expanding SVG mask driven by Reanimated. The live screen changes beneath the image, without mounting another navigation tree. Capture failure falls back to a direct change; a watchdog removes an undecoded overlay. Repeated taps are guarded, unmounts cancel pending work, and reduced motion skips capture/animation. Browser previews use the View Transitions API with a circular clip. Profile retains the explicit Light/Dark/System preference settings.

Added Expo SDK 51 compatible `react-native-view-shot` 3.8.0. Rebuild the development client to enable native capture. Older clients fall back to a direct theme toggle.

## Validation and preview scope

- Unit coverage includes seven transition coordinator tests and seven activity aggregation tests: completed-only filtering, deduplication, Tanzania day boundaries, completion timestamps, history fallback, exact large totals, invalid data and empty ranges.
- All 75 tests pass. Android and iOS Expo/Hermes exports pass.
- Browser checks pass for autoplay, manual banner navigation, credit details, 7/30-day totals, chart pointer/keyboard selection, theme persistence, draft preservation, English/Swahili, compact layouts, empty/error states and reduced motion, with no browser exceptions.
- The private browser preview renders the actual React Native components through an isolated React Native Web harness with explicitly labelled synthetic history and native-service substitutes. It is a design preview, not a connected payment environment. The harness lives under `/workspace/work/ui-harness` in this session.
- Physical-device performance, native mask composition, large accessibility font sizes, and TalkBack/VoiceOver remain unverified. Browser checks do not replace native-device testing.
- The prebuilt repository `preview/public` artifact has not been regenerated. The private preview uses the isolated harness.
