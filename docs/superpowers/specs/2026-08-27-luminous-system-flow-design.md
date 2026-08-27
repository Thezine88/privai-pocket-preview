# PrivAI Pocket — Luminous System Flow

**Date:** 27 August 2026  
**Status:** approved visual direction; implementation specification awaiting final review  
**Reference prototype:** `privai-system-flow-final.html` in the active visual-companion session

## Objective

Replace the current app presentation with a system-utility experience built around the habit Android users already know: share content to PrivAI, protect it locally, choose the desired outcome, send it elsewhere, and restore sensitive data on return.

Success means a non-technical user can complete the normal path without understanding AI terminology and without facing more than one primary decision per screen.

## Product flow

1. **Today:** explain `Share → PrivAI`, offer paste/file as secondary intake, and surface any job ready to restore.
2. **Review:** show the received file/text, high-confidence findings already selected, a short real excerpt, and one `Protect N data` action.
3. **Protection:** visibly separate outgoing content from locally retained mappings. This state is informative and advances automatically after native processing completes.
4. **Outcome:** offer plain-language recipes (`Summarize`, `Improve`, `Translate`, `Prepare reply`) plus `Share without AI`.
5. **External handoff:** use the existing outbound-share integration; PrivAI never sends content directly to a server.
6. **Restore:** when PrivAI recognizes its placeholders on return, show one before/after example and offer `Restore N data` while preserving the untouched external response.

## Information architecture

The bottom navigation contains exactly three destinations:

- **Today:** intake, current status, and the next useful action.
- **Jobs:** active and completed transformations.
- **Vault:** locally stored reversible mappings and saved words.

Settings stays in the top-right action. Plan and privacy information remain inside Settings instead of competing with the daily workflow.

## Visual system

- **Primary dark:** near-black `#0B0B0D`.
- **Warm light:** `#F2ECE4` / `#F7F3EE`.
- **Action orange:** `#FF6A2D`; reserved for the next action and transformation energy.
- **Verified mint:** `#65D3A6`; reserved for local, safe, complete, and recoverable states.
- **Typography:** current bundled font/system fallback; headings use compact editorial wrapping, body copy remains conventional and highly readable.
- **Surfaces:** solid high-contrast cards by default; blur is limited to the bottom dock and restore sheet where it communicates layering.
- **Icons:** reuse the existing Lucide subset; no emoji icons and no second icon library.

The 21st.dev patterns are adapted—not imported—as spotlight action, restrained glow, liquid sweep, shimmer progress, and glass restore sheet. The project remains dependency-free at runtime beyond its existing Capacitor packages.

## Motion language

- Navigation transitions: 220–300 ms with opacity plus short horizontal movement.
- Press feedback: visible within 100 ms using native button state/scale.
- Protection sequence: a scan band crosses the document; sensitive fragments move toward the Vault; progress follows real processing where available.
- Completion: a single spring-like check entrance under 600 ms.
- Restore: bottom sheet rises once; placeholder-to-original comparison changes in place.
- No infinite loaders, decorative looping, or fake processing delays.
- `prefers-reduced-motion` removes spatial motion and automatic decorative sequences while preserving status changes.

## Existing architecture and reuse

- Keep the ES-module domain layer in `src/domain/` unchanged unless a UI contract exposes a real defect.
- Keep `ShareTargetPlugin`, `OutboundSharePlugin`, and `SecureStorePlugin` as the native boundaries.
- Rework semantic markup in `index.html`, presentation in `styles.css`, and orchestration in `src/app.mjs`.
- Keep `src/` as source of truth; regenerate `www/` through `npm run build:web`.
- Reuse the current local font, Lucide icon module, PII engine, vault, recipes, share, intake, and restore behavior.
- Do not add React, Tailwind, Framer Motion, Lottie, network fonts, analytics, or remote assets.

## Security and privacy

- UI and animation never copy content into telemetry, remote storage, CSS attributes, URLs, or logs.
- The mapping remains protected by the existing Android Keystore/AES-GCM boundary.
- Original input and external response remain available until the user explicitly deletes them.
- Claims stay factual: `processed on this device`, `reversible copy`, and category counts; never `100% anonymous`.
- Clipboard checks continue to look only for PrivAI-owned placeholders before proposing restore.

## Accessibility

- Minimum target: 48 dp on Android and at least 44 CSS px in the WebView.
- One visible primary action per state.
- State is communicated with text and icons, never color alone.
- Support system text scaling without clipped actions or titles.
- Preserve semantic buttons, labels, focus order, screen-reader announcements, safe areas, and Android back behavior.
- Explicitly validate 360, 390, 430, and 680 CSS-pixel widths and reduced motion.

## Error and edge states

- Empty intake identifies the missing action and keeps the input.
- Unsupported/scanned PDF explains that OCR is not yet available.
- No findings leads to review, not a false safety claim.
- Share failure preserves the protected copy and offers copy/retry.
- Restore mismatch identifies missing placeholders, restores only verified matches, and preserves both versions.
- Keystore/storage failure blocks reversible protection and gives a recovery path; it never silently stores mappings insecurely.

## Asset policy

The first APK uses existing licensed assets and code-native icons. New illustrative assets are not required for the core workflow. After visual approval on-device, any approved original images or exported icons will be placed in a documented reusable asset directory with source, license, purpose, and export sizes.

## Verification and APK

Before delivery:

1. Run the complete Node test suite.
2. Add focused tests for new UI hooks, recipe labels, restore comparison, reduced-motion rules, and absence of remote resources.
3. Build and sync `www/` into Android.
4. Run Gradle `assembleDebug`.
5. Inspect the generated APK path and checksum.
6. Report that native share, Keystore, and return behavior still require a real-device smoke test if no device is connected.

## Acceptance criteria

1. Home teaches `Share → PrivAI` and shows a pending restore action above secondary content.
2. The normal path has one primary CTA per screen and no AI jargon requirement.
3. High-confidence findings are preselected and visibly reviewable.
4. Protection motion communicates separation into the local Vault and respects reduced motion.
5. Outcome recipes use plain-language results and include sharing without AI.
6. Restore shows one concrete placeholder/original comparison and preserves both versions.
7. Existing privacy, PII, vault, share, PDF, PWA, and native plugin tests remain green.
8. No new runtime dependency or network service is introduced.
9. A debug APK is generated and its exact path is reported.
