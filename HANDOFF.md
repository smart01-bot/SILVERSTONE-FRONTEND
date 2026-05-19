# Handoff — Silverstone Frontend

_Generated 2026-05-19 · branch `feat/registration-wizard`_

## What this is

Silverstone — "Tanzania's First Float Management System." React Native / Expo app
backed by Firebase (Auth + Firestore). Two roles:

- **sub-agent** — requests float transfers, sees own history
- **main-agent** — manages the queue, approves/rejects agents, sees overview stats

**Stack:** React Native 0.74.5 + Expo SDK 51, Firebase 10.12, Expo Notifications,
React Navigation 6. Node 20.19.4 (`nvm use` is baked into the npm scripts).

## Branch state

`feat/registration-wizard` is **8 commits ahead of `main`** and not yet merged/pushed
beyond `origin/feat/registration-wizard`.

```
2e8225c try
bda41ac fix: Issues 2-6 — i18n, StatusBar, theme pills, onSnapshot errors
7d1590b fix: remove duplicate RobotoMono import in App.js
74769f3 fix: main-agent screens — fonts.mono, gradSurf tokens, view docs wired
2be0abd feat: RobotoMono, AnimatedInput mono/containerStyle, MyRequests modal, RoleSelect Step1Phone
dfbc1bc chore: remove leftover files
70291db / 09fedd2  chore: ignore Firebase service account key
```

Diff vs `main`: 21 files, ~352 insertions / 112 deletions.

**Uncommitted:** only the `.claude/worktrees/agent-a8edf3ea84e9e92d2` submodule pointer
is marked dirty (a stray `.idx/dev.nix` edit inside the agent worktree). Nothing of
substance is uncommitted in the main tree.

## What was built / changed on this branch

- **Registration wizard** — 6-step flow now exists in `src/screens/auth/`:
  `Step1Phone` → `Step2OTP` → `Step3Personal` → `Step4Business` / `Step4aMap` →
  `Step5Selfie` → `Step6Review`, plus `PendingScreen`. Wired into `AuthNavigator`.
- **Theming** — RobotoMono font added (`@expo-google-fonts/roboto-mono`), `fonts.mono`
  token in `theme.js`, `gradSurf` surface tokens, theme pills, StatusBar consistency,
  pure-black dark / pure-white light backgrounds.
- **i18n** — 48 new strings in `src/constants/translations.js`.
- **Components** — `AnimatedInput` gained `mono` + `containerStyle` props.
- **Screen fixes** — main-agent (Agents/Approvals/Overview/Queue/Transfers) and
  sub-agent (Home/MyRequests/Profile) screens: font tokens, `onSnapshot` error
  handling, "view docs" wired, MyRequests detail modal wiring.

## Architecture notes (from DEVLOG.md)

- **PIN overlay**: `AppNavigator` renders the role dashboard inside one
  `NavigationContainer`, then conditionally renders `PinEntryScreen` / `ForgotPinScreen`
  as an `absoluteFillObject` overlay *outside* it. `sessionLocked` is the single gate
  for both cold-start and session-timeout PIN. No LockStack, no second container.
- **No manual navigation after auth changes** — `AppNavigator` watches
  `[user?.uid, profile?.pinSet, profile?.status]` and re-routes automatically (state
  cascade). PendingScreen/RejectedScreen/PinSetup are rendered directly off profile
  status, not pushed.
- `AuthContext` uses an `onSnapshot` listener with a `hasInitializedSession` ref.

## Backlog (not started)

- [ ] Push notifications on request status change — infra exists
      (`src/config/notifications.js`, `src/hooks/useNotifications.js`) but not fully wired
- [ ] Agent phone-number management (link networks to specific numbers)
- [ ] PDF receipt generation for completed transfers
- [ ] Wire to the Node.js backend on Render (`svc-backend-6f2a.onrender.com`) — not yet
      connected; app currently talks directly to Firestore

## Loose ends / things to verify

- Leftover `*.PATCH.js` files in `src/navigation/` and `src/screens/sub-agent/`
  (`AuthNavigator.PATCH.js`, `HomeScreen.PATCH.js`, `MyRequestsScreen.PATCH.js`) —
  confirm these are dead and remove, or apply them.
- A stray `src/.env` and a top-level `silverstone/` directory and `context-mode/`
  exist alongside the app — confirm intent before merge.
- Top commit `2e8225c "try"` and `0d2d7e0 "damn"` / `5e99542 "maadkid"` are
  work-in-progress commit messages; consider squashing before merging to `main`.

## Running it

```
npm install        # run manually — do NOT let the agent run installs/builds
npm start          # expo start --lan
npm run android    # or build:android (EAS preview)
```

Firebase config is in `src/config/firebase.js`; `.env` holds keys (gitignored).
Service-account key is gitignored.
