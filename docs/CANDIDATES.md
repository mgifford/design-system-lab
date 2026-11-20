# Research candidates and decisions to revisit

**Curated on 2026-11-20, using GitHub issue status, body, and maintainer comments.** This is not an exhaustive issue export or an automatically ranked roadmap. Read the original threads again before making an upstream proposal. The linked issues may change after this snapshot.

## Flagship: theme and preference support

- [#5069 Better Personalization Support](https://github.com/uswds/uswds/issues/5069) was opened in 2022 and closed as not planned in May 2026. A maintainer comment points to limited capacity and de-prioritization, not an experimental finding that personalization is undesirable. Candidate experiment: automatic light/dark preference, an explicit accessible override, preference persistence, contrast variants and implementation guidance.
- [#4644 CSS custom properties](https://github.com/uswds/uswds/issues/4644) was closed as not planned after investigation, but discussion continued at [#6973](https://github.com/uswds/uswds/discussions/6973), citing draft [PR #6498](https://github.com/uswds/uswds/pull/6498). The appropriate experiment is an **optional** token layer that leaves Sass users' default output unchanged.
- [#4407 prefers-contrast](https://github.com/uswds/uswds/issues/4407) was closed not planned. This must be considered separately from dark mode. Dark surfaces are not equivalent to high-contrast preferences.
- [#4577 Accordion icon color](https://github.com/uswds/uswds/issues/4577) was closed not planned. Earlier maintainer comments explain why an apparent CSS mask solution may clip a header. A test must evaluate the entire component rather than a single icon screenshot.

## Multilingual layout and resilient behavior

- [#5336 Logical properties and multilingual layouts](https://github.com/uswds/uswds/issues/5336) remains open. Maintainers requested a concrete RTL example and LTR compatibility checks. [#6030](https://github.com/uswds/uswds/issues/6030) was consolidated into that main issue, rather than resolved as a full feature.
- [#5817 Accordion content during loading](https://github.com/uswds/uswds/issues/5817) remains open with unmerged [PR #5826](https://github.com/uswds/uswds/pull/5826). Maintainers explicitly warn that a flash may be preferable to inaccessible content when scripts fail; test both conditions.
- [#6068 Checkbox/radio position and Voice Control](https://github.com/uswds/uswds/issues/6068) remains open. The native radio validation case [#6080](https://github.com/uswds/uswds/issues/6080) was consolidated into it, not fixed. Before implementing, reproduce against v3.14.0 and evaluate in relevant browsers.

## Regression examples, not undelivered work

- [#5256 Reduced motion](https://github.com/uswds/uswds/issues/5256) was completed, so it is a regression requirement, not a newly requested feature.
- [#3449 Dark-mode favicon](https://github.com/uswds/uswds/issues/3449) was completed through [PR #6918](https://github.com/uswds/uswds/pull/6918). It is an example of a narrow adaptation, not proof that a full dark-mode system exists.
- [#5861 Accordion contrast false positives](https://github.com/uswds/uswds/issues/5861) was closed not planned. Investigate with independent scanner results before treating the report as an HTML defect or tool false positive.

## Candidate acceptance criteria

For every selected feature, a reviewer should have the upstream issue rationale, exact upstream package/commit, a minimal implementation, deterministic Playwright assertions, Guidepup virtual transcript(s), missing-coverage matrix, before/after explanation, accessibility guidance for implementers, and a signed decision on whether to submit upstream.
