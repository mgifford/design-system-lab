# Native dark-mode support

**Status: Prototype. Automated evidence may exist; human review is pending.**

**Category:** Cross-component capability  
**Baseline:** USWDS v3.14.0 (npm distribution)  
**Proposal:** A semantic token layer over the official component assets.

## Why this exists

USWDS issue [#5069](https://github.com/uswds/uswds/issues/5069) asked for personalization, including light/dark preferences, and was closed as not planned amid limited maintainer capacity. Issue [#4644](https://github.com/uswds/uswds/issues/4644) explored CSS custom properties and moved into a broader discussion. Issue [#4577](https://github.com/uswds/uswds/issues/4577) is a component-specific example: an accordion icon treatment that must be evaluated on the whole component, not a single screenshot. Issue [#4407](https://github.com/uswds/uswds/issues/4407) is a reminder that dark mode is not the same as a contrast preference.

The lab does not claim these issues were rejected on technical grounds. It tests one small, reversible approach.

## What stable USWDS provides

USWDS 3.14.0 ships a mature light theme and compile-time Sass settings. It does not ship a runtime dark theme, an explicit user override, or a documented set of semantic runtime tokens that cover the components in this lab. Many teams add their own overrides; those overrides are rarely tested across states, forced colors, and no-JavaScript conditions.

## What is proposed

`site/assets/experiment.css` adds a small semantic token layer (`--fx-*`) and selector overrides. It:

- follows `prefers-color-scheme: dark` when no explicit choice is stored;
- accepts an explicit `data-mode="light"` or `data-mode="dark"` override;
- themes the accordion, alert, banner, and form fixtures;
- keeps the official USWDS CSS and JavaScript in place;
- does not load any third-party dark-mode package.

The explicit preference is exposed through the [user preferences panel](../preferences-panel/README.md), not through a second control inside every component.

## What changed in the lab

Only the experimental pane changes. The baseline pane keeps the official assets and does not load `experiment.css`. The fixture markup is shared by both panes. The baseline still includes a small fixture stylesheet for page framing, which is labelled in the evidence.

## Evidence status

Automated evidence is collected by `npm run evidence` and published on the lab evidence page after a build. A successful collection is not a review. The decision is recorded in [the central decision log](https://github.com/mgifford/design-system-lab/blob/main/docs/EXPERIMENT-DECISIONS.md): **accepted as a lab experiment** on 2026-11-20, with the stated limitations.

## Known limitations

- Four components are covered, not all of USWDS. Header, footer, navigation, tables, cards, and complex form controls are not yet themed.
- The upstream alert icon is not recolored; the alert heading carries the meaning.
- The experiment relies on `!important` overrides for some states. That is a maintenance cost and a sign that the semantic token layer does not yet exist upstream.
- No real high-contrast OS session, screen reader, or government-service integration has been tested.
- Dark mode is not a claim of energy savings.
