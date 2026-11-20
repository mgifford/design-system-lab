# Playwright MCP exploration procedures

The project-scoped `.mcp.json` configures `@playwright/mcp` for use by capable coding agents. This is a **separate exploratory interface**, not CI automation. The executable regression assertions live in `tests/browser/site.spec.mjs`.

## Setup

1. Run `npm install`, `npm run build:strict`, and `npm run serve` locally.
2. Launch a coding assistant that supports project MCP configuration and explicitly approve the Playwright MCP server it proposes to run.
3. Use `http://127.0.0.1:4173/` as the test origin. Do not navigate to real government account pages or type secrets into the pilot.
4. Follow the scenarios in `tests/mcp/scenarios.json`. They cover **each published route**, including both variants of every component. The `validate` script fails if the scenario inventory drifts from the built page list.
5. Record exact route, date, browser, viewport, theme, source version, observed results and anything not verified. Preserve accessibility snapshots and screenshots only where they clarify a finding.
6. Convert stable behavior expectations into deterministic Playwright assertions and collect Guidepup transcripts through `npm run evidence`. Do not treat exploratory MCP output as proof of conformance.

## Assistant instructions for each route

- Navigate directly to the fixture's stable route.
- Obtain and inspect the browser accessibility snapshot. Confirm the page and component are the requested ones.
- Follow all listed exploration steps, using browser-level keyboard inputs rather than dispatching synthetic DOM events.
- Record unexpected differences between baseline and experiment without describing them as bugs until reproduced.
- Re-run at narrow viewport and with user preferences where relevant. If the MCP tool does not expose a feature, record `not tested` rather than guessing.
- If a script or browser cannot complete the steps, record the blocker and link a human-readable `EVIDENCE.md` draft.

## Versioning and scope

MCP agent invocation is not locked to a precise server build in the pilot's `.mcp.json`. Before producing evidence that will be published, record the actual MCP server version. Pin it once a known-good version has been established locally. The Playwright browser test package itself is pinned in `package.json` and should be lockfile-pinned on first successful install.
