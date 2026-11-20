# Contributing to the USWDS Futures Lab

The lab is an independent, MIT-licensed research project. It is not an official USWDS, GSA, or OGDS channel, and nothing here is an endorsement by those projects.

## Before you start

Read:

- [README.md](README.md)
- [ACCESSIBILITY.md](ACCESSIBILITY.md)
- [GOVERNANCE.md](GOVERNANCE.md)
- [AI_DISCLOSURE.md](AI_DISCLOSURE.md)
- [docs/CONTRIBUTING-EXPERIMENTS.md](docs/CONTRIBUTING-EXPERIMENTS.md)
- [docs/TESTING.md](docs/TESTING.md)
- [docs/EVIDENCE.md](docs/EVIDENCE.md)

## Setup

```bash
npm ci
npm run check
npm run test:browser:chromium
npm run evidence
npm run build:strict
npm run validate
```

`npm ci` requires the committed `package-lock.json`. Browser and Guidepup runs require installed Playwright browsers (`npx playwright install chromium`). Chromium installation may fail in a restricted sandbox; record that as a blocked check rather than skipping it silently.

## What makes a good contribution

- A documented user need, with a real upstream issue or discussion and its current state.
- A small, reversible proposal that does not fork USWDS.
- A working demonstration with baseline and experiment clearly separated.
- Deterministic tests with real key presses and native browser behavior.
- Human-readable evidence, including failures and missing coverage.
- A recorded human decision before any claim of acceptance.

## What we will not accept

- Copying GPL implementation code into this MIT project.
- Vendorizing OGDS or USWDS Elements code without a license review.
- Unpinned dependencies, hidden test failures, or fabricated evidence.
- A claim that automated scans establish WCAG conformance.
- Automatic upstream comments, issues, or pull requests.
- A change that weakens the baseline or hides an experiment’s limitations.

## Pull request checks

The CI workflow runs unit tests, a strict build, browser tests, evidence collection, validation, and a route check. Pull requests upload test artifacts but never deploy to the public site. Deployment happens only from `main` after the same checks pass.

## AI assistance

Disclose meaningful AI assistance in `data/registry.json` (`aiAssistance`) and in the experiment’s `DECISION.md`. A human contributor remains responsible for correctness, licenses, accessibility claims, and review.

## Reporting problems

Open an issue in this repository with the component, route, exact source version, browser/OS, reproduction steps, expected and observed behavior, and any evidence links. Do not post sensitive security details publicly.
