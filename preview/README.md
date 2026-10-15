# Silverstone interactive UI preview

This is a prebuilt browser presentation of the actual post-login assigned-agent React Native screens from `ui-overhaul`. It requires Node.js but no package installation, Android SDK, Java, emulator or Expo account.

The agreed Home, Requests and Profile refinements from 15 October 2026 are implemented in `src/` and can be reviewed at the [current private preview](https://silverstone-motion-preview.whole-field-8456.chatgpt.site). The checked-in `public/` bundle below is an older preview snapshot; it does not include those refinements. App builds use the updated source, not this static bundle.

From the repository root (older snapshot):

```powershell
npm run preview:ui
```

Open <http://127.0.0.1:4174> and press `Ctrl+C` in the terminal to stop it.

The preview uses local synthetic fixtures and an isolated transport. It does not authenticate, contact the Silverstone backend, move funds, assign agent numbers, send notifications or create receipts. Native status/navigation controls, camera cutouts, safe-area hardware, blur composition and device performance still require native-device testing.

The files under `public/` are deliberately checked in so the preview runs without installing another JavaScript toolchain. Rebuild them only from the isolated UI fixture harness used for validation, then repeat the runtime checks documented in `docs/silverstone/UI-VALIDATION.md`.
