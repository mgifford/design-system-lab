# Playwright MCP exploration procedures

The project-scoped `.mcp.json` configures `@playwright/mcp` at version **0.0.86** for capable coding agents. The package is pinned in `devDependencies` as well. This is a **separate exploratory interface**, not CI automation. Deterministic regression assertions live in `tests/browser/site.spec.mjs`.

## Execution status

**No MCP exploration has been recorded as executed for this build.** The scenario inventory is complete (27 routes), but a scenario file is not evidence that an agent ran it. When an exploration is performed, add a dated note to the relevant experiment's evidence or a `reports/` note with the tool version, route, browser, observations, and what was not verified. Do not claim execution from the presence of `tests/mcp/scenarios.json`.

## Setup

1. Run `npm ci`, `npm run build:strict`, and `npm run serve` locally.
2. Approve the project-scoped Playwright MCP server when the coding assistant proposes it.
3. Use `http://127.0.0.1:4173/` as the origin. Do not navigate to real government account pages or type secrets into the pilot.
4. Follow the scenarios in `tests/mcp/scenarios.json`. They cover every published lab route, including both variants of every component and every generated component/experiment page.
5. `npm run mcp:check` fails if the scenario inventory drifts from `dist/data/routes.json`.

## Investigation steps

For each route:

1. Open the baseline fixture or page and record the exact source version.
2. Inspect the rendered DOM, headings, landmarks, and relevant interactive elements.
3. Perform realistic keyboard interactions. Use browser-level input, not synthetic DOM events.
4. Record accessibility-relevant observations: names, roles, states, focus, and announcements.
5. Repeat the same scenario on the experimental version.
6. Compare results and identify potential problems and uncertainties.
7. Save human-readable notes; do not describe a single observation as a confirmed regression.
8. Convert a reproducible finding into a deterministic Playwright assertion.

## Boundaries

- MCP output is not a substitute for deterministic tests, real assistive technology, or human review.
- Do not allow an exploratory agent to open, comment on, or submit upstream GitHub issues or pull requests.
- If a tool cannot expose a feature, record `not tested` rather than guessing.
- Before publishing evidence that depends on MCP, record the actual server version and the execution date.
