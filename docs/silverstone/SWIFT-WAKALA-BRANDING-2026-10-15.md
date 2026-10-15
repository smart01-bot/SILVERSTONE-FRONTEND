# Swift Wakala agent branding

The approved agent brand is **Swift Wakala**, with **by Silverstone** as the ownership line. The approved symbol is two offset, tapered wings; `SwiftWakalaMark` renders the silhouette as two SVG paths without a raster background or new dependency.

- The shared agent header carries the mark and wordmark across Home, Requests, History, Profile and network accounts. Its colour follows the active light/dark theme.
- Home promotional banners and the credit information sheet use the new brand in English and Swahili. Credit remains explicitly coming soon.
- Request entry, review and history details use Swift Wakala fee labels. Source-account guidance refers to the transfer payment without renaming the actual payment recipient.
- This phase covers the regular agent screens only. Startup, splash, loaders, authentication/PIN screens, main-agent branding and launcher icons remain for their separate design stages. The existing Silverstone mark remains available to those screens.
- API URLs, storage keys, package identifiers, account data, transaction payloads and network logos are unchanged.

Validation: all 75 existing tests passed; Android and iOS Expo exports passed. A browser harness using the actual agent components checked the new header at 320/390px widths, light/dark themes, English/Swahili, and the coming-soon credit sheet. Screenshots were visually reviewed. The browser uses demo services; this is not physical-device or launcher-icon verification.
