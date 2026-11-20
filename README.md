# USWDS Futures Lab

**An independent, MIT-licensed laboratory for testing proposed improvements and new components against a stable USWDS release, with reproducible evidence and human-reviewed decisions.**

No endorsement by GSA, USWDS, OGDS, or CivicActions is claimed. The experiments are proposals, not upstream features.

## What the lab is

The lab compares the released **USWDS 3.14.0** npm distribution with small, separately authored proposals. It connects each proposal to community issue history, implementation guidance, deterministic browser tests, Guidepup virtual-screen-reader transcripts, screenshots, axe observations, and an explicit human-review record.

It currently contains:

- **5 component fixtures:** accordion, alert, banner, form controls, and native radio validation.
- **4 experiments:** native dark mode (cross-component capability), a user preferences panel (new component), logical properties for RTL (alternative implementation), and native radio validation (alternative implementation).
- **30 published lab routes** with route smoke tests and evidence collection.
- **72 state-specific Guidepup transcripts** in the verified local run (initial, expanded, collapsed, invalid, valid, dark, RTL).
- **Pinned provenance** in `data/sources.lock.json`: release tag, commit, package-lock SHA-256, and USWDS CSS/JS SHA-256.

## What the lab is not

- It is not a fork of USWDS or a competing government design system.
- It does not claim official endorsement, WCAG conformance, or real screen-reader coverage.
- It does not fabricate a baseline for a new component.
- It does not automatically promote a newer USWDS release.
- It does not open, comment on, or submit upstream issues or pull requests without explicit human authorization.
- It does not require a database, server authentication, proprietary API, or cloud AI service.

## Quick start

```bash
npm ci
npm run check
npx playwright install chromium
npm run test:browser:chromium
npm run evidence
npm run build:strict
npm run validate
```

Then:

```bash
npm run dev
```

Open <http://127.0.0.1:4173/>. The test server uses port **4181** by default so it does not collide with a local `npm run dev` server on 4173. Override with `LAB_TEST_PORT`.

### Restricted local environments

Playwright's bundled Chromium may be blocked by a sandbox. If an installed Chrome is available:

```bash
LAB_BROWSER_CHANNEL=chrome npm run test:browser:chromium
PLAYWRIGHT_CHANNEL=chrome npm run evidence
```

Record that substitution in the evidence notes; do not present a Chrome-channel run as a bundled-Chromium run.

If `npm install` is unavailable, `npm run build` still produces a clearly labelled offline illustration. It is **not** upstream USWDS and `npm run evidence` refuses to run against it.

## Source provenance

`data/sources.lock.json` records:

- USWDS release `v3.14.0`, published 2026-08-18.
- Commit `92391c3b1bf536d15fe85846c16c2c0937049b16`.
- npm package `@uswds/uswds@3.14.0`.
- SHA-256 of `package-lock.json`, the distributed CSS, and the distributed JS.

`npm run sources:verify` fails if the installed package, lockfile, or asset hashes differ. `npm run sources:latest` queries GitHub for a newer non-prerelease release and prints a proposal workflow; it never changes the baseline. A newer release becomes the baseline only through a reviewed change and a maintainer decision.

## Pages

- **Overview** — what the lab contains, featured experiments, and current evidence counts.
- **Components** — stable components, official USWDS guidance, implementation notes, keyboard behavior, limitations, experiments, and fixtures.
- **Experiments** — proposals with category, status, related issue history, demonstration, implementation guidance, evidence, and review status.
- **Community ideas** — a curated issue catalogue that distinguishes open, closed-not-planned, completed, and consolidated work.
- **Evidence** — the current run, per-route reports, state transcripts, screenshots, axe observations, and coverage gaps.
- **Methodology and governance** — provenance, experiment lifecycle, AI disclosure, and scope boundaries.
- **Landing demo** — a full-page USWDS vs concept comparison with independent iframes.
- **Compare** — side-by-side and onion views with independent iframe links and explicit state controls.
- **User preferences panel** — the new-component proposal, with persistence, reset, and a live preview.

## Experiments

### Native dark mode

A semantic `--fx-*` token layer over the official components. It follows `prefers-color-scheme`, accepts an explicit light/dark override, and covers the accordion, alert, banner, and form. Focus is measured against the rendered surface: the light ring is `#005ea2` (6.2:1 on the light surface), the dark ring is `#ffbe2e` (10.7:1 on the dark canvas). The upstream white `.usa-radio`/`.usa-checkbox` container and the visible narrow-screen banner prompt are explicitly themed.

This is not complete USWDS dark mode. Header, footer, navigation, tables, cards, and the upstream alert icon are not covered.

### User preferences panel

A proposed component with native radios and selects for appearance, text size, contrast, and motion. It stores only those four values in `localStorage` under `uswds-lab-prefs`, catches storage failures, resets to system defaults, and keeps the page readable without JavaScript. Stable USWDS has no equivalent panel; the missing baseline is stated rather than invented.

### Logical properties for RTL

Selected physical alert borders are replaced with `border-inline-start`; accordion and banner controls use `text-align:start`. A short labelled Arabic sample tests mixed direction. A native-language review is outstanding.

### Native radio validation

A required radio group with native constraint validation, no redundant `aria-required` or custom radiogroup role, and a recorded focus result after an invalid submit. Voice Control and real screen-reader testing remain outstanding.

### Landing-page comparison (concept stand-in)

[the landing demo](https://mgifford.github.io/design-system-lab/demo.html) shows the same service landing page twice: straight USWDS 3.14.0 on the left, and a clearly labelled concept style on the right. The right pane is **not OGDS Elements**; it is a visual stand-in used to validate the comparison workflow until the OGDS licence and permission are resolved. When they are, the right renderer is replaced without changing the left pane or the content model.

## Evidence pipeline

`npm run evidence`:

1. Refuses to run if the build is an offline illustration.
2. Clears `reports/latest` and writes a `running` manifest before collection.
3. Loads every route in `dist/data/routes.json` with the pinned USWDS assets.
4. Records page/console errors, axe violations, screenshots, and Guidepup virtual transcripts.
5. Captures state-specific transcripts for disclosures, forms, dark appearance, and RTL where applicable.
6. Writes `SUMMARY.md`, `COVERAGE.md`, and a final `MANIFEST.json`.
7. Copies the run to `reports/runs/<run-id>`.
8. Fails when any route cannot be collected; missing output is never a pass.

The build publishes evidence only from the current `reports/latest` run. `dist/evidence` is deleted first, so a previous run cannot leak in.

**Guidepup is a virtual screen reader over a DOM snapshot. It is not NVDA, JAWS, or VoiceOver.** Axe runs on the initial route state only and is not a WCAG conformance determination. Screenshots are evidence for human inspection, not a design verdict.

## GitHub Pages and CI

The site is static and repository-subpath safe. CI is configured in:

- `.github/workflows/tests.yml` — pull requests: install, unit tests, strict build, Playwright Chromium, evidence, validation, artifact upload. No deployment.
- `.github/workflows/pages.yml` — pushes to `main`: the same checks and publication to GitHub Pages.

CI uses `npm ci` with the committed lockfile. The workflow has not been executed in the authoring environment; the local Chromium-channel checks are recorded below.

### Local verification

- `npm run test:unit` — 14 passing.
- `npm run build:strict` — 30 lab routes, 30 documentation pages, 10 fixtures.
- `LAB_BROWSER_CHANNEL=chrome npx playwright test --project=chromium` — **65 passing**.
- `npm run evidence` (Chrome channel) — **30/30 routes, 82 state transcripts, 0 failed**.
- `npm run validate` — 5 components, 4 experiments, 14 issues, 5 scenarios, 30 routes, 30 MCP scenarios, evidence run complete.

WebKit ran locally: **64 passing, 1 skipped** (the axe scan is Chromium-only by design). Firefox could not launch in the authoring sandbox because it could not create its profile folder; that is recorded as a blocked check, not a pass. CI currently runs Chromium only.

## Repository layout

```text
data/                 registry, issue catalogue, review metadata, source lock
experiments/          experiment docs (README, IMPLEMENTATION, TEST-PLAN, DECISION)
docs/                 architecture, testing, evidence, design decisions, guides
scripts/              build, evidence, validation, sources, scaffold, MCP sync
site/assets/          shell CSS, experiment CSS, fixture CSS/JS, preferences
templates/pages/      shared page fragments rendered by the build
tests/browser/        deterministic Playwright tests and helpers
tests/unit/           registry, source-lock, and Markdown tests
reports/templates/    human evidence and decision templates
reports/latest/       generated current evidence (gitignored)
```

`data/registry.json` is the canonical registry. Component pages, experiment pages, fixture routes, the comparison viewer, MCP scenarios, and validation derive from it. `experiments/<id>/experiment.json` is intentionally not duplicated; the registry is the single source of truth.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md), [`GOVERNANCE.md`](GOVERNANCE.md), [`ACCESSIBILITY.md`](ACCESSIBILITY.md), and [`docs/CONTRIBUTING-EXPERIMENTS.md`](docs/CONTRIBUTING-EXPERIMENTS.md).

```bash
npm run experiment:new -- --slug my-idea --title "My idea" --type component-improvement
```

The scaffold creates a draft with **no verified evidence**. It does not generate test results or a review decision.

## AI disclosure

The initial starter was drafted with ChatGPT assistance. This implementation pass was drafted with the DeepSeek Harness coding agent (`deepseek-flash`) on 2026-11-20. AI assisted with issue research, implementation, test scaffolding, evidence generation, and documentation. No human has reviewed or approved the experiments. No upstream project has endorsed this work. See [`AI_DISCLOSURE.md`](AI_DISCLOSURE.md).

## License

Original lab code and documentation are MIT-licensed. USWDS and third-party assets keep their own licenses. See [`THIRD-PARTY.md`](THIRD-PARTY.md).
