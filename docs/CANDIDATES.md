# Research candidates and decisions to revisit

**Curated on 2026-11-20, using GitHub issue status, body, maintainer comments, and the lab registry.** This is not an exhaustive issue export or an automatically ranked roadmap. Read the original threads again before making an upstream proposal. The linked issues may change after this snapshot.

## Implemented in the lab

- **#5069 Personalization** → the [user preferences panel](../experiments/preferences-panel/README.md) and the dark-mode experiment. Closed as not planned in May 2026; a maintainer comment points to limited capacity and de-prioritization, not an experimental finding that personalization is undesirable.
- **#4644 CSS custom properties** → the dark-mode token architecture. Closed as not planned in September 2026; discussion continued at [#6973](https://github.com/uswds/uswds/discussions/6973). The lab uses a separate `--fx-*` layer rather than claiming an upstream token contract.
- **#4577 Accordion icon color** → recorded in the dark-mode work. Closed not planned; earlier maintainer comments explain why a CSS mask may clip a header. A test must evaluate the whole component, not a single icon screenshot.
- **#4407 prefers-contrast** → kept separate from dark mode. Closed not planned. The lab records contrast preference as a distinct requirement and does not pretend that a dark theme is a high-contrast mode.
- **#5336 Logical properties** → the [RTL experiment](../experiments/rtl-logical-properties/README.md). Remains open. Maintainers requested a concrete RTL example and LTR compatibility checks. [#6030](https://github.com/uswds/uswds/issues/6030) was consolidated into #5336.
- **#6068 Checkbox/radio Voice Control** → the [radio-validation experiment](../experiments/radio-validation/README.md). Remains open. [#6080](https://github.com/uswds/uswds/issues/6080) was consolidated into #6068 rather than simply fixed.

## Deferred or future candidates

- **#5817 Accordion loading** — remains open with unmerged [PR #5826](https://github.com/uswds/uswds/pull/5826). Maintainers warn that a flash may be preferable to inaccessible content when scripts fail. A future experiment should compare slow, failed, and disabled JavaScript. The current no-JavaScript fallback is documented but the “JS enabled, USWDS script failed” condition is not yet tested.
- **#4143 Responsive table classes** — closed not planned in April 2026. No lab fixture yet. Compare stacked and scrollable strategies before proposing a pattern.
- **#4863 Multiselect combobox** — closed not planned in April 2026. Deferred; no prototype yet.
- **#4552 Color palettes** — closed not planned in April 2026. Treat as guidance research, not a delivered palette system.
- **#5256 Reduced motion** — completed. Use as a regression requirement, not as missing functionality.
- **#3449 Dark-mode favicon** — completed through [PR #6918](https://github.com/uswds/uswds/pull/6918). A narrow adaptation, not proof that a full dark-mode system exists.

## Candidate acceptance criteria

For every selected feature, a reviewer should have the upstream issue rationale, exact upstream package/commit, a minimal implementation, deterministic Playwright assertions, Guidepup virtual transcript(s), a missing-coverage matrix, a before/after explanation, accessibility guidance for implementers, and a signed decision on whether to submit upstream.

## Prioritization

Evaluate possible experiments by demonstrated user need, accessibility or usability impact, relevance to government services, implementation feasibility, ability to demonstrate a meaningful before/after comparison, availability of testing evidence, compatibility with USWDS architecture, maintenance cost, and potential for upstream adoption. Do not rank by reactions, and do not implement every historical request.
