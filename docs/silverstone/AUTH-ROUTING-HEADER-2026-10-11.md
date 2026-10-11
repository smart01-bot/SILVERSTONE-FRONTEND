# Android auth routing and fixed brand header

11 October 2026. Frontend branch: `Development`. Baseline: `0cede1b7f7cf29ad30da06e6b43a19a090250517` (clean and fetched before editing).

## Observed problem

The user's Android recording shows `Endpoint not found.` on sign-in and a brand header that scrolls away. No credentials from the recording were used in testing or copied into this repository.

Live Render checks reproduce the exact JSON error at POST `/auth/login` and `/api/auth/login`. POST `/api/v1/auth/login` reaches credential validation. The previous client appended `/auth/login` directly to EXPO_PUBLIC_API_URL; setting that variable to the bare origin or legacy `/api` generated the broken paths. The installed APK's exact embedded URL is not available, so this is a reproduced routing failure and targeted correction, not proof of the installed value or successful account login.

## Changes

- Normalize an origin, `/api`, or `/api/v1` to exactly `/api/v1`, preserving the configured host and port. Trim whitespace/trailing slashes. Reject unsupported paths, userinfo, query strings and fragments before sending credentials.
- Native configuration defaults to `https://silverstone-backend.onrender.com/api/v1` when no override exists. All three EAS profiles explicitly use that URL. `.env.example` now defaults to that same hosted endpoint; the emulator-only URL is commented and labelled.
- Auth and registration headers are independent fixed overlays inside the safe area. The form reserves the measured header height, then scrolls behind it. No extra cards, text or decoration. Header position is unaffected by form scrolling; keyboard avoidance and all existing buttons remain.
- Record the fixed logo/wordmark requirement in the design guidelines.

## Verification

- `npm test`: 51 passed, 0 failed. New coverage checks login/register/recovery paths across accepted base URLs, rejects malformed configurations before transport, and preserves the local host/port.
- `npm run build`: passed Android JS/Hermes export. This is not a new APK.
- Actual updated client with the bare Render origin: a nonexistent synthetic account returned HTTP 401 `INVALID_CREDENTIALS`, replacing the reproduced HTTP 404 route failure. No real account creation, password use or successful login claimed.
- React Native Web component previews: eight scroll cases (login and personal-registration; light/dark; EN/SW; 360x500 viewport). Brand coordinates stayed unchanged while content moved at least 100px, header remained above content and within viewport, no page runtime errors. This is component layout evidence, not a physical Android keyboard/device acceptance test.
- `git diff --check`: clean.

## Loading the fix

Pull `Development` in the frontend checkout. For an existing Expo development client, restart Metro with the correct explicit URL and reload the app:

```sh
git switch Development
git pull --ff-only origin Development
EXPO_PUBLIC_API_URL=https://silverstone-backend.onrender.com/api/v1 npx expo start --dev-client --clear
```

Use the established tunnel option if the phone cannot reach the development machine. A standalone preview/release APK embeds its JavaScript and environment; it must be rebuilt and reinstalled to pick up this change. Merely pulling GitHub does not update an installed standalone APK.

## Remaining acceptance

Verify the updated app on the phone: real login, PIN creation/restoration, signup persistence, and keyboard/scroll behavior. SMS verification remains unavailable for final application submission; that is distinct from account creation/sign-in. The separately observed Render branch setting (`development` versus GitHub `Development`) was not changed in this frontend patch. No backend deploy, live database mutation, payment or privilege change was performed.
