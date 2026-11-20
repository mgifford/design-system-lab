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

## P0: verify in CI and real environments

- [ ] Run the GitHub Actions workflows on a real runner and confirm Pages deployment under the final repository subpath.
- [x] Run Playwright in WebKit locally (59 passing, 1 axe skip).
- [ ] Run Playwright in Firefox; the authoring sandbox could not create a Firefox profile. Record the result separately from Chromium.
- [ ] Perform a real NVDA/VoiceOver session for the four experiments and the radio group.
- [ ] Perform a Voice Control / speech-input session for the radio-validation and form fixtures.
- [ ] Test Windows High Contrast Mode on a real Windows device.
- [ ] Test 400% zoom, 200% text, and text-spacing overrides.

## P1: strengthen the dark-mode and preferences work

- [ ] Extend semantic tokens to header, footer, navigation, cards, tables, and the upstream alert icon.
- [ ] Replace remaining `!important` overrides where upstream specificity allows.
- [ ] Add a visual-difference mode with normalized screenshot comparison, or document why onion overlay is sufficient.
- [ ] Measure CSS/JS size and initialization flash; separate observation from energy claims.
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
