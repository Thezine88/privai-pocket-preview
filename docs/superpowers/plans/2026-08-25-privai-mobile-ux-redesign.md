# PrivAI Pocket Mobile UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stacked mobile forms with guided input/review/result screens, simplify the home, and make Protect/Restore, the bottom actions, and responsive behavior immediately understandable.

**Architecture:** Keep the dependency-free PWA and its existing domain modules. Add a small pure workflow-state module, use semantic phase containers in `index.html`, and let `src/app.mjs` switch phases without destroying user input. CSS owns responsive layout, visual hierarchy, reduced motion, and fixed result actions; native speech remains a disabled honest future entry point.

**Tech Stack:** Semantic HTML, CSS, JavaScript ES modules, Node built-in test runner, existing PDF.js bundle, existing PWA/Capacitor shell.

**Spec:** `docs/superpowers/specs/2026-08-25-privai-mobile-ux-redesign.md`

## Global Constraints

- Keep four home tools: Convert, Protect, Prepare for AI, and History.
- Restore remains a mode inside Protect.
- Voice remains a cross-tool input method and is labelled `In arrivo` until native capability checks exist.
- No new runtime dependency, remote font, analytics, API call, server, or paid service.
- Warm white `#FFF8F1`, black `#111114`, orange `#FF6B00`, muted gray `#68635F`, and success green `#20A464` remain the palette.
- Every result replaces the prior phase and exposes Copy and Share immediately.
- Core privacy actions are never gated by tokens.
- Do not claim complete anonymization, secure persistent mapping, or universally local speech.
- Preserve all current local PDF, Markdown, PII, storage, copy, share, and restore behavior.
- The working checkpoint has no `.git` directory. Run the listed commits only after the repository metadata is restored; do not initialize a replacement repository over this checkpoint.

---

### Task 1: Pure workflow state

**Files:**
- Create: `src/domain/workflow.mjs`
- Create: `tests/workflow.test.mjs`

**Interfaces:**
- Produces: `createWorkflowState(tool)`, `transitionWorkflow(state, event)`, and `getVisiblePhase(state)`.
- `tool` is one of `convert`, `protect`, `prepare`, `restore`.
- `event` is one of `SUBMIT`, `REVIEW`, `COMPLETE`, `EDIT`, `RESET`.
- State shape: `{ tool: string, phase: 'input'|'review'|'result' }`.

- [ ] **Step 1: Write the failing workflow tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkflowState, transitionWorkflow, getVisiblePhase } from '../src/domain/workflow.mjs';

test('convert moves from input directly to result', () => {
  const start = createWorkflowState('convert');
  assert.deepEqual(transitionWorkflow(start, 'COMPLETE'), { tool: 'convert', phase: 'result' });
});

test('protect requires review before result', () => {
  const start = createWorkflowState('protect');
  const review = transitionWorkflow(start, 'REVIEW');
  assert.equal(getVisiblePhase(review), 'review');
  assert.equal(getVisiblePhase(transitionWorkflow(review, 'COMPLETE')), 'result');
});

test('edit returns to input without changing tool', () => {
  const result = { tool: 'prepare', phase: 'result' };
  assert.deepEqual(transitionWorkflow(result, 'EDIT'), { tool: 'prepare', phase: 'input' });
});

test('invalid transitions preserve state', () => {
  const start = createWorkflowState('restore');
  assert.deepEqual(transitionWorkflow(start, 'UNKNOWN'), start);
});
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run: `node --test tests/workflow.test.mjs`

Expected: FAIL because `src/domain/workflow.mjs` does not exist.

- [ ] **Step 3: Implement the minimal pure state machine**

```js
const VALID_TOOLS = new Set(['convert', 'protect', 'prepare', 'restore']);

export function createWorkflowState(tool) {
  if (!VALID_TOOLS.has(tool)) throw new TypeError(`Unsupported workflow: ${tool}`);
  return { tool, phase: 'input' };
}

export function transitionWorkflow(state, event) {
  if (event === 'RESET' || event === 'EDIT') return { ...state, phase: 'input' };
  if (event === 'REVIEW' && state.tool === 'protect') return { ...state, phase: 'review' };
  if (event === 'COMPLETE') return { ...state, phase: 'result' };
  return state;
}

export function getVisiblePhase(state) {
  return state.phase;
}
```

- [ ] **Step 4: Run workflow and full domain tests**

Run: `node --test tests/workflow.test.mjs tests/markdown.test.mjs tests/pii.test.mjs tests/share.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit after Git metadata is restored**

```bash
git add src/domain/workflow.mjs tests/workflow.test.mjs
git commit -m "feat: add guided tool workflow state"
```

### Task 2: Semantic phased markup and simplified home

**Files:**
- Modify: `index.html`
- Modify: `tests/ui.test.mjs`

**Interfaces:**
- Consumes: phase names from Task 1.
- Produces: `[data-workflow]`, `[data-phase]`, `[data-workflow-edit]`, `[data-protect-mode]`, and `#voice-entry` DOM hooks for `src/app.mjs`.

- [ ] **Step 1: Add failing structural assertions**

Add these assertions to `tests/ui.test.mjs` using the file-reading pattern already present in that test:

```js
assert.match(html, /data-workflow="convert"/);
assert.match(html, /data-workflow="protect"/);
assert.match(html, /data-phase="input"/);
assert.match(html, /data-phase="review"/);
assert.match(html, /data-phase="result"/);
assert.match(html, /data-protect-mode="restore"/);
assert.match(html, /id="voice-entry"/);
assert.match(html, /aria-label="Microfono, in arrivo"/);
assert.doesNotMatch(html, /data-example-section/);
```

- [ ] **Step 2: Run the structural test**

Run: `node --test tests/ui.test.mjs`

Expected: FAIL because the workflow phase hooks and voice entry do not exist.

- [ ] **Step 3: Restructure the home and tool sections**

In `index.html`:

- Keep the four existing home buttons and their working `data-view` values.
- Remove fixed example blocks if any exist.
- Keep the compact image-free hero.
- Wrap each tool in a root such as `<div class="workflow" data-workflow="convert">`.
- Give each stage `<section class="workflow-phase" data-phase="input|review|result">`.
- Mark only input as initially active with `data-phase-active="true"`.
- Move every black output card into its result phase.
- Add a compact Protect mode switch with two real buttons: `data-protect-mode="protect"` and `data-protect-mode="restore"`.
- Add `#voice-entry` beside the existing `+` button with a microphone SVG, `aria-label="Microfono, in arrivo"`, and a small `In arrivo` badge available to assistive technology.
- Keep the clickable Instagram URL and full handle.

Use this phase skeleton consistently:

```html
<div class="workflow" data-workflow="convert">
  <section class="workflow-phase" data-phase="input" data-phase-active="true">…</section>
  <section class="workflow-phase" data-phase="result" hidden>…</section>
</div>
```

- [ ] **Step 4: Run UI, accessibility-string, and PWA tests**

Run: `node --test tests/ui.test.mjs tests/i18n.test.mjs tests/pwa.test.mjs`

Expected: all tests PASS after adding any required Italian and English keys in the existing locale files.

- [ ] **Step 5: Commit after Git metadata is restored**

```bash
git add index.html src/locales/it.mjs src/locales/en.mjs tests/ui.test.mjs
git commit -m "refactor: split tools into guided mobile phases"
```

### Task 3: Workflow controller and immediate results

**Files:**
- Modify: `src/app.mjs`
- Modify: `tests/ui.test.mjs`

**Interfaces:**
- Consumes: `createWorkflowState`, `transitionWorkflow`, `getVisiblePhase` and Task 2 DOM hooks.
- Produces: `showWorkflowPhase(tool, phase)`, `resetWorkflow(tool)`, and event bindings for edit/result transitions.

- [ ] **Step 1: Add failing source-contract tests**

Add:

```js
assert.match(appSource, /from ['"]\.\/domain\/workflow\.mjs['"]/);
assert.match(appSource, /function showWorkflowPhase/);
assert.match(appSource, /data-workflow-edit/);
assert.doesNotMatch(appSource, /scrollIntoView\(.*markdown-output/);
```

- [ ] **Step 2: Run the UI test**

Run: `node --test tests/ui.test.mjs`

Expected: FAIL because the workflow controller is not connected.

- [ ] **Step 3: Implement phase switching**

Add state objects for each workflow and implement:

```js
function showWorkflowPhase(tool, phase) {
  const root = document.querySelector(`[data-workflow="${tool}"]`);
  root.querySelectorAll('[data-phase]').forEach((panel) => {
    const active = panel.dataset.phase === phase;
    panel.hidden = !active;
    panel.toggleAttribute('data-phase-active', active);
  });
  const heading = root.querySelector(`[data-phase="${phase}"] h2, [data-phase="${phase}"] h3`);
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
```

Change existing handlers so:

- Markdown conversion calls `showWorkflowPhase('convert', 'result')` after output is assigned.
- PII detection calls `showWorkflowPhase('protect', 'review')`.
- Applying selected findings calls `showWorkflowPhase('protect', 'result')`.
- Prompt preparation calls `showWorkflowPhase('prepare', 'result')`.
- Restore completion calls `showWorkflowPhase('restore', 'result')` or the Restore result phase inside Protect, matching the final markup.
- `[data-workflow-edit]` returns to input without clearing text.
- Back/navigation reset is explicit and never silently deletes content.

- [ ] **Step 4: Run relevant tests**

Run: `node --test tests/workflow.test.mjs tests/ui.test.mjs tests/markdown.test.mjs tests/pii.test.mjs tests/share.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit after Git metadata is restored**

```bash
git add src/app.mjs tests/ui.test.mjs
git commit -m "feat: show generated results as dedicated screens"
```

### Task 4: Protect and Restore as one understandable tool

**Files:**
- Modify: `index.html`
- Modify: `src/app.mjs`
- Modify: `src/locales/it.mjs`
- Modify: `src/locales/en.mjs`
- Modify: `tests/ui.test.mjs`
- Modify: `tests/pii.test.mjs`

**Interfaces:**
- Consumes: current `state.mapping`, `state.maskScope`, `maskFindings`, and restore functions.
- Produces: `setProtectMode(mode)` where mode is `protect` or `restore`.

- [ ] **Step 1: Add failing behavior contracts**

Assert that markup and source contain:

```js
assert.match(html, /data-protect-mode="protect"/);
assert.match(html, /data-protect-mode="restore"/);
assert.match(appSource, /function setProtectMode/);
assert.match(appSource, /\[NOME_1\]|placeholder|mapping/i);
```

Keep the existing exact restore tests and add a case confirming unknown placeholders remain unchanged.

- [ ] **Step 2: Run Protect/Restore tests**

Run: `node --test tests/ui.test.mjs tests/pii.test.mjs`

Expected: FAIL on the new UI/controller contracts; existing domain restore assertions continue to pass.

- [ ] **Step 3: Implement the mode switch and active-job prompt**

Implement `setProtectMode(mode)` to:

- update `aria-pressed` on both mode buttons;
- show the matching input phase;
- preserve current Protect and Restore text independently;
- show `Risposta in attesa` only when `state.mapping` contains entries;
- never claim persistence beyond the current session;
- route content containing a placeholder that exists in `state.mapping` to Restore;
- leave unmatched bracketed text untouched.

The protected result must show the replacement count and expose `Copia`, `Condividi`, and `Invia all’IA` in the black card header. The restored result must expose `Copia` and `Condividi` in the same location.

- [ ] **Step 4: Run Protect/Restore and full domain tests**

Run: `node --test tests/pii.test.mjs tests/ui.test.mjs tests/share.test.mjs tests/storage.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit after Git metadata is restored**

```bash
git add index.html src/app.mjs src/locales/it.mjs src/locales/en.mjs tests/ui.test.mjs tests/pii.test.mjs
git commit -m "feat: unify protect and restore workflow"
```

### Task 5: Responsive visual system and bottom bar

**Files:**
- Modify: `styles.css`
- Modify: `tests/ui.test.mjs`

**Interfaces:**
- Consumes: semantic classes from Task 2.
- Produces: responsive phase, hero, header, tool-card, result-card, mode-switch, and bottom-bar styling.

- [ ] **Step 1: Add failing CSS contract tests**

Add:

```js
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /\.workflow-phase\[data-phase-active\]/);
assert.match(css, /grid-template-columns:\s*minmax\(0,1fr\)\s+auto\s+auto/);
assert.match(css, /@media\s*\(max-width:\s*380px\)/);
assert.match(css, /\.result-actions-sticky/);
```

- [ ] **Step 2: Run the UI test**

Run: `node --test tests/ui.test.mjs`

Expected: FAIL because the responsive workflow rules do not exist.

- [ ] **Step 3: Implement the responsive rules**

Implement these exact behaviors:

- `.workflow-phase` is hidden by the `hidden` attribute; the active phase animates in.
- `.hero-card` uses a compact minimum height between 220 and 250 px on phone widths and contains no artwork.
- `.topbar` uses a flexible greeting column and a non-shrinking actions column.
- Greeting text uses `clamp()` and an emoji/text grid so wrapped lines align under the text.
- `.tool-card` uses a shared image box and shared copy baseline.
- `.result-actions-sticky` remains visible at the top or bottom of the result without covering content.
- `.bottom-bar` uses `grid-template-columns: minmax(0,1fr) auto auto`.
- The Instagram handle may wrap onto two lines but never uses ellipsis.
- `+` and microphone controls are 56–60 px circular targets.
- At `max-width: 380px`, reduce gaps and type scale rather than hide the handle.
- Add visible `:focus-visible` styles.
- Under `prefers-reduced-motion: reduce`, remove smooth scrolling and non-essential transforms.
- Explicitly set `color-scheme: light` and light backgrounds to resist forced dark styling where the browser permits it.

- [ ] **Step 4: Run structural tests and build**

Run: `node --test tests/ui.test.mjs && npm run build:web`

Expected: PASS and successful production build.

- [ ] **Step 5: Commit after Git metadata is restored**

```bash
git add styles.css tests/ui.test.mjs
git commit -m "style: add responsive guided mobile interface"
```

### Task 6: Honest voice, tokens, Pro, and future states

**Files:**
- Modify: `index.html`
- Modify: `src/app.mjs`
- Modify: `src/locales/it.mjs`
- Modify: `src/locales/en.mjs`
- Modify: `tests/ui.test.mjs`
- Modify: `tests/package-safety.test.mjs`

**Interfaces:**
- Produces: disabled/future controls that never request microphone permission or simulate success in the PWA.

- [ ] **Step 1: Add failing honesty and safety assertions**

```js
assert.match(html, /Microfono, in arrivo/);
assert.match(html, /Gettoni.*Beta|Beta.*gettoni/is);
assert.doesNotMatch(appSource, /getUserMedia\(/);
assert.doesNotMatch(appSource, /SpeechRecognition\(/);
assert.doesNotMatch(appSource, /webkitSpeechRecognition\(/);
assert.doesNotMatch(appSource, /fetch\([^)]*(openai|anthropic|groq|gemini)/i);
```

- [ ] **Step 2: Run UI and package-safety tests**

Run: `node --test tests/ui.test.mjs tests/package-safety.test.mjs`

Expected: FAIL until the honest future labels are present; all no-network assertions must remain true.

- [ ] **Step 3: Implement future-state interactions**

- Tapping the microphone opens a compact dialog explaining that local voice input is coming to the native app; it must not request microphone permission.
- Token info states that rewards are in beta, have no monetary value, and do not gate core privacy protection.
- Pro cards separate working benefits from `In arrivo` benefits.
- Every unavailable control uses `aria-disabled="true"` or a dialog and never reports completion.

- [ ] **Step 4: Run UI, safety, and localization tests**

Run: `node --test tests/ui.test.mjs tests/package-safety.test.mjs tests/i18n.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit after Git metadata is restored**

```bash
git add index.html src/app.mjs src/locales/it.mjs src/locales/en.mjs tests/ui.test.mjs tests/package-safety.test.mjs
git commit -m "feat: label voice and rewards as honest future features"
```

### Task 7: Cache migration, verification, and handoff

**Files:**
- Modify: `sw.js`
- Modify: `HANDOFF.md`
- Modify: `tests/pwa.test.mjs`
- Modify: `tests/build-web.test.mjs`

**Interfaces:**
- Produces: a new immutable cache identifier and an updated resume document.

- [ ] **Step 1: Add a failing cache-version assertion**

Update the PWA test to require the next cache identifier, `privai-pocket-v14`, and to confirm the new workflow module is cached:

```js
assert.match(serviceWorker, /privai-pocket-v14/);
assert.match(serviceWorker, /src\/domain\/workflow\.mjs/);
```

- [ ] **Step 2: Run PWA and build tests**

Run: `node --test tests/pwa.test.mjs tests/build-web.test.mjs`

Expected: FAIL until `sw.js` uses v14 and includes the new module.

- [ ] **Step 3: Update cache and handoff**

- Change the service-worker cache name to `privai-pocket-v14`.
- Add `src/domain/workflow.mjs` to cached production assets.
- Record the redesign, voice future-state limitation, Git-metadata limitation, exact test output, and build artifact paths in `HANDOFF.md`.
- Do not claim Chrome, Samsung Internet, PWA, or APK device validation unless it was actually performed.

- [ ] **Step 4: Run complete verification**

Run:

```bash
node --test tests/*.test.mjs
npm run build:web
npm run check:package
```

Expected: every test passes, build completes, and package safety check reports no provider secret or unsafe remote processing.

- [ ] **Step 5: Perform local responsive inspection**

Serve with `npm run serve`, inspect at 360, 390, 430, and 680 CSS pixels, and record results without claiming physical-device coverage. Verify:

- no greeting/header collision;
- full Instagram handle;
- visible `+` and microphone;
- no hidden result below input;
- Copy and Share visible on every result;
- Protect/Restore discoverable;
- reduced-motion mode remains usable.

- [ ] **Step 6: Commit after Git metadata is restored**

```bash
git add sw.js HANDOFF.md tests/pwa.test.mjs tests/build-web.test.mjs
git commit -m "chore: verify and document mobile UX redesign"
```

## Plan self-review

- Spec coverage: home, all four tools, Protect/Restore, future voice, responsive behavior, accessibility, honest future states, cache migration, and verification are each assigned to a task.
- Scope boundary: native microphone, Share Target, Keystore/Keychain, photo/link cleaning, payments, cloud, and desktop remain excluded.
- Type consistency: workflow tools, phases, events, DOM hooks, and `setProtectMode(mode)` names are consistent across tasks.
- Placeholder scan: the plan contains no implementation placeholders; future functionality is intentionally represented only as an honest disabled state.
