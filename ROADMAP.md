# Pilot roadmap

## Completed in this pass

- [x] Generate and commit `package-lock.json`; use `npm ci`.
- [x] Record immutable source provenance (release, commit, package-lock hash, asset hashes).
- [x] Add a validator that checks the registry, source lock, docs, routes, MCP scenarios, and evidence.
- [x] Replace the limited fixture registry with a component + experiment registry and lifecycle statuses.
- [x] Generate component and experiment pages from the registry, with shared navigation and layout.
- [x] Fix the evidence collector: missing `CSS` global, stale manifests, transcript wrap-around, stale keyboard locators, and missing state coverage.
- [x] Publish only the current evidence run; preserve historical runs.
- [x] Add state-specific Guidepup transcripts, screenshots, and axe observations.
- [x] Add dark-mode contrast tests that measure the rendered focus ring and radio surface.
- [x] Add the user preferences panel with native controls, persistence, reset, and no-JavaScript fallback.
- [x] Add RTL logical-property and native radio-validation prototypes.
- [x] Add GitHub Pages and pull-request workflows with artifact upload and no PR deployment.
- [x] Add contributor, architecture, testing, evidence, and design-decision documentation.
- [x] Add `experiment:new`, `sources:*`, and `mcp:*` scripts.

## Completed in the evaluation-interface pass

- [x] Promote comparison into a first-class Evaluate workspace linked from the primary navigation, component pages, experiment pages, and evidence.
- [x] Add side-by-side, reveal-slider, onion-skin, and matched-screenshot pixel-difference modes.
- [x] Make side-by-side share the available width with a pane-share slider, plus explicit Fit (scaled) and Actual (overflow warning) modes.
- [x] Separate evaluation-tool display preferences from fixture conditions; fixtures ignore stored tool preferences unless `?prefs=1` is explicit.
- [x] Add validated, versioned evaluation URLs with copy-link and browser-local named presets.
- [x] Add fixture conditions for appearance, motion, contrast, 200% text, WCAG text spacing, direction, language, and viewport width.
- [x] Capture forced-colours and increased-contrast screenshots with Playwright browser emulation; label CSS approximations as approximations.
- [x] Add a keyboard focus inspector for live panes.
- [x] Declare component states in the registry and model twelve Alert states, including dynamic insert/update and Arabic content.
- [x] Run axe on every declared state and classify baseline-only, experiment-only, and shared findings.
- [x] Add eleven Alert manual tests based on the USWDS checklist, local result recording, required justification for not applicable, and JSON/Markdown export.
- [x] Add experiment filtering by user preference and automated coverage, with manual-test counts.
- [x] Add 27 evaluation browser tests and evaluation-specific unit tests.
- [x] Add cold-context fixture performance evidence with hard byte/request/DOM budgets, timing warnings, and a workspace cost panel.

## P0: verify in CI and real environments

- [ ] Run the GitHub Actions workflows on a real runner and confirm Pages deployment under the final repository subpath.
- [x] Run Playwright in WebKit locally (59 passing, 1 axe skip).
- [ ] Run Playwright in Firefox; the authoring sandbox could not create a Firefox profile. Record the result separately from Chromium.
- [ ] Confirm the new comparison capture phase and state-level axe scans on a CI runner with the bundled browser, not the Chrome channel.
- [ ] Perform a real NVDA/VoiceOver session for the four experiments and the radio group.
- [ ] Perform a Voice Control / speech-input session for the radio-validation and form fixtures.
- [ ] Test Windows High Contrast Mode on a real Windows device.
- [ ] Test 400% zoom, 200% text, and text-spacing overrides.

## P1: strengthen comparisons and human evidence

- [ ] Replace the pixel-difference in-browser decoder with a reviewed, deterministic comparison if the capture matrix grows beyond Alert.
- [ ] Add component-specific manual tests for Accordion, Banner, Form, and Radio validation.
- [ ] Add a published-evidence workflow for attaching exported manual results without a backend (for example a reviewed PR artifact).
- [ ] Extend the evaluation state model to Accordion, Form, and Banner interactions.
- [ ] Add RTL and large-text captured conditions, and document why they are not in the default matrix.
- [ ] Add real-browser zoom and user-stylesheet instructions that do not imply automated coverage.
- [ ] Review the evaluation workspace with a real screen reader and forced-colours Windows session.

## Dark-mode and preference follow-ups

- [ ] Extend semantic tokens to header, footer, navigation, cards, tables, and the upstream alert icon.
- [ ] Replace remaining `!important` overrides where upstream specificity allows.
- [x] Add a visual-difference mode with normalized screenshot comparison (matched Playwright captures, browser-side diff).
- [x] Measure transfer size, request counts, DOM size, and basic timing observations; energy and initialization-flash claims remain out of scope.
- [ ] Review the preferences panel’s storage contract and cross-tab behavior.

## P2: deepen the community experiments

- [ ] Add a native-language review of the RTL sample and longer mixed-direction content.
- [ ] Record Chromium/Firefox radio focus differences and investigate upstream positioning.
- [ ] Evaluate responsive tables (#4143) and multiselect combobox (#4863) as future experiments.
- [ ] Add a read-only issue importer with provenance and human curation; do not auto-rank by reactions.

## P3: interoperable adapters and upstream proposals

- [ ] Verify OGDS Elements licensing and select an immutable package version before any adapter.
- [ ] Add USWDS Elements only when stable enough to reproduce and license-reviewed.
- [ ] Generate upstream-ready contribution drafts only after human-reviewed evidence exists.
- [ ] Never open, comment on, or submit upstream without explicit maintainer authorization.
