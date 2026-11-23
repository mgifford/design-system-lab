# USWDS Futures Lab

**An independent, MIT-licensed laboratory for testing proposed improvements and new components against a stable USWDS release, with reproducible evidence and human-reviewed decisions.**

No endorsement by GSA, USWDS, OGDS, or CivicActions is claimed. The experiments are proposals, not upstream features.

## What the lab is

The lab compares the released **USWDS 3.14.0** npm distribution with small, separately authored proposals. It connects each proposal to community issue history, implementation guidance, deterministic browser tests, Guidepup virtual-screen-reader transcripts, screenshots, axe observations, and an explicit human-review record.

It currently contains:

- **5 component fixtures:** accordion, alert, banner, form controls, and native radio validation.
- **4 experiments:** native dark mode (cross-component capability), a user preferences panel (new component), logical properties for RTL (alternative implementation), and native radio validation (alternative implementation).
- **33 published lab routes** with route smoke tests and evidence collection.
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

OGDS Elements `1.0.0-beta.2` (tag `v1.0.0-beta.2`, commit `59b05f1`) is pinned for the hybrid landing demo. Public-domain permission was confirmed on 2026-11-20; the permission record, tarball integrity, and component boundary are in [docs/OGDS-PERMISSION.md](docs/OGDS-PERMISSION.md).

## Pages

- **Evaluate** — the evaluation workspace: four comparison modes, fixture conditions, evaluator display, state selection, focus inspector, evidence classification, manual tests, and shareable URLs.
- **Components** — stable components, official USWDS guidance, implementation notes, keyboard behavior, limitations, experiments, and fixtures.
- **Experiments** — proposals with category, status, related issue history, demonstration, implementation guidance, evidence, and review status.
- **Community ideas** — a curated issue catalogue that distinguishes open, closed-not-planned, completed, and consolidated work.
- **Evidence** — the current run, per-route reports, state transcripts, screenshots, axe observations, and coverage gaps.
- **Methodology and governance** — provenance, experiment lifecycle, AI disclosure, and scope boundaries.
- **Landing demo** — a full-page USWDS vs OGDS hybrid comparison with independent iframes.
- **Forms demo** — a secondary form comparison showing USWDS controls inside the OGDS hybrid shell.
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

### Landing-page comparison (OGDS hybrid)

[the landing demo](https://mgifford.github.io/design-system-lab/demo.html) shows the same service landing page twice: straight USWDS 3.14.0 on the left, and a USWDS 3.14.0 + **OGDS Elements 1.0.0-beta.2** hybrid on the right. OGDS is used for the banner, header/primary navigation, and accordion; the alert remains USWDS because beta.2 does not export a built alert module; hero, cards, search, and footer remain USWDS. Public-domain permission is recorded in [docs/OGDS-PERMISSION.md](docs/OGDS-PERMISSION.md); this is an experimental contribution, not a full replacement or endorsement.

### Forms comparison and the content model

[the forms comparison](https://mgifford.github.io/design-system-lab/demo/forms.html) uses the same contact form on both sides. OGDS beta.2 has no form controls, so the form remains USWDS; the banner and header are the hybrid layers. The page records that boundary in the coverage table and tests native validation, error summary, inline errors, and status feedback.

The landing and forms pages are generated from one JSON content model:

- `content/pages/landing.json` and `content/pages/forms.json` contain the shared copy and block structure.
- `renderers/uswds.mjs` maps blocks to USWDS markup.
- `renderers/ogds.mjs` maps a block to OGDS only when `data/coverage.json` says an alternate exists; everything else falls back to USWDS and is marked unchanged.
- `content/sandbox.lock.json` pins the sandbox content source at commit `26d5a939476512ca08ce9a8f5b4f757a5df06198`; the lab adapts selected content and does not copy its build system.
- Each generated page carries the same `data-content-hash` on both sides; tests assert the hash and content parity.

A block without an OGDS implementation cannot silently disappear: the renderer falls back to USWDS, and the coverage table says so.

Human decisions are recorded in one table, [`docs/EXPERIMENT-DECISIONS.md`](docs/EXPERIMENT-DECISIONS.md), not in a form per experiment. Dark mode is recorded as accepted as a lab experiment; the other three are undecided. Acceptance does not mean upstream adoption or assistive-technology validation.

## Evaluation workspace

[`compare.html`](https://mgifford.github.io/design-system-lab/compare.html) is the lab's main evaluation surface. It is reachable from the primary navigation, component pages, experiment pages, and the evidence page. The full guide is [`docs/EVALUATION-GUIDE.md`](docs/EVALUATION-GUIDE.md).

- **Four comparison modes** — side by side (live iframes that share the available width, with a keyboard/pointer baseline-experiment slider), reveal slider, onion skin, and pixel difference from matched Playwright captures. Reveal and onion are marked visual-only; side-by-side and the independent links carry keyboard interaction. Fit mode scales the fixed viewport and labels the percentage; Actual mode keeps the fixed viewport and shows an explicit horizontal-overflow warning.
- **Fixture conditions** — appearance, motion, contrast, text size, WCAG text spacing, direction, language, fixed viewport width (Fit/Actual), and preview source, applied identically to both panes.
- **Evaluator display** — separate controls for the tool itself, stored under `uswds-lab-prefs`. Fixtures ignore stored preferences unless opened with `?prefs=1`, so tool settings do not leak into the component under test.
- **Honest browser conditions** — forced colours and increased contrast are captured with Playwright browser emulation and labelled as such. No CSS filter or class is presented as operating-system emulation.
- **Alert state model** — twelve declared states, including success, emergency, no heading, link, long content, Arabic, dynamically inserted, dynamically updated, and multiple. Each state is reproducible, axe-scanned, and captured.
- **Evidence classification** — per-state axe counts and a fixed/introduced/common comparison. A disappearing violation is a candidate fix, not proof; removed content is not a fix.
- **Manual tests** — eleven alert tests based on the USWDS checklist plus dynamic status-message guidance, with local pass/fail/blocked records, required justification for "not applicable", and JSON/Markdown export. Nothing is submitted automatically.
- **Reproducible URLs** — a versioned, validated parameter schema, invalid-value reporting, copy-link, and named presets stored in the browser.
- **Cost and stability** — three cold-context runs per fixture at 1280 × 850 with 4× CPU throttling; transfer bytes, request counts, DOM size, and timing observations. Hard byte/request/DOM budgets; timing warnings only. No performance score.

The workspace is not a conformance tool. It never shows an aggregate accessibility score, and a missing run or capture is displayed as a gap.

## Evidence pipeline

`npm run evidence`:

1. Refuses to run if the build is an offline illustration.
2. Clears `reports/latest` and writes a `running` manifest before collection.
3. Loads every route in `dist/data/routes.json` with the pinned USWDS assets.
4. Records page/console errors, axe violations, screenshots, and Guidepup virtual transcripts.
5. Captures state-specific transcripts for disclosures, forms, dark appearance, RTL, and declared component states where applicable.
6. Runs axe on every declared state of a component, after any required activation, and records the violations by state.
7. Captures matched baseline/experiment screenshots at 900 × 900 for light, dark, forced-colours, and increased-contrast conditions (all four for every registered component).
8. Measures three cold-context performance runs per baseline/experiment fixture (1280 × 850, light, 4× CPU throttling) and evaluates hard byte/request/DOM budgets plus warning-only timing thresholds.
9. Writes `SUMMARY.md`, `COVERAGE.md`, `performance.json`, and a final `MANIFEST.json`.
10. Copies the run to `reports/runs/<run-id>`.
11. Fails when any route cannot be collected; missing output is never a pass.

The build publishes evidence only from the current `reports/latest` run. `dist/evidence` is deleted first, so a previous run cannot leak in.

**Guidepup is a virtual screen reader over a DOM snapshot. It is not NVDA, JAWS, or VoiceOver.** Axe runs on the initial route and on declared component states; it is not a WCAG conformance determination. Screenshots and captures are evidence for human inspection, not a design verdict. Published evidence records zero completed manual tests unless a person exports and attaches their records.

## GitHub Pages and CI

The site is static and repository-subpath safe. CI is configured in:

- `.github/workflows/tests.yml` — pull requests: install, unit tests, strict build, Playwright Chromium, evidence, validation, artifact upload. No deployment.
- `.github/workflows/pages.yml` — pushes to `main`: the same checks and publication to GitHub Pages.

CI uses `npm ci` with the committed lockfile. The workflow has not been executed in the authoring environment; the local Chromium-channel checks are recorded below.

### Local verification

- `npm run test:unit` — 34 passing, including evaluation URL validation, state/fixture consistency, pane sizing, pixel-diff math, finding classification, and performance budget math.
- `npm run build:strict` — 33 lab routes, 30 documentation pages, 10 fixtures.
- `LAB_BROWSER_CHANNEL=chrome npx playwright test --project=chromium` — **97 passing**.
- `npm run evidence` (Chrome channel) — **33/33 routes, 96 Guidepup state transcripts, 24 state-level axe scans, 64 matched capture pairs, 10 performance routes (30 runs, 0 hard budget failures), 0 failed**.
- `npm run validate` — 5 components, 4 experiments, 14 issues, 5 scenarios, 33 routes, 33 MCP scenarios, evidence run complete.

WebKit ran locally: **69 passing, 1 skipped** (the axe scan is Chromium-only by design). Firefox could not launch in the authoring sandbox because it could not create its profile folder; that is recorded as a blocked check, not a pass. CI currently runs Chromium only.

## Repository layout

```text
data/                 registry (including states and evaluation metadata), manual tests, performance budgets,
                       issue catalogue, review metadata, source lock, coverage map
content/              shared page content and the pinned sandbox content lock
renderers/            USWDS and OGDS block renderers
experiments/          experiment docs (README, IMPLEMENTATION, TEST-PLAN)
docs/                 architecture, testing, evidence, evaluation and performance guides, design decisions, guides
scripts/              build, evidence, validation, sources, scaffold, MCP sync
site/assets/          shell CSS, experiment CSS, fixture CSS/JS, preferences
templates/pages/      shared page fragments rendered by the build
tests/browser/        deterministic Playwright tests and helpers
tests/unit/           registry, source-lock, and Markdown tests
reports/templates/    human evidence and decision templates
reports/latest/       generated current evidence (gitignored)
```

`docs/PERFORMANCE.md` explains the performance method and budget policy.

`data/registry.json` is the canonical registry. Component pages, experiment pages, fixture routes, the evaluation workspace, MCP scenarios, and validation derive from it. `experiments/<id>/experiment.json` is intentionally not duplicated; the registry is the single source of truth.

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
