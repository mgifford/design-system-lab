# Testing

## Commands

```bash
npm ci
npm run check                 # unit tests, strict build, validation
npm run test:browser          # configured browsers
npm run test:browser:chromium # CI/browser subset
npm run evidence              # Playwright + Guidepup + axe
npm run build:strict          # rebuild with generated evidence
npm run validate              # schema, sources, routes, evidence
```

## Layers

1. **Unit tests** (`tests/unit`) validate the registry schema, fixture generation, source lock, and Markdown safety without a browser.
2. **Route smoke tests** load every route from `dist/data/routes.json`, check the status, one visible `h1`, the primary navigation, and no uncaught page errors.
3. **Behavior tests** cover the accordion, banner, form, radio validation, preferences panel, comparison controls, dark mode, RTL, no-JavaScript, reduced motion, and forced colors.
4. **Axe scans** record computable WCAG 2.0/2.1/2.2 A/AA issues per route. A zero count is not conformance.
5. **Evidence collection** captures Guidepup virtual transcripts, state transcripts, screenshots, and axe observations into `reports/latest`.
6. **Validation** checks the registry, source lock, docs, routes, MCP scenarios, and evidence manifest.
7. **Link checking** walks the built HTML and fails on a missing local page, stylesheet, script, or screenshot.

## Browser policy

Playwright's configuration names Chromium, Firefox, and WebKit. CI runs Chromium. In the authoring environment, Chromium (Chrome channel) passed 65 tests and WebKit passed 64 with the axe scan skipped; Firefox could not create a profile folder and did not run. Do not claim a browser was tested when it was not.

## Accessibility testing boundaries

- Automated scans catch only a subset of WCAG issues.
- Guidepup is a virtual screen reader over a DOM snapshot, not NVDA, JAWS, or VoiceOver.
- Forced-colors emulation is not Windows High Contrast Mode on a real device.
- Real screen-reader, speech-input, and user testing remain human responsibilities.

## What must not happen

- A test must not be deleted or weakened to hide a regression.
- A missing transcript must not be counted as a pass.
- A page must not be added to `dist` without a route, MCP scenario, and evidence coverage.
- A green build must not be described as accessibility approval.
