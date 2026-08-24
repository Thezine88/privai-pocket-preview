# Private AI Pocket — Product Specification

## Product promise

Turn content received on a phone into clean, privacy-reviewed Markdown that can be sent to any AI provider.

## MVP

- Installable mobile-first web app for Android testing, structured for later native packaging.
- Home with large touch targets and an original warm-white, orange, and black identity.
- Import text or a local text/Markdown file.
- Convert pasted text into normalized Markdown.
- Detect common sensitive data locally and let the user mask it before sharing.
- Prepare reusable Markdown instruction packs.
- Store recent documents locally on the device.
- Optional BYOK settings for Groq, OpenAI, Anthropic, and Gemini; no key is shipped with the app.
- Clickable bottom-left attribution to https://www.instagram.com/notizieartificiali.ai/.

## Privacy constraints

- The default workflow must not send document content to a server.
- API mode is explicitly opt-in and must show the chosen provider before transmission.
- API keys are never embedded in source control or the distributable.
- The prototype stores settings in browser-local storage; production native builds must migrate keys to Android Keystore and iOS Keychain.
- The interface must use “protezione” or “mascheramento”, never claim guaranteed anonymization.

## Rizzo-PII-derived design principles

- Use the public Rizzo-PII taxonomy as the reference vocabulary while shipping a smaller deterministic mobile subset first.
- Keep detection separate from masking policy: a finding remains visible even when the user excludes its tag from replacement.
- Validate structured Italian identifiers with checksums where feasible.
- Use stable typed placeholders and make the reversible mapping optional.
- Do not bundle PyMuPDF or Rizzo-PII desktop binaries; preserve upstream attribution for any MIT-licensed detector logic incorporated later.

## Free and Pro model

- Free: single conversions, basic detectors, standard templates, limited local history, points.
- Pro: batches, custom detectors and templates, unlimited projects, encrypted Drive sync, multiple providers.
- The prototype labels plan boundaries but does not process payments.

## Visual system

- Warm white `#FFF8F1`, orange `#FF6B00`, black `#111114`, muted gray `#68635F`, privacy green `#20A464`.
- Oversized headings, 24–32 px rounded cards, soft shadows, large touch targets.
- Similar ease and visual rhythm to the supplied references, without duplicating their composition or graphics.

## Acceptance criteria

1. The app installs as a PWA on supported Android browsers.
2. Pasted content can be normalized to Markdown without a network call.
3. Email, phone, IBAN, fiscal-code-like values, URLs, and dates are detected deterministically.
4. The user can select findings and replace them with stable placeholders.
5. Prepared Markdown can be copied or shared through the system share sheet when supported.
6. Local history can be opened and deleted.
7. Provider keys can be saved, viewed only in masked form, and removed.
8. The Instagram attribution opens the corrected account.
