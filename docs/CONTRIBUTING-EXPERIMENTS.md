# Contributing an experiment

## From an issue to a proposal

1. Choose a documented user need from `data/issues.json` or a new, cited upstream issue.
2. Read the current issue state, comments, linked PRs, and successor discussions. Do not assume a closed issue means the need was rejected.
3. Pick a category: component improvement, new component, cross-component capability, or alternative implementation.
4. Write a problem statement, scope, and acceptance criteria. State what the proposal does **not** cover.
5. Scaffold the files:

```bash
npm run experiment:new -- --slug my-experiment --title "My experiment" --type alternative-implementation --components accordion
```

6. Implement the smallest fixture or page that demonstrates the idea. Keep the baseline pane unchanged.
7. Add deterministic Playwright tests. Use real key presses and native browser behavior.
8. Run the build and evidence collector:

```bash
npm run check
npm run test:browser
npm run evidence
npm run build:strict
npm run validate
```

9. Replace the draft language in the experiment documents with what was actually tested. Link the generated reports.
10. Add one row to `docs/EXPERIMENT-DECISIONS.md` when a human is ready to decide. AI-generated material cannot mark itself approved.

## Required files

- `README.md` — why it exists, baseline, proposal, scope, evidence status, limitations.
- `IMPLEMENTATION.md` — markup, CSS/JS, accessibility behavior, keyboard, preferences, known gaps.
- `TEST-PLAN.md` — deterministic checks, states, browsers, evidence to collect.
- A row in `docs/EXPERIMENT-DECISIONS.md` — decision, date, reviewer, one-sentence rationale, conditions, and upstream authorization. Do not create a per-experiment decision form.

The registry entry must include the id, title, category, status, summary, components, related issues, scenarios, demo route, document paths, review status, and AI-assistance disclosure.

## Evaluation support

An experiment that changes a component should be evaluable, not only viewable.

1. Declare the component's evaluation states in `data/registry.json` (`states`) and mark the same ids with `data-state` in `scripts/components.mjs`. Validation fails when a declared state has no fixture marker.
2. If a state needs an action to reach it, set `"interaction": "activate"` and make the action local-only. Evidence collection and screenshot capture will perform it.
3. Add component-specific human tests to `data/manual-tests.json`. Cite the official USWDS accessibility tests and the WCAG requirement. Never add a result to the definition file.
4. Add deterministic Playwright coverage for the state, the keyboard path, and any visible state change. Do not treat a Guidepup transcript as real assistive-technology testing.
5. Run `npm run evidence` so state-level axe, matched captures, and fixture performance evidence are generated, then inspect `compare.html` for the component and state. Review any hard performance budget failure in `data/performance-budgets.json`; do not raise a ceiling just to make a change pass.
6. Update the evaluation guide only if the shared model changes; link to it instead of duplicating the instructions.

A component with only an initial state is explicitly marked as not yet modelled. Do not invent states that the fixture cannot reproduce.

## Lifecycle

`proposed` → `investigating` → `prototype` → `evidence-collected` → `ready-for-review` → `changes-requested` or `accepted` → `submitted-upstream` → `adopted-upstream`, or `deferred` / `archived`.

Do not skip human review. An experiment may end as a rejected proposal or useful documentation; that is a valid outcome.

## Rules

- Do not copy implementation code from a GPL project.
- Do not add a dependency without a documented reason and a pinned version.
- Do not weaken a failing assertion to make a build pass.
- Do not label an offline illustration as USWDS evidence.
- Do not open, comment on, or submit anything upstream without explicit maintainer authorization.
- Disclose meaningful AI assistance in the registry and the decision record.
