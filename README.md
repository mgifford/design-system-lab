# USWDS Futures Lab

**Independent, MIT-licensed USWDS comparison and research pilot.** No endorsement by GSA, USWDS, OGDS, or CivicActions is claimed.

This repository ships an interactive site for GitHub Pages. It compares the released **USWDS 3.14.0** package with a *separately authored, experimental* CSS customization for light/dark themes, then connects experiments to historical USWDS issues and human-readable evidence. It does not claim that OGDS or USWDS Elements code is running: these are research references for future adapters.

## Requirements

- Node.js 22 or newer; npm
- Internet access for the initial npm install
- Chromium for Playwright evidence collection (and optionally Firefox/WebKit for local cross-browser checks)

## Local start

```sh
npm install
npm run build:strict
npm run dev
```

Open http://127.0.0.1:4173/ and select **Compare**.

`build:strict` refuses to build if actual `@uswds/uswds@3.14.0` CSS and JS are not installed. `npm run dev` builds again and starts a static server. With no network or dependencies, `npm run build` still makes a clearly labeled offline illustration; **do not report its visual output as upstream USWDS**.

## Test and collect evidence

```sh
npx playwright install chromium firefox webkit
npm run test:unit
npm run test:browser
npm run evidence
npm run build:strict
npm run validate
```

Playwright includes per-page smoke tests, real keyboard interaction, RTL direction, dark-mode switching, form validation, forced-colors emulation, and no-JavaScript content access. Test fixtures remain readable without JavaScript. By default Playwright tests Chromium, Firefox, and WebKit. GitHub Pages CI uses Chromium only and explicitly leaves broader coverage as a gap.

The [Playwright MCP procedures](docs/PLAYWRIGHT-MCP.md) include a scenario for every published route. A validation check prevents route drift. These are agent-guided explorations, not CI assertions.

`npm run evidence` visits every published page, captures its browser DOM, records an ARIA inventory and keyboard disclosure observation where applicable, and runs Guidepup's **virtual** screen reader over a jsdom snapshot. It writes each page's transcript and context into `reports/latest/*.md`, plus `SUMMARY.md` and `MANIFEST.json`. This is **not** a real NVDA/VoiceOver test. It fails when any published page cannot be captured; missing evidence is never marked as passed.

To publish locally captured evidence in the built site, run `npm run build:strict` again and open **Evidence**. The reports remain human-readable Markdown and are also shown in text-based HTML wrappers on GitHub Pages.

## GitHub Pages

1. Create a new empty GitHub repository (for example `uswds-futures-lab`).
2. Extract the starter zip into its root, then commit all **source** files. Do not commit `node_modules/` or `dist/`.
3. In **Settings → Pages**, select **GitHub Actions** as the build and deployment source.
4. Push the default branch as `main`. `.github/workflows/pages.yml` installs dependencies, builds with pinned USWDS, tests, generates Markdown transcripts for each page, rebuilds with the evidence, and publishes `dist/`.
5. Open `https://<account>.github.io/<repository>/`. All internal links are relative and support the GitHub Pages repository subpath.

The first install creates a `package-lock.json` locally; **commit it** before ongoing development and switch CI to `npm ci` for reproducible dependency resolution. The starter's CI uses `npm install` because the lockfile cannot be generated in this restricted environment. Exact direct dependencies are pinned in `package.json`. This is a known pilot limitation, not the desired final state.

**Before publishing a real comparison** inspect the GitHub Actions results, validate interactions and review `reports/latest/SUMMARY.md`. A successful build is not a WCAG conformance statement.

## What is implemented

- Static, GitHub Pages compatible five-page site (Overview, Compare, Community ideas, Evidence, About).
- Pinned USWDS 3.14.0 as real build dependency for baseline fixtures.
- Four component fixtures: accordion, alert, banner, form controls, each in baseline and experimental variants.
- Adjustable experiment theme, LTR/RTL, viewport simulation, split/onion viewer, independent-frame links.
- Tested no-JS content fallback, automatic preference and forced-colors CSS layers.
- Curated issue data preserving distinctions between open, closed, completed and consolidated work.
- Automated per-page Guidepup virtual transcripts and Markdown reports; site can expose them.
- Playwright tests, project-scoped Playwright MCP configuration, GitHub Actions deployment.
- Documented human review and AI-disclosure contract.

## Scope boundaries

This is a **pilot**, not a comprehensive USWDS fork. Themes, CSS variable coverage, the official component markup and responsive behavior require deeper review, particularly when adding complex variants. There is no OGDS Elements runtime integration yet. No source from GPL-licensed `mgifford/drupal-core-lab` has been copied. See `THIRD-PARTY.md`.

Do not use generated transcripts as an assertion that real assistive technology works. Do not infer that a USWDS issue is unresolved merely because it was closed; check the linked successor issue, discussion, and release.

## Next steps

See [`ROADMAP.md`](ROADMAP.md), [`docs/CANDIDATES.md`](docs/CANDIDATES.md), and [`docs/IMPLEMENTATION-GUIDE.md`](docs/IMPLEMENTATION-GUIDE.md). Start with confirming baseline consistency, improving dark theme token coverage, and adding a small reusable `component.json` / test-evidence schema. Only then add an independently licensed adapter for OGDS or USWDS Elements.
