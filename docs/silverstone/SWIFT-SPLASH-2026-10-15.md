# Approved Swift Wakala opening animation

The native implementation follows the approved private preview: https://silverstone-motion-preview.whole-field-8456.chatgpt.site (preview source `8b9605645d9bf42b4068028b7bd103d672134553`).

`SplashScreen` uses the same two vector paths as `SwiftWakalaMark`, the preview's light/dark colours, centred wordmark and ownership line, 218px SVG canvas, responsive title size, and spacing. The preview toolbar is excluded from the app. Safe areas accommodate device system bars.

## Motion and startup

- Upper wing assembles over 520ms; lower wing begins at 90ms and finishes at 610ms. The wordmark appears from 300–720ms.
- Departure starts at 1100ms: the mark pulls back and accelerates diagonally upward over 570ms. The native easing reproduces the preview's overall ease-in-out and second-keyframe acceleration.
- The words fade from 1220–1450ms. The underlying destination and splash crossfade from 1550–1950ms.
- Transforms and opacity use the native animation driver. Reduced motion uses a stationary 350ms hold and 250ms fade, with no destination translation.
- Expo's native splash remains a plain theme-aware background until fonts, saved theme, accessibility preference and layout are ready. The former Silverstone launch images and separate pre-font loader are no longer configured.
- Auth restoration starts while fonts load. Slow account/PIN reads extend only the settled logo hold; a quiet localized message appears after 2500ms. An actionable connection/PIN-read error is a valid destination. No arbitrary timeout admits a user to Home.
- The next screen still comes from the existing account state: Login, application status, PIN setup, PIN entry, or the appropriate operational navigator. Underlying content remains inaccessible and untappable until the reveal completes. Startup does not repeat on ordinary navigation or session lock.
- PIN lookup results are tied to the account and profile revision. Obsolete async results are ignored, and a failed read provides Retry rather than treating the PIN as absent.

## Validation and build

80 tests pass, including five new navigator behavior tests for readiness, retained-account PIN gating, PIN-read failure/retry, obsolete async results, pending applications and connection errors. Android and iOS Expo exports pass. Expo native config introspection registers the splash plugin and both platform theme backgrounds.

The actual `SplashScreen` component was rendered in a browser harness and visually compared with the approved concept. Checked 390px/320px layouts, light/dark, slow-readiness hold/release, completed destination reveal, and reduced motion. The fixture and screenshots are in `/workspace/work/ui-harness` and `/workspace/work/splash-reference`.

`expo-splash-screen` is pinned to the Expo SDK 51 compatible `~0.27.7`. A fresh native development/release build is required to pick up this dependency and the launch-screen configuration. Exports and browser checks are not an APK/IPA or physical-device launch/performance verification; compare a cold start on the user's phone before final visual sign-off. Launcher icons, their automatic theme switching, and the next onboarding redesign remain separate tasks.
