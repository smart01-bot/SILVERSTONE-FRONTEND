# Silverstone frontend — Phase 1 local setup

Use `development`. Preserve existing UI and assets. The active app now uses Express; it does not authenticate to or read/write Firebase. Legacy Firebase configuration, rules, installed dependency and existing remote users/data are preserved for a separately authorized migration decision.

1. Start the backend with `npm run dev:isolated` (see backend LOCAL-DEVELOPMENT.md).
2. Run `npm ci` here.
3. Copy `.env.example` to `.env`. `EXPO_PUBLIC_API_URL` must point at the isolated API. Android emulator on the same host: `http://10.0.2.2:8800/api/v1`.
4. Run `npm start`. Use the existing login screen and a synthetic account from the backend setup guide.

```sh
npm test
EXPO_PUBLIC_API_URL=http://10.0.2.2:8800/api/v1 npm run build:check
```

The build check exports an Android JavaScript/Hermes bundle. It does not build an APK, sign, publish or launch on a device. Existing cloud EAS commands are manual and outside Phase 1 authority. Node 24.19.0 was used for automated checks; native Expo SDK 51 compatibility must be verified on the device toolchain.

Login, account status, server-revoked sessions and scoped reads use `/api/v1`. API tokens use separate SecureStore keys; Firebase keys/data are never removed. PINs are device-local convenience locks using separate keys; password reauthentication is required to reset a PIN. Cold-start, background timeout, biometric and SecureStore behavior remain device verification items.

The existing wizard is preserved as a preview. OTP/selfie steps do not verify identity. Final application submission is explicitly unavailable and preserves the current screen inputs; do not enter real personal data. Phase 2 must implement drafts, private documents, submission and review before these workflows can claim success. Pending accounts cannot enter dashboards; suspended/unknown accounts also fail closed. No simulated approval button remains.

Exchange submission, payment commands and network-account editing are unavailable. Old offline records are not read, replayed or deleted. Identity-bound offline submission is Phase 3 work. `src/api/screenData.js` is a temporary read adapter for existing screen subscriptions, querying only server-scoped API records; API errors are not converted into fake successful writes. API fields/states remain canonical; presentation mappings preserve existing labels. Full exchange screen/amount/date handling remains Phase 3 work.

Historical README/SETUP/HANDOFF files predate this foundation. This guide and docs/silverstone/ take precedence; the user's Phase 1 instruction explicitly authorizes local installation and build verification.
