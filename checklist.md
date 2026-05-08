SILVERSTONE — COMPLETION CHECKLIST
Tanzania's First Float Management System

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — AUTH & ONBOARDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Splash screen shows real logo + animates cleanly
□ Splash auto-routes based on auth state
□ Login screen — email + password works
□ Login screen — error messages show inline
□ Login screen — password show/hide toggle
□ Login screen — "Forgot password?" sends reset email
□ Register screen — 3 steps complete with validation
□ Register screen — phone number formatted correctly
□ Register screen — TIN validation (XXX-XXX-XXX)
□ Register screen — NIDA validation (20 digits)
□ Register screen — password strength indicator
□ Register screen — terms of service checkbox
□ Pending screen — 4-step KYC tracker shows
□ Pending screen — auto-advances when admin approves
□ Pending screen — sign out works
□ Rejected screen — shows reason + contact info
□ PIN setup — only shows for approved users with no PIN
□ PIN setup — 4-digit square boxes
□ PIN setup — confirm step works
□ PIN setup — mismatch shows shake + error
□ PIN setup — saves to SecureStore + Firestore
□ PIN entry — only shows for users with existing PIN
□ PIN entry — wrong PIN shows error + attempt count
□ PIN entry — 3 wrong attempts → 30 min lockout
□ PIN entry — lockout shows countdown timer
□ PIN entry — biometric option (fingerprint/face)
□ PIN entry — "Forgot PIN?" resets via password verify
□ PIN entry — "Switch account" logs out cleanly
□ Session timeout — 5 min background → PIN overlay
□ Session timeout — overlay dismisses on correct PIN
□ Logout — clears SecureStore + Firebase session
□ Logout — routes back to login screen cleanly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — SUB-AGENT HOME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Greeting shows agent name + time of day
□ Notification bell with unread badge
□ Hero card shows total volume moved
□ Hero card — amount hide/show toggle works
□ Hero card — today vs yesterday delta shown
□ Hero card — completed count tile
□ Hero card — pending count tile
□ Quick actions grid — all 4 buttons work
□ Quick actions — pending badge on New Request
□ 7-day volume chart loads real Firestore data
□ 7-day chart — tap bar shows day details
□ Network breakdown loads real data
□ Network breakdown — colored bars per network
□ Recent requests list shows last 4
□ Recent requests — tap opens detail modal
□ "See all" link goes to history screen
□ Pull to refresh works
□ Empty state shows when no requests
□ Dark mode looks correct on all elements
□ Screen does not overflow into bottom controls

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — NEW REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Source network picker — all 4 networks show
□ Destination network picker — all 4 networks show
□ Cannot select same network for source + destination
□ Source phone — pre-filled from agent profile
□ Destination phone — validates Tanzania format
□ Amount input — formats with commas as you type
□ Amount — TZS prefix shown
□ Amount — quick add buttons (+10k +50k +100k +500k)
□ Urgent toggle — works + shows explanation
□ Summary card shows before submission
□ Hold to confirm button — 1.5 second hold
□ Submission creates Firestore document
□ Success screen shows request ID + queue position
□ Success screen — "Copy ID" works
□ Success screen — "New Request" button works
□ Success screen — "Go Home" button works
□ Main agent gets notification on new request
□ Haptic feedback on all interactions
□ Validation errors show inline (not alerts)
□ Screen scrolls properly, no overflow

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — REQUEST HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ All requests load from Firestore real-time
□ Filter pills — All/Pending/Approved/Completed/Rejected
□ Urgent requests show at top
□ Each card shows route, amount, status, time ago
□ Left border color matches source network
□ Tap card → request detail modal opens
□ Long press card → copies request ID
□ Pull to refresh works
□ Empty state per filter tab
□ Completed requests show "Share Receipt" button
□ Share receipt → copies WhatsApp-ready text
□ Toast shows "Copied — paste in WhatsApp"
□ Rejected requests show "Retry" button
□ Retry → pre-fills new request form
□ Relative timestamps (2 min ago, yesterday etc)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — REQUEST DETAIL MODAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Opens as bottom sheet (slides up)
□ Drag handle at top
□ Request ID shown (tap to copy)
□ Status badge prominent
□ Network route with colored dots
□ Amount in large monospace text
□ Source phone shown
□ Destination phone shown
□ Submitted time (relative + exact on tap)
□ Processed by name (if completed)
□ Sub-agent actions based on status
□ Cancel button (if pending)
□ Retry button (if rejected)
□ Share receipt button (if completed)
□ Swipe down to close works
□ Dark overlay behind modal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — SUB-AGENT PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Avatar shows initials
□ Name, phone, business name displayed
□ Active networks shown as colored chips
□ Edit name works — saves to Firestore
□ Edit phone works — saves to Firestore
□ Edit business location works
□ My Networks menu item → networks screen
□ Language setting — EN/SW toggle works
□ Theme setting — Auto/Light/Dark options
□ Security menu → PIN change works
□ Security menu → biometric toggle works
□ Help & Support — contact info shown
□ Terms of Service — opens document
□ App version shown at bottom
□ Sign out works cleanly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — MY NETWORKS SCREEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ All 4 networks shown (Voda, Yas, Airtel, Halotel)
□ Each network has color dot + name + wallet name
□ Phone number input per network
□ Active toggle per network
□ Pre-filled from Firestore on load
□ Phone validation before save
□ Save button updates Firestore
□ Success toast after save
□ New request form pre-fills from saved numbers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — MAIN AGENT OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Total requests today stat card
□ Pending requests stat card (with urgent count)
□ Completed today stat card
□ Active agents stat card
□ 30-day volume chart loads real data
□ Chart shows requests vs transactions lines
□ Network breakdown chart loads real data
□ All stats update in real-time (onSnapshot)
□ Pull to refresh works
□ Dark mode correct on all elements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — MAIN AGENT QUEUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Queue loads all pending requests real-time
□ Urgent requests always at top
□ Request count shown in header
□ Filter pills work (All/Urgent/Pending/Approved)
□ Each card shows agent, route, amount, wait time
□ URGENT tag prominent (amber)
□ Left border color = source network
□ Tap card → action modal opens
□ Swipe left → quick reject
□ Swipe right → quick approve
□ Screen stays awake while processing (keep awake)
□ Empty state — "All caught up 🎉"
□ Pull to refresh works
□ Pending badge on Queue tab

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — REQUEST ACTION MODAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Agent name + avatar shown
□ Full request details shown
□ Approve button works → notifies sub-agent
□ Process Transfer button works → marks complete
□ Process Transfer → hold to confirm (no accidents)
□ Reject button → asks for reason
□ Rejection reasons: Insufficient float /
  Invalid phone / Duplicate / Other
□ Rejection reason sent to sub-agent
□ Sub-agent gets push notification on all actions
□ Haptic feedback on all actions
□ Success animation after processing
□ Modal closes after action

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — TRANSFERS SCREEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ All completed transactions load real-time
□ Filter by date range works
□ Filter by network works
□ Filter by agent works
□ Search by amount works
□ Search by agent name works
□ Each row shows ID/Agent/Route/Amount/Time
□ Tap row → full transaction detail
□ Total volume shown at top
□ Pull to refresh works

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12 — AGENTS SCREEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ All approved agents listed
□ Each card shows avatar, name, phone, location
□ Networks shown as colored chips
□ Request count this month shown
□ Total volume this month shown
□ Tap agent → agent detail screen
□ Agent detail shows full profile
□ Agent detail shows request history
□ Suspend agent option works
□ Edit agent networks works
□ Search agents by name works

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 13 — APPROVALS SCREEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Pending applications listed
□ Badge count on Approvals tab
□ Each card shows full KYC details
□ Name, phone, business, location shown
□ Registration number shown
□ TIN and NIDA shown
□ "Applied X days ago" shown
□ Approve button → immediate, notifies agent
□ Reject button → confirm dialog + reason
□ Filter: Pending/Approved/Rejected
□ Empty state per filter

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 14 — NOTIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Push notification permission requested on launch
□ Push token saved to Firestore agent doc
□ Sub-agent notified: request approved
□ Sub-agent notified: request rejected + reason
□ Sub-agent notified: transfer completed + amount
□ Sub-agent notified: account approved
□ Main agent notified: new request submitted
□ Main agent notified: urgent request (different sound)
□ Main agent notified: new agent application
□ Tap notification → opens correct screen
□ In-app notification bell shows unread count
□ Notification list screen shows history
□ Notifications clear when screen opened

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 15 — DESIGN & UX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Every button has press animation (scale 0.97)
□ Every button has haptic feedback
□ No content behind bottom device controls
□ No content behind top status bar
□ Keyboard never covers inputs
□ All lists have pull to refresh
□ All lists have empty states
□ All loading states use skeletons not spinners
□ All errors show inline not as alerts
□ All amounts formatted: TZS 50,000
□ All timestamps relative (2 min ago)
□ All dates: 07 May 2026 format
□ Dark mode — zero hardcoded colors
□ Dark mode — consistent on every screen
□ Light mode — consistent on every screen
□ Device theme followed automatically
□ Language toggle in settings only
□ EN translations complete
□ SW translations complete
□ All error messages in both languages
□ Toast notifications for all actions
□ Swipe gestures on lists

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 16 — PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ App launches in under 2 seconds
□ Login to dashboard under 1.5 seconds
□ All animations run at 60fps
□ No lag on list scrolling
□ No lag on tab switching
□ Firestore real-time under 500ms
□ Works on 3G network
□ Works on Samsung Galaxy A series
□ Works on 2GB RAM devices
□ No memory leaks (unsubscribe all listeners)
□ Images optimized and cached
□ No unnecessary re-renders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 17 — SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ PIN stored in SecureStore (encrypted)
□ Firebase keys in app.json (not exposed)
□ Firestore rules — role based access
□ Firestore rules — auth required everywhere
□ Session timeout after 5 min background
□ PIN lockout after 3 wrong attempts
□ Lockout lasts 30 minutes
□ Logout clears all local data
□ No sensitive data in AsyncStorage
□ No console.log with sensitive data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 18 — OFFLINE SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Offline banner shows when no connection
□ Requests queued locally when offline
□ Queue syncs automatically when back online
□ "X requests synced" toast after sync
□ Past requests visible offline (cached)
□ Dashboard stats visible offline (cached)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 19 — APP STORE READINESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ App icon — Silverstone S logo (all sizes)
□ Splash screen — red background + logo
□ App name — "Silverstone"
□ Bundle ID — com.silverstone.floatmanager
□ Version — 1.0.0
□ Build number — correct
□ Android permissions declared in app.json
□ Privacy policy URL
□ Terms of service URL
□ Support email
□ Screenshots for store listing
□ App description in EN and SW
□ Keywords for store search
□ Content rating completed
□ No console errors in production build
□ No warnings in production build
□ Tested on physical Android device
□ Tested on multiple screen sizes
□ EAS production build created
□ APK tested before store submission

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 20 — BUSINESS READINESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Main agent account created + configured
□ First sub-agent onboarded + tested
□ Full request cycle tested end to end
  (submit → approve → process → complete)
□ Notifications tested end to end
□ WhatsApp share tested
□ PIN flow tested (setup + entry + forgot)
□ Dark mode tested end to end
□ Swahili translation tested end to end
□ Offline mode tested
□ Firestore rules tested (wrong role blocked)
□ DEVLOG.md complete and up to date
□ README.md with setup instructions
□ Firebase project on paid plan (Blaze)
  for production notifications
□ Backup/export strategy for Firestore data
□ Admin knows how to approve agents
□ Admin knows how to promote main agents
□ Support contact set up for agents

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOTAL: ~200 items
Current estimate: ~35% complete

Priority order:
1. Auth flow (Sections 1) — almost done
2. Core loop (Sections 3,9,10) — partially done  
3. Design/UX (Section 15) — partially done
4. Notifications (Section 14) — not done
5. Everything else in order

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━