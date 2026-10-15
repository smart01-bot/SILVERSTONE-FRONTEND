# Swift Wakala welcome and role selection

Approved preview: https://silverstone-motion-preview.whole-field-8456.chatgpt.site/welcome.html

The old role cards are replaced by the approved combined welcome screen: Swift Wakala branding, large headline, floating wing mark, sliding two-option selector, contextual Continue button, and registration link. The native screen uses the established theme reveal and typography, localized English/Swahili copy, safe-area padding and vertical scrolling for small screens or larger text. The wing stops for reduced motion, backgrounding, hidden routes and unmount. Theme storage failure is surfaced by the shared reveal control.

Signed-out startup now runs the existing splash and opens RoleSelect. Retained accounts continue through existing PIN and account-status checks. The obsolete auth-stack Splash route is removed because the app root owns the startup splash.

Agent is selected initially. Selecting a role does not navigate until Continue is pressed. Login receives selectedRole for its heading and has a back button; account access still comes from the authenticated server profile. The public registration flow remains Agent-only. Choosing registration while Main Agent is selected explains that Silverstone sets up these accounts and offers sign-in; it does not create or grant a Main Agent role.

Validation:
- 81 Node tests passed, including startup readiness, retained-account PIN, PIN-read failure, pending accounts and logout returning to role selection without replaying the splash.
- Android and iOS production Expo exports completed.
- Actual native screen rendered through the local RN Web harness: light/dark, role state, no navigation on selection alone, matching login context, back, Agent registration, Main Agent provisioning notice, Swahili, 320px scrolling, reduced motion and no runtime exceptions.
- Physical-device animation, safe-area appearance and theme bitmap reveal still need device inspection. No new native dependency; no APK/IPA generated in this task.
