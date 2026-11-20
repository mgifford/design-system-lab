# Test plan: native dark-mode support

## Deterministic browser checks

- [ ] Every registered fixture route returns 200 and exposes a visible `h1`.
- [ ] Baseline and experiment are identified in the page and do not load each other's stylesheet.
- [ ] `?theme=dark` changes the experimental body canvas but not the baseline canvas.
- [ ] `?theme=system` follows Playwright's emulated `prefers-color-scheme`.
- [ ] Accordion toggles with Enter and Space; `aria-expanded` matches the panel.
- [ ] Banner toggles with Enter and Space.
- [ ] Form invalid submission is blocked; valid submission shows the local status.
- [ ] Radio validation: empty submit leaves focus on an invalid radio; valid submit shows status.
- [ ] Focus outline contrast is measured on the actual rendered background for light and dark.
- [ ] Radio label contrast is measured in dark mode; the unthemed upstream white container is caught.
- [ ] No uncaught page errors on registered routes.
- [ ] Axe scan records violations for every route; serious/critical findings are fixed or documented.

## Preferences and preferences combinations

- [ ] System dark, explicit dark, and explicit light.
- [ ] Forced-colors emulation.
- [ ] Reduced-motion emulation.
- [ ] 320px viewport and 200% text.
- [ ] RTL banner and alert.
- [ ] No-JavaScript fixture content remains readable, and dead disclosure buttons are not exposed.

## Guidepup evidence

- [ ] Initial transcript for every route.
- [ ] Expanded and collapsed transcripts for disclosure fixtures.
- [ ] Invalid and valid form transcripts.
- [ ] Dark transcript for the experiment pages.
- [ ] Screenshots for light, dark, and relevant states.
- [ ] Explicit list of missing states in `COVERAGE.md`.

## Human review

A person must read the transcripts alongside the DOM, inspect focus and forced-colors behavior, and complete [DECISION.md](DECISION.md). Automated output is not approval.
