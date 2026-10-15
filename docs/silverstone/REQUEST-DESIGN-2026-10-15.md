# Requests design — 15 October 2026

Implemented the user-requested compact layout after the earlier image concept. The screen now has one connected glass route panel, supplied network logos, a prominent amount input, expandable urgency, and a review button anchored above navigation. The page heading is New request / Ombi jipya; the Requests navigation label is retained.

Account rows open a single editing sheet containing the four networks, explicit Wallet/Agent/Till types, and an identifier input. Edits remain local to the sheet until Use this account validates and commits them. Closing discards those edits. Changing the network or identifier type clears the editor's number to avoid reusing an identifier under a different interpretation. No network or account is preselected for new requests. Existing explicit history prefills remain supported.

The receipt presents the exact normalized identifiers, account types, amount and Silverstone fee. Editing an account invalidates the old receipt; the user must review the revised request before confirming. The existing queue, ownership checks and submission flow are retained. Requests still require main-agent review and do not move funds at submission. Bank integration remains deferred.

Glass styling follows the navigation's shared theme tokens, iOS blur and reduced-transparency fallback. The fee and action footer is outside the scrolling form and inside its keyboard-avoiding view. Small screens scroll the form and editing sheet independently; no fixed content height is imposed.

Validation: 75 tests pass, including four new request-handler tests for cancelled edits, stale identifiers, invalid/same-network accounts, receipt invalidation, exact large amounts, explicit account types, failed saves and double-confirmation protection. Android and iOS Expo exports pass. Browser checks cover the actual components at 390×844 and 320×568, English/Swahili, light/dark themes, account sheets, amount/review edits, and draft preservation across tabs and theme changes, without browser exceptions. Native keyboard/device behavior still needs a physical-device check.

The private preview uses labelled synthetic data and native/backend substitutes. Its confirm button only exercises a demo queue; no payment or real request is submitted. The implemented screen and its assets are included in the Development branch.

Refinement: removed the +10k/+50k/+100k shortcut row at the user’s request. Amounts are entered directly; the exact-amount review test now covers typed input without quick additions.
