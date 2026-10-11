# Registration — minimal liquid glass

Date: 11 October 2026, Africa/Dar_es_Salaam. Branch: `Development`.
Fetched baseline and remote: `50e7d45ae88b23bdd03cb1f4be5c7264ce685d6d`.
The checkout was clean; no applicable AGENTS.md files were found.

## Approved direction

The user approved implementation after reviewing the revised registration mockups. Their explicit preference is **minimal clutter, open layouts, little explanatory text, and restrained liquid glass**. This supersedes the first boxed registration mockups and historical instructions to preserve the wizard's older gradient styling. Preserve the six-step workflow and functional contracts.

Use the settled silver `#C4C7CB` and AMOLED `#000000` surfaces, existing Silverstone vector mark, Inter/Manrope typography and generous spacing. Glass belongs on inputs and the primary action, not around every group. Review uses plain rows, thin dividers and progressive disclosure. Do not add card grids, nested boxes, decorative backgrounds, fake progress or operational navigation to registration.

## Delivered

- Shared `RegistrationUI.jsx`: safe-area/keyboard-aware scroll layout, six-step indicator, language switch, accessible glass fields/buttons, plain rows, disclosure actions and checkboxes. Minimum action target is 48 points; controls grow with text. Footer stays low on short screens and scrolls into view with long content.
- Phone, unavailable-verification, personal, business, location, selfie and final review screens follow the new design in English and Swahili.
- Pending screen covers draft, submitted, corrections, rejection and suspension. It displays recorded reviewer feedback and preserves the draft-resume gate. The legacy Rejected route reuses it.
- Immutable submitted details are accessible from the status page. Details and document names expand only on request.
- Removed obsolete gradient headers, boxed notices, decorative orbit/ring/scan animation code and placeholder support contacts from these screens.

## Material and device behavior

Glass uses existing tokens, translucency and a fine highlight rim. iOS uses the already-installed `expo-blur`; Android uses a lightweight tinted surface without experimental blur. Reduced-transparency preference switches to opaque accessible surfaces. This is a restrained glass treatment, not an implementation of Apple's native Liquid Glass refraction API. No new dependency or native configuration was introduced.

## Functional details

- Route identifiers, order, credential authority, API endpoints and private upload contract retained. Email is read-only when resuming an existing account because editing it here does not update authentication credentials.
- Personal and business validation keeps inputs on errors. Ref guards prevent overlapping saves, uploads and submissions.
- Draft writes retain `expectedVersion`; `syncWizard` shares the new server version through the existing stack.
- Selected files are explicitly unsaved. Uploaded replacement IDs are reused across a subsequent draft-save failure within the screen, avoiding another upload on retry. Existing evidence is retained until its replacement is saved.
- Saved selfie metadata is restored; continuation requires either a saved selfie or a selected replacement. Uploading never claims automatic identity verification.
- Review reads actual application status, version and phone-proof availability. An unverified or stale application cannot submit from this UI. The backend remains authoritative for validation, evidence, assignment and permissions.
- Successful submission followed by failed profile refresh cannot offer a second submission: it offers a status refresh.
- Submitted details read `revisions[0].data`, not a later correction draft. Continuing the editable wizard explicitly clears read-only review mode.
- Suspended/rejected accounts cannot resume draft editing or access operational screens. Existing AppNavigator restrictions are unchanged.
- The old `Step4aMap` drew a mock map and generated coordinates from touch positions. It now accepts a real business address and optional explicitly entered coordinates while preserving the route and `{lat,lng}` contract. No fake GPS, geocoding or new location provider. Existing coordinates are retained and editable.
- Daily capacity is an exact whole-TZS field; resuming a value not on the old slider's fixed stops no longer silently changes it.

## Verification executed

- `npm test`: **48 passed, 0 failed** (39 existing plus 9 registration behavior tests).
- `npm run build`: **passed**; Android JavaScript/Hermes export, 3.94 MB bundle. This is not a native APK/Gradle build.
- `git diff --check`: passed.
- Browser rendering of actual React Native components through React Native Web, isolated mock API/auth/document picker, synthetic data only: **24 captures** (12 screens/states × silver/AMOLED), no page runtime errors.
- **48 compact checks**: 12 screens/states × English/Swahili × silver/AMOLED at 320×568, text enlarged by 30%; no document horizontal overflow.
- Browser interactions: unverified submission disabled; review disclosures; synthetic-proof submission; correction resume retains version; Tanzanian phone formatting; primary action reachable at 320×360.
- Handler tests additionally cover validation, duplicate actions, retained input after failure, exact capacity, upload reuse, selfie requirements, stale versions, submission-success/refresh-failure, immutable revision reads, suspension/rejection restrictions and manual location validation.
- Captures under `implementation/registration/` are **browser component previews**, not Android screenshots. Browser previews use the tinted-glass fallback with reduced transparency off; native blur, TalkBack, native font scaling, real keyboard insets and physical-device behavior remain unverified.

## Scope and continuation

No backend, live database, provider/payment, deployment, PIN/session logic or post-login screen changes. Real SMS verification remains unavailable, so this UI pass does not complete live onboarding. Swahili copy still needs human acceptance.

Publication was explicitly authorized by the user on 11 October 2026: send the registration work to frontend `Development` on GitHub. The implementation was first committed locally as `bd04cbe`; publication through the connected GitHub account may produce a different commit ID with the same source tree. The final delivery receipt records the verified remote commit. `Main-Implementation` is not a publication target.

Next: use the existing development client/Metro workflow to review on the user's Android device. No new native package was added, so ordinary JS/UI updates do not themselves require another APK.
