# PrivAI Pocket — Mobile UX Redesign Specification

**Date:** 25 August 2026  
**Status:** awaiting user review before implementation

## Goal

Turn the current stacked web-form experience into a guided mobile workflow where every screen has one purpose, every completed action produces an immediately visible result, and the four-tool home remains simple.

## Product principles

- Privacy remains the core promise.
- The home keeps four tools: Convert, Protect, Prepare for AI, and History.
- Restore is a mode inside Protect, not a fifth home tool.
- Voice is a cross-tool input method, not a fifth tool.
- Each screen presents one decision and one primary action.
- A generated result replaces the input phase instead of appearing below it.
- No fixed example section is shown when a concise description explains the benefit.
- Unavailable features are labelled `Coming soon`, `In arrivo`, or `Beta`; they never look enabled or purchasable.

## Global visual system

### Palette

- Warm white `#FFF8F1`: primary background.
- Black `#111114`: text, privacy surfaces, and result cards.
- Orange `#FF6B00`: primary actions and brand accent.
- Gray `#68635F`: secondary copy.
- Green `#20A464`: verified success and local-processing status only.

Target balance: approximately 70% warm white, 20% black, and 10% orange. Orange must not be used for every large surface.

### Typography and responsive behavior

- Headings use fluid sizing and natural wrapping; no manual line breaks are relied upon for layout.
- The greeting and header controls must work at 360, 390, 430, and 680 CSS pixels.
- Essential labels and the Instagram handle must never be clipped.
- Body text maintains readable line length and WCAG-oriented contrast.

### Motion

- State transitions use short 200–300 ms animations.
- Result screens enter with a small upward movement and fade.
- Copy and success actions provide visible confirmation.
- `prefers-reduced-motion` disables non-essential movement.

## Home

### Header

- Keep the time/session-based greeting.
- Correct wrapping so the second line aligns beneath the greeting text rather than beneath the emoji.
- Keep token balance, token information, and settings at the upper right.
- Tokens remain a beta concept and must be labelled honestly until rewards are defined.

### Hero

- No decorative image.
- Compact height so at least the heading and top portion of the tool grid are visible on common phones.
- Content: local-processing badge, one promise, one supporting sentence, and one CTA.
- CTA remains visually enabled: white on orange rather than disabled-looking gray.

### Tool grid

- Preserve four cards.
- Use consistent 3D icon scale, frontal or only slightly angled pose, lighting, shadow, and whitespace.
- Align titles and benefits to a shared baseline.
- Use direct descriptions; no separate example blocks.

### Bottom action bar

- Fixed glass surface with adequate contrast.
- Left: clickable Instagram logo and full `@notizieartificiali.ai` handle.
- Center: orange `+` button for paste/file input.
- Right: microphone icon without a `Parla` label.
- The three regions must remain usable without truncation at 360 px.
- The microphone is initially a clearly labelled future/beta control until native local speech capability checks exist.

## Shared tool workflow

Each tool is implemented as a small state machine rather than one vertically stacked page:

1. **Input** — title, concise benefit, content entry, one primary action.
2. **Review** — only when user review is required.
3. **Result** — output and immediate actions.

The browser back action and in-app back button return to the previous phase without losing content. Completing a phase places the next phase at the top of the viewport and moves focus to its heading.

## Convert

### Input

- Title: `Converti in Markdown`.
- Benefit: order content into a clear format ready for any AI.
- Accept paste, text/Markdown file, and textual PDF.
- One CTA: `Converti`.

### Result

- Result replaces input.
- Black output card with visible `Copia` and `Condividi` actions.
- Primary continuation: `Proteggi i dati`.
- Secondary action: `Modifica originale`.

## Protect and Restore

Protect contains two modes in a compact segmented control: `Proteggi` and `Ripristina`. Protect is selected by default.

### Protect input

- Benefit: find and replace reserved data before sharing.
- Accept paste, voice when available, text/Markdown file, and textual PDF.
- One CTA: `Controlla i dati`.

### Review

- Show a summary by category and a selectable findings list.
- Explain detector limits without claiming complete anonymization.
- One CTA: `Crea versione protetta`.

### Protected result

- Show count and types replaced.
- Black output card.
- Fixed result actions: `Copia`, `Condividi`, `Invia all’IA`.
- Secondary actions: `Modifica` and `Cancella corrispondenze`.

### Restore

- Available from the Protect mode switch, the active job, and History.
- If pasted/shared content contains placeholders associated with an active job, select Restore automatically.
- Input accepts the response from ChatGPT, Claude, or another AI.
- Result shows restored content with `Copia` and `Condividi`.
- Mapping must never be described as securely persistent until Keystore/Keychain storage is implemented.

## Prepare for AI

### Input

- Keep the content and goal visible.
- Move constraints, output language, and templates into a collapsed `Personalizza` section.
- One CTA: `Prepara per l’IA`.

### Result

- Replace form with a black result card.
- Show `Copia`, `Condividi`, and `Invia all’IA`.
- Secondary action: `Modifica richiesta`.

## History

- Separate active jobs awaiting Restore from completed recent items.
- Active jobs expose `Ripristina risposta` as the primary action.
- Completed items expose open, share, and delete.
- Empty state explains the benefit in one sentence without a separate example.

## Voice interaction

- The microphone control is always visible in the bottom bar.
- Tap starts listening only after permission and privacy disclosure.
- On-device speech recognition is used only after a runtime capability check.
- If local recognition is unavailable, the app explains this before offering any network-backed alternative.
- Audio is not retained by default.
- Voice routes into the selected tool; it does not create another home section.
- The PWA may show the visual control as `Coming soon` until the native implementation meets these requirements.

## Feedback and errors

- Empty input: plain-language prompt near the input.
- Processing: explicit local-processing state.
- Success: visible result state, focus movement, and optional haptic feedback in the native app.
- Copy/share failure: preserve the result and offer the other action.
- Unsupported/scanned PDF: explain that local OCR is not available yet.
- No findings: explain that the base check found nothing and that manual review is still required.

## Accessibility and quality gates

- Interactive targets are at least 44×44 CSS pixels.
- Icon-only buttons have accessible labels.
- Focus states are visible.
- Information never relies on color alone.
- Text reflows under browser zoom and system text scaling.
- Test light theme explicitly on Chrome, Samsung Internet, installed PWA, and the native shell.
- Verify the layout at 360, 390, 430, and 680 px widths.

## Free, Pro, and future labels

- Core privacy actions remain available without token unlocks.
- Tokens are marked Beta until concrete rewards exist.
- Pro and Coming Soon features are visually separated from working tools.
- No payment CTA may imply that an unfinished feature is immediately available.

## Out of scope for this redesign

- Real speech recognition implementation.
- Native Share Target.
- Keystore/Keychain vault.
- Photo metadata removal and link cleaning.
- Payments, login, Drive sync, desktop bridge, and cloud relay.

This redesign may add disabled, honest entry points for future features but must not simulate their operation.

## Acceptance criteria

1. A result never appears only below the current viewport.
2. Input, review, and result are not displayed as one stacked form.
3. Protect and Restore are discoverable within the same tool.
4. The full Instagram handle is readable at 360 px.
5. The header does not collide or wrap incorrectly at supported widths.
6. The home retains four tool cards and becomes visually lighter than the current dark variant.
7. Copy and Share are immediately available on every generated result.
8. All existing domain tests continue to pass.
9. New UI tests cover state transitions, responsive labels, honest future states, and result visibility.
10. The service worker cache version is updated so existing installations receive the redesign.
