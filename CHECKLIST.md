# Silverstone App — Feature Checklist

## Build & Infrastructure
- [x] Expo 51 + React Native 0.74.5
- [x] Firebase Auth + Firestore connected via app.json extra
- [x] EAS Build configured (preview + development profiles)
- [x] Android APK standalone build working
- [x] Node 20.19.4 locked via .nvmrc

## Auth Flow
- [x] Email login screen
- [x] 3-step KYC registration (Personal → Business → Identity)
- [x] Pending screen with 4-step animated tracker (real-time via onSnapshot)
- [x] PIN setup (4-digit)
- [x] PIN entry overlay (session lock after 5 min background)
- [x] Biometric authentication (fingerprint / face)
- [x] Forgot PIN flow (re-verify password → reset PIN → new PIN setup)
- [x] Rejected account screen
- [x] Session timeout after 5 min background
- [x] 3-attempt lockout (30 min cooldown)
- [x] Auto-routing via AppNavigator on auth state changes

## Sub-Agent Features
- [x] Home screen with hero card (volume, stats)
- [x] 30-day volume chart
- [x] Volume by network breakdown
- [x] Quick action buttons (New Request, My Requests, Track, Profile)
- [x] New float request form (network pickers, phone, amount, urgent toggle)
- [x] Offline request queue (syncs on reconnect)
- [x] My Requests screen with filter pills (All, Pending, Completed, Rejected)
- [x] Request detail modal (swipe to dismiss, cancel/retry actions)
- [x] Profile screen with inline edit (Name, Phone, Business Location)
- [x] Networks screen (manage 4 networks with phone numbers and toggles)
- [x] Theme selector (Auto / Light / Dark)
- [x] Language selector (EN / SW)
- [x] Share receipt to clipboard (WhatsApp-ready text)
- [x] Copy request ID on long press

## Main Agent Features
- [x] Overview screen (platform stats, charts, network breakdown)
- [x] Queue screen with filters (Pending, Approved, Completed, All)
- [x] Request detail modal (approve, process transfer, reject)
- [x] Transfers screen (completed transaction history)
- [x] Agents screen (approved agent roster)
- [x] Approvals screen (pending agent applications, approve/reject)
- [x] Live badge counts on tab bar (pending queue, pending approvals)

## Design
- [x] Dark / Light mode with device detection + manual override
- [x] Ionicons tab bar icons (active/inactive states + dot indicator)
- [x] Avatar component (initial-based, color-coded)
- [x] PressableCard component (spring press animation)
- [x] SkeletonLoader component (shimmer loading states)
- [x] Toast component (success/error/info, auto-dismiss)
- [x] StatusBadge with colored dot (Pending, Approved, Completed, Rejected)
- [x] Haptic feedback (light, medium, heavy, success, error, warning)
- [x] Zero emojis in UI (all replaced with Ionicons / MaterialIcons / Feather)
- [x] Screen-off prevention during queue processing (expo-keep-awake)

## Firestore Security Rules
- [x] Agents: read own doc + main-agent reads all
- [x] Requests: agents create/read own, main-agent reads/updates all
- [x] Transactions: all auth users read, main-agent writes only

## Infrastructure Scripts
- [x] scripts/seedFirestore.js — creates first main-agent document
- [x] scripts/checkAgent.js — validates agent document fields

## Pending / Future
- [ ] Push notifications (expo-notifications wired, token registered — Expo Push API calls not yet implemented)
- [ ] PDF receipt generation
- [ ] Request swipe-to-reject gesture in QueueScreen
- [ ] Pull-to-refresh on all list screens
- [ ] Hero card pulse animation
- [ ] Biometric preference persistence



Section 1  — Auth & Onboarding      40% ▓▓░░░░░░░░
Section 2  — Sub-agent Home         50% ▓▓▓▓▓░░░░░
Section 3  — New Request            40% ▓▓▓▓░░░░░░
Section 4  — Request History        30% ▓▓▓░░░░░░░
Section 5  — Request Detail Modal   20% ▓▓░░░░░░░░
Section 6  — Sub-agent Profile      30% ▓▓▓░░░░░░░
Section 7  — My Networks            20% ▓▓░░░░░░░░
Section 8  — Main Agent Overview    40% ▓▓▓▓░░░░░░
Section 9  — Queue                  40% ▓▓▓▓░░░░░░
Section 10 — Action Modal           30% ▓▓▓░░░░░░░
Section 11 — Transfers              30% ▓▓▓░░░░░░░
Section 12 — Agents Screen          30% ▓▓▓░░░░░░░
Section 13 — Approvals              40% ▓▓▓▓░░░░░░
Section 14 — Notifications          10% ▓░░░░░░░░░
Section 15 — Design & UX            25% ▓▓░░░░░░░░
Section 16 — Performance            30% ▓▓▓░░░░░░░
Section 17 — Security               40% ▓▓▓▓░░░░░░
Section 18 — Offline Support        20% ▓▓░░░░░░░░
Section 19 — App Store Readiness     5% ░░░░░░░░░░
Section 20 — Business Readiness     15% ▓░░░░░░░░░

OVERALL: ~30% complete