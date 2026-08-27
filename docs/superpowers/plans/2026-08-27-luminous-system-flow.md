# PrivAI Pocket Luminous System Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Luminous System Flow in the existing PrivAI Pocket PWA/Capacitor app and produce a tested Android debug APK.

**Architecture:** Preserve all domain and native-security boundaries. Restructure only the semantic application shell, map the existing state machine to clearer screen states, and implement visual hierarchy and motion in native CSS. `src/` remains authoritative and `www/` is regenerated before Capacitor sync.

**Tech Stack:** Semantic HTML, CSS, JavaScript ES modules, Node built-in test runner, existing Capacitor 8 Android shell, existing local Lucide subset.

**Spec:** `docs/superpowers/specs/2026-08-27-luminous-system-flow-design.md`

## Global Constraints

- Keep all processing local and preserve Android Keystore/AES-GCM storage.
- Add no React, Tailwind, Framer Motion, Lottie, network font, analytics, remote asset, or runtime dependency.
- Keep one visible primary action per state and plain-language recipes.
- Use orange `#FF6A2D` only for the next action/transformation and mint `#65D3A6` only for verified local/safe states.
- Preserve semantic controls, 44 CSS-pixel minimum targets, safe areas, text scaling, Android back behavior, and reduced motion.
- Build source into `www/`; never hand-edit generated `www/` files.

---

### Task 1: Lock the new semantic UI contract

**Files:**
- Modify: `tests/ui.test.mjs`
- Modify: `tests/i18n.test.mjs`

**Interfaces:**
- Consumes: current `index.html`, `styles.css`, `src/app.mjs`, locale dictionaries.
- Produces: structural requirements for `data-system-stage`, `#home-primary-action`, `#protection-motion`, `#recipe-outcomes`, `#restore-comparison`, three navigation destinations, and reduced-motion CSS.

- [ ] **Step 1: Add failing structural assertions**

Add assertions that require:

```js
assert.match(html, /data-system-stage="today"/);
assert.match(html, /id="home-primary-action"/);
assert.match(html, /id="protection-motion"/);
assert.match(html, /id="recipe-outcomes"/);
assert.match(html, /id="restore-comparison"/);
assert.match(html, /data-goto="vault"/);
assert.doesNotMatch(html, /class="nav-item" data-goto="settings"/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /\.protection-scan/);
assert.match(appSource, /function showSystemStage/);
```

Require Italian and English keys for the home share habit, plain-language outcomes, protection status, and restore comparison.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `node --test tests/ui.test.mjs tests/i18n.test.mjs`  
Expected: FAIL because the new hooks and copy do not yet exist.

- [ ] **Step 3: Commit the red test contract**

```bash
git add tests/ui.test.mjs tests/i18n.test.mjs
git commit -m "test: define luminous system flow contract"
```

### Task 2: Build the Today, Review, and Outcome markup

**Files:**
- Modify: `index.html`
- Modify: `src/locales/it.mjs`
- Modify: `src/locales/en.mjs`

**Interfaces:**
- Consumes: existing IDs used by `src/app.mjs` for intake, findings, recipes, sharing, restore, and vault rendering.
- Produces: semantic stage containers without deleting existing behavior hooks.

- [ ] **Step 1: Replace the home hierarchy while retaining intake hooks**

Create `data-system-stage="today"`, keep `#home-jobs`, `#home-recent`, file input and text entry hooks, and add `#home-primary-action`. Copy explicitly teaches `Condividi → PrivAI`; pending restore appears before secondary content.

- [ ] **Step 2: Restructure work phases**

Keep the existing phase IDs and actions but present review as file summary, selected finding count, category pills, excerpt, and `#protection-motion`. Place plain-language recipe buttons inside `#recipe-outcomes`, including the existing non-AI outbound share path.

- [ ] **Step 3: Restructure restore**

Keep `#reply`, `#restored`, `#restore-result`, and `#restore-missing`; add `#restore-comparison` with accessible `Prima` and `Dopo` labels populated by the controller.

- [ ] **Step 4: Simplify navigation**

Use exactly Today, Jobs, and Vault in the dock. Keep Settings accessible from the top-right control and preserve settings/plans views.

- [ ] **Step 5: Add locale strings and run tests**

Run: `node --test tests/ui.test.mjs tests/i18n.test.mjs tests/pwa.test.mjs`  
Expected: structural assertions pass except controller/style contracts reserved for later tasks.

- [ ] **Step 6: Commit markup and copy**

```bash
git add index.html src/locales/it.mjs src/locales/en.mjs
git commit -m "feat: add luminous system flow markup"
```

### Task 3: Implement the Luminous visual system and motion

**Files:**
- Modify: `styles.css`
- Test: `tests/ui.test.mjs`

**Interfaces:**
- Consumes: Task 2 stage and component classes.
- Produces: responsive system-utility layout and CSS animations with no JavaScript animation dependency.

- [ ] **Step 1: Add design tokens and component styling**

Define near-black, warm light, orange, mint, surface, type, spacing, radius, and elevation tokens. Style spotlight intake, evidence surface, recipe grid, floating dock, and restore glass sheet without nesting decorative cards.

- [ ] **Step 2: Add functional motion**

Implement `view-enter` (220–300 ms), pressed feedback (under 100 ms), `.protection-scan`, `.protection-particle`, completion pop, liquid button sweep, and restore-sheet rise. No animation is infinite.

- [ ] **Step 3: Add accessibility and responsive rules**

Under `prefers-reduced-motion: reduce`, disable spatial/automatic animation while keeping states visible. Validate wrapping and target sizes at 360, 390, 430, and 680 CSS pixels.

- [ ] **Step 4: Run UI tests**

Run: `node --test tests/ui.test.mjs`  
Expected: PASS, including no remote resource and no stray `!important` constraints.

- [ ] **Step 5: Commit styling**

```bash
git add styles.css tests/ui.test.mjs
git commit -m "feat: add luminous visual system and motion"
```

### Task 4: Connect existing application state to the new stages

**Files:**
- Modify: `src/app.mjs`
- Modify: `tests/ui.test.mjs`

**Interfaces:**
- Consumes: existing `goto`, `setWorkPhase`, detection, mask, recipe, outbound share, vault, and restore functions.
- Produces: `showSystemStage(stage, direction = 'fwd')`, protection-motion state, recipe outcome selection, and restore comparison rendering.

- [ ] **Step 1: Add the failing controller contract**

Require `showSystemStage`, `data-system-stage`, `protection-motion`, and `restore-comparison` usage in `src/app.mjs`; run `node --test tests/ui.test.mjs` and confirm failure.

- [ ] **Step 2: Implement minimal stage switching**

`showSystemStage` toggles `hidden` and `data-active`, moves focus to the active heading, preserves input, and selects motion behavior from `reducedMotion()`.

- [ ] **Step 3: Connect real work completion**

Start protection motion only after detection review is confirmed. Advance when actual masking/storage resolves; do not add fake waits. Recipe selection uses the existing recipe domain and outbound share integration.

- [ ] **Step 4: Render restore evidence**

After `restoreProtectedText`, show the first verified placeholder/original pair in `#restore-comparison`, update totals, preserve the untouched reply, and keep partial-restore warnings.

- [ ] **Step 5: Run focused and full tests**

Run: `node --test tests/ui.test.mjs tests/pii.test.mjs tests/vault.test.mjs tests/intake.test.mjs tests/share.test.mjs`  
Then: `npm test`  
Expected: all tests PASS.

- [ ] **Step 6: Commit controller work**

```bash
git add src/app.mjs tests/ui.test.mjs
git commit -m "feat: connect luminous flow to local processing"
```

### Task 5: Package, inspect, and deliver the Android debug APK

**Files:**
- Regenerate: `www/`
- Generated: `android/app/build/outputs/apk/debug/app-debug.apk`

**Interfaces:**
- Consumes: tested source tree and existing Capacitor Android project.
- Produces: installable debug APK plus SHA-256 checksum.

- [ ] **Step 1: Run complete pre-build verification**

Run: `npm test`  
Expected: all tests PASS.

- [ ] **Step 2: Build the local web bundle**

Run: `npm run build:web`  
Expected: `www/index.html`, `www/styles.css`, `www/src/`, assets, vendor files, manifest, and service worker are regenerated from source.

- [ ] **Step 3: Check packaged content safety**

Run:

```powershell
node --input-type=module -e "import { checkPackageSafety } from './scripts/check-package.mjs'; const f=await checkPackageSafety('www'); if(f.length){console.error(f);process.exit(1)}"
```

Expected: exit code 0 with no credential findings.

- [ ] **Step 4: Sync Capacitor and compile**

Run: `npm run android:debug`  
Expected: Gradle completes `assembleDebug` and creates `android/app/build/outputs/apk/debug/app-debug.apk`.

- [ ] **Step 5: Verify artifact**

Run:

```powershell
Get-Item android\app\build\outputs\apk\debug\app-debug.apk
Get-FileHash android\app\build\outputs\apk\debug\app-debug.apk -Algorithm SHA256
```

Expected: non-empty APK and a SHA-256 digest.

- [ ] **Step 6: Commit generated web bundle only if tracked changes are expected**

```bash
git add www
git commit -m "build: package luminous system flow"
```

- [ ] **Step 7: Deliver**

Report the absolute APK path, checksum, test count, and the remaining real-device smoke checks: inbound share, Keystore persistence, external app round-trip, and one-tap restore.
