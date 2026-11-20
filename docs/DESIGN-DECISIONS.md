# Design decisions

> **Scope:** this file records architecture and design decisions for the lab. Experiment approval decisions live in [EXPERIMENT-DECISIONS.md](EXPERIMENT-DECISIONS.md). Do not fill a form per experiment; that duplicated evidence and was too much work.

## The baseline is immutable

A USWDS release is evidence, not a moving target. `data/sources.lock.json` pins the release tag, commit, package version, package-lock hash, and distributed CSS/JS hashes. A newer release is reported, never promoted automatically. Promotion requires a reviewed change and a recorded decision.

## The registry is canonical

Components, experiments, types, statuses, scenarios, and documentation paths live in `data/registry.json`. Generated pages, fixtures, the comparison viewer, MCP scenarios, and validation derive from it. Per-experiment `experiment.json` files were rejected because they would duplicate registry metadata.

## Baseline and experiment are separate

Baseline fixtures load only the official distribution plus a small fixture stylesheet. Experimental fixtures also load `experiment.css`. The two panes share content and interaction so a visual difference is attributable to the proposal, not unrelated markup.

## No fabricated baseline

A new-component proposal (the preferences panel) states that stable USWDS has no equivalent. It does not render an invented “before” component. A missing component is a capability gap, not an accessibility failure.

## Markdown is rendered at build time

Evidence and experiment documents are Markdown. `marked` renders them to semantic HTML with tables and headings. Raw `<` is escaped before parsing, so a transcript cannot inject HTML; link schemes are restricted. No client-side Markdown renderer is shipped.

## Theme tokens are small and measured

The lab uses semantic custom properties, not a claim that a short `--fx-*` list completes USWDS dark mode. Focus contrast is measured on the rendered surface. The dark theme explicitly themes the upstream white `.usa-radio`/`.usa-checkbox` container and the visible narrow-screen banner prompt. Dark mode is separate from `prefers-contrast`, forced colors, and reduced motion.

## Native controls over custom widgets

The preferences panel uses radios, selects, a fieldset, and a status region. The radio-validation experiment does not add `aria-required` or `role="radiogroup"` to native controls. No third-party overlay is used.

## Onion mode is visual only

The onion overlay sets both iframes `inert` and `aria-hidden` so focus cannot enter a covered pane. Users are directed to the independent pages for keyboard and assistive-technology testing. The viewer does not mirror input.

## Evidence is honest, not flattering

The collector records failures, missing states, and axe findings. `validate` fails if an evidence run has failed pages (unless explicitly allowed for local inspection). A green build is never an approval.

## No automatic upstream action

The lab may prepare a contribution package, but it never opens, comments on, or submits an upstream issue or pull request without explicit human authorization.

## Static hosting first

The site is static HTML, CSS, and small modules. GitHub Pages is the deployment target; no database, server authentication, proprietary API, or cloud AI service is required.

## The landing demo uses a labelled stand-in, not OGDS

`demo.html` compares USWDS 3.14.0 with an original concept stylesheet applied to identical content. The concept pane is explicitly labelled “not OGDS” and is not evidence about OGDS. It exists to validate the comparison workflow while OGDS licensing and permission are unresolved. When the licensed OGDS hybrid is available, only the right renderer changes; the left remains USWDS 3.14.0 and the content stays shared.
