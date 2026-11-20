# Evidence

## What the collector does

`npm run evidence` refuses to run against an offline build. It starts the built site on a separate port, loads every route in `dist/data/routes.json`, and records:

- route, page title, and HTTP status;
- browser version and viewport;
- git revision, baseline release, and run id;
- uncaught page errors;
- Guidepup virtual transcripts for initial and state-specific conditions;
- an ARIA inventory;
- screenshots for light, dark, and selected states;
- axe results for the initial route state (state-specific axe is not collected);
- a pass/fail collection result for each route.

## Files

```text
reports/latest/
  MANIFEST.json
  SUMMARY.md
  COVERAGE.md
  <route>.md
  guidepup/<route>/<state>.md
  screenshots/<route>-<state>.png
reports/runs/<run-id>/
  ...immutable copy of the run...
```

The build publishes `reports/latest` under `dist/evidence/latest` and renders each Markdown file as semantic HTML. The Evidence page links to the summary, coverage matrix, per-route reports, and screenshots.

## Immutability and stale evidence

- `reports/latest` is cleared at the start of every run.
- `MANIFEST.json` is written in a `running` state before collection and finalized on every exit path, including a top-level failure.
- A crashed run leaves a failed manifest, not a previous successful one.
- `dist/evidence` is deleted on every build and rebuilt only from the current `latest` run.
- Historical runs under `reports/runs` are preserved and are not rewritten.

## Provenance

The manifest records the baseline release, USWDS version, git revision, browser, timestamp, and run id. `data/sources.lock.json` records the release commit, package-lock hash, and USWDS asset hashes. A build with mismatched hashes fails in strict mode.

## Method labels

Every transcript says:

> Guidepup virtual screen reader over a DOM snapshot. Not a real VoiceOver, NVDA, or JAWS test.

A transcript difference is a signal to investigate. It may reflect a real semantic difference, a simulator limitation, or a bug. It is never automatically a regression or an approval.

## Human review

Automated evidence is an observation. The decision log (`docs/EXPERIMENT-DECISIONS.md`) is the approval surface. A reviewer must read the transcripts, inspect the DOM and focus behavior, evaluate forced colors and preferences, and record limitations or conditions in one row. The evidence details stay in the run. AI may draft the material but cannot make the decision.

## Retention

`reports/latest` and `reports/runs` are gitignored. CI uploads them as artifacts. Large screenshots are not committed; concise Markdown and selected screenshots can be published from the build. Links to `evidence/latest/...` are stable only for the current build; pinned historical claims must cite the run id and an artifact.

## Not tested

- Real screen readers and speech input.
- A real Windows High Contrast session.
- Every browser/OS/zoom/text-spacing combination.
- Adoption, maintenance cost, or upstream compatibility beyond the recorded release.
- OGDS custom-element shadow DOM is not traversed by Guidepup over jsdom; those transcripts cover slotted light-DOM text only. Browser tests, axe, and screenshots are the primary evidence for OGDS routes.
