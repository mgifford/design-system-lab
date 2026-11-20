# Instructions for AI coding agents

## Mission and sources of truth

Create small, independently testable USWDS experiments with clear human-readable evidence. Read `README.md`, `ACCESSIBILITY.md`, `GOVERNANCE.md`, `data/registry.json`, and the relevant upstream issue and component accessibility guidance before proposing a change.

## Non-negotiable constraints

- Never present local experimental CSS as official USWDS or OGDS. Baseline = pinned npm distribution from USWDS v3.14.0. The right pane adds separately authored experimental styles.
- Do not copy GPL-licensed Drupal Core Lab source into this MIT project. Its viewer, coverage and report designs may inform independent implementation.
- Do not vendor OGDS Elements code without a documented license review. Its research link is not a functioning adapter.
- Do not post to upstream or push a branch automatically. Draft changes and cite exact relevant issues and comments.
- Every new component or public fixture must appear in `data/registry.json`, have reproduction steps and a relevant Playwright test, and be included in `data/routes.json` generated during build. Every published page must receive a Guidepup transcript when the evidence collector runs and a matching `tests/mcp/scenarios.json` entry.
- `reports/latest/*.md` are generated *observations*. A maintainer decides whether findings are valid; do not mark them reviewed or replace a human decision.
- Never erase failing runs or silently weaken assertions. Log genuine build/test gaps; do not fabricate transcript output.
- Keep direct dependency versions pinned. Commit a generated npm lockfile after a real `npm install` and use `npm ci` once that file exists.
- Reuse styling and logic instead of duplicating patterns. Keep HTML headings and navigation semantic; use relative asset URLs for GitHub Pages subpaths.

## Local workflow

```sh
npm install
npm run build:strict
npm run test:unit
npx playwright install chromium
npx playwright test --project=chromium
npm run evidence
npm run build:strict
npm run validate
```

A build without installed assets is an offline illustration only and cannot be used as upstream comparison evidence. Browser and Guidepup runs require installed npm dependencies. `playwright` MCP is project-scoped in `.mcp.json` for exploratory review, but its output is not a substitute for deterministic test assertions.

## Evidence checklist for proposed code

Document source links and exact versions, problem, reproduction steps, expected outcome, observed baseline/experiment behavior, keyboard steps, Guidepup transcript references, inaccessible states, browser/viewport/preferences, human review pending, and what was not tested. Explain exactly what code changed and why. Every PR has an AI-use disclosure if applicable.
