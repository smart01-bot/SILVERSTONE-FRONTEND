# Swift Wakala global loader — 2026-10-15

Approved visual reference: https://silverstone-motion-preview.whole-field-8456.chatgpt.site/loader.html

The shared loader uses the same two SVG wings as the Swift Wakala logo and splash. Its 1.2-second loop gently separates the wings and moves the mark forward, returning to rest. Page and overlay marks are 66 × 56; button and refresh marks are 29 × 25. Colors follow the current theme or button foreground.

## Integration

- ScreenLoader, agent page placeholders, activity chart, history, main-agent lists, and approval/document loading use the shared mark.
- Agent, authentication, and registration buttons show the mark before their label while busy, hide the idle arrow, and retain disabled/busy accessibility state. Busy buttons retain full contrast.
- Pull-to-refresh keeps the native gesture and refresh callback, with a visible branded indicator in the scroll content instead of the platform spinner.
- Global operations use a dimmed, blurred overlay without a card. Native modal contents have their own loader boundary so submissions from a sheet remain covered without presenting a competing iOS modal. Background controls and Android back are blocked while loading.
- Existing showLoader/hideLoader operation lifecycles remain authoritative. Contextual submission, account-saving, and request-update labels are localized. No demo timer, progress percentage, or artificial completion was added.
- Reduced motion renders a stationary mark. Animation stops when the app is inactive, the route loses focus, or the component unmounts. Reduced transparency uses an opaque themed background.

## Validation

- Existing Node suite: 80 tests passed.
- Expo production exports completed for Android and iOS.
- Actual components rendered through the local React Native Web harness: light/dark, 320px layout, disabled busy button, persistent overlay until explicit hide, overlay inside native-modal wrapper, repeated show/hide cleanup, reduced motion, and no browser exceptions.
- Visual inspection confirmed the logo and button sizing. Browser harness stubs native blur; physical-device blur, native modal presentation, pull gesture, and animation performance still need device inspection.

The splash is included from commit 4e9402cd6990a860477c91bbae40e0a9515a1318. Its native splash configuration requires a fresh native build; this loader adds no further native dependencies.
