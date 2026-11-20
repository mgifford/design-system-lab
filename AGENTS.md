# Instructions for AI coding agents

## Mission and sources of truth

Create small, independently testable USWDS experiments with clear human-readable evidence. Read `README.md`, `ACCESSIBILITY.md`, `GOVERNANCE.md`, `AI_DISCLOSURE.md`, `data/registry.json`, `data/sources.lock.json`, and the relevant upstream issue and component accessibility guidance before proposing a change.

`data/registry.json` is the canonical registry for components, experiments, categories, statuses, scenarios, demos, documents, and review state. `data/sources.lock.json` is the canonical baseline provenance. Do not create a second registry in an experiment folder.

## Non-negotiable constraints

- Never present local experimental CSS as official USWDS or OGDS. The baseline is the pinned npm distribution of USWDS v3.14.0; the right pane adds separately authored experimental styles.
- Do not copy GPL-licensed Drupal Core Lab source into this MIT project. Its viewer, coverage, and report designs may inform independent implementation.
- Do not vendor OGDS Elements code without a documented license review. Its research link is not a functioning adapter.
- Do not post to upstream or push a branch automatically. Draft changes and cite exact relevant issues and comments. Never open or comment on an upstream issue or PR without explicit human authorization.
- Every lab route must appear in the generated `dist/data/routes.json`, have a route test and evidence coverage, and be reachable from the registry or a documented static page. Every component and experiment must have a registry entry. Every lab route must also have a `tests/mcp/scenarios.json` entry. Documentation under `docs/**` and generated evidence under `evidence/**` are not lab routes; they are documentation artifacts and are validated separately.
- `reports/latest/*` and `reports/runs/*` are generated observations. A maintainer decides whether findings are valid; do not mark them reviewed or replace a human decision.
- Never erase failing runs or silently weaken assertions. Log genuine build/test gaps; do not fabricate transcript output.
- Keep direct dependency versions pinned. Commit a generated `package-lock.json` after a real `npm install` and use `npm ci` once that file exists.
- A successful build, axe scan, or Guidepup transcript is not WCAG conformance or human approval.
- Reuse styling and logic instead of duplicating patterns. Keep HTML headings and navigation semantic; use relative asset URLs for GitHub Pages subpaths.

## Local workflow

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:browser:chromium
npm run evidence
npm run build:strict
npm run validate
```

The Playwright test server uses port 4181 (`LAB_TEST_PORT` overrides). Do not reuse an unverified server on that port; the config fails rather than silently testing another app. In a sandbox where bundled Chromium cannot be installed, use `LAB_BROWSER_CHANNEL=chrome` for tests and `PLAYWRIGHT_CHANNEL=chrome` for evidence, and record the substitution.

A build without installed assets is an offline illustration only and cannot be used as upstream comparison evidence. Browser and Guidepup runs require installed npm dependencies. `playwright` MCP is project-scoped in `.mcp.json` at version `0.0.86` for exploratory review, but its output is not a substitute for deterministic test assertions. MCP exploration must be recorded as executed or not executed; creating a scenario file is not evidence that it ran.

## Evidence rules

- `npm run evidence` must clear `reports/latest`, write a `running` manifest first, finalize it on every exit path (including a top-level failure), and publish only the current run.
- Each route needs an initial transcript; disclosures need expanded/collapsed states; forms need invalid/valid states; RTL and dark states are captured where relevant.
- Every transcript must label the method: Guidepup virtual screen reader over a DOM snapshot, not a real VoiceOver/NVDA/JAWS test.
- A missing transcript, empty capture, or failed page is a coverage gap, never a pass.
- Axe counts are recorded; a zero count is not conformance.
- Screenshots support human inspection; they are not a design verdict.

## Evidence checklist for proposed code

Document source links and exact versions, problem, reproduction steps, expected outcome, observed baseline/experiment behavior, keyboard steps, Guidepup transcript references, inaccessible states, browser/viewport/preferences, human review pending, and what was not tested. Explain exactly what code changed and why. Every PR has an AI-use disclosure if applicable.

## New experiments

Use `npm run experiment:new -- --slug <slug> ...`. It creates a draft marked **no verified evidence**, updates the registry and source lock, and does not fabricate test results. Fill in the README, implementation, test plan, and decision record; add fixtures and deterministic tests; then collect evidence and request human review.
