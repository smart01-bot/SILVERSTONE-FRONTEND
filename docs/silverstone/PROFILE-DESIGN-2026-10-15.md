# Profile typography — 15 October 2026

Implemented the approved Profile image concept: circular initials avatar, 26-point name, 15-point agency and supporting labels, 18-point agent number below its label, 17-point settings labels, and 68-point minimum setting rows. Personal details, appearance and language sheets use the same larger typography. Sections remain simple divider rows with no extra cards.

AgentRow accepts optional label/value styles and icon sizing; only Profile opts into the larger values. Other screens retain their defaults. Real profile fields remain authoritative; an absent agent number still reads Not assigned and has no copy action. Profile data mutations, appearance/language persistence and sign-out confirmation retain their existing handlers.

The private preview now renders the actual Profile and existing Network accounts screens with clearly labelled synthetic data. Name/account edits stay in its demo services; sign-out shows a preview-only locked state instead of affecting a real session. The native app still locks through its existing AuthContext.

Validation: all 75 tests and Android/iOS Expo exports pass. Browser checks cover light/dark themes, English/Swahili, long names, 390×844 and 320×568 layouts, scrolling sign-out clear of navigation, name edit/cancel/save, all appearance choices, language changes, network-account navigation, assigned/missing agent numbers, clipboard copy, and sign-out cancellation/confirmation. No browser exceptions. Native device font scaling and keyboard behavior have not been newly verified.
