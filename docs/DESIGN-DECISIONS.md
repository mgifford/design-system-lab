# Design decisions

> **Scope:** this file records architecture and design decisions for the lab. Experiment approval decisions live in [EXPERIMENT-DECISIONS.md](EXPERIMENT-DECISIONS.md). Do not fill a form per experiment; that duplicated evidence and was too much work.

## The baseline is immutable

A USWDS release is evidence, not a moving target. `data/sources.lock.json` pins the release tag, commit, package version, package-lock hash, and distributed CSS/JS hashes. A newer release is reported, never promoted automatically. Promotion requires a reviewed change and a recorded decision.

## The registry is canonical

Components, experiments, types, statuses, scenarios, and documentation paths live in `data/registry.json`. Generated pages, fixtures, the evaluation workspace, MCP scenarios, and validation derive from it. Per-experiment `experiment.json` files were rejected because they would duplicate registry metadata.

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

## Evaluator preferences are separate from fixture conditions

The evaluation tool is itself an interface that must meet accessibility needs. Its appearance controls write only to `uswds-lab-prefs` and affect the shell. Fixture conditions travel as validated URL parameters to the components under test. Fixtures read stored lab preferences only with an explicit `?prefs=1` (the preferences-panel preview), so a reviewer's tool settings cannot become an accidental test condition. Applying the same conditions to both panes is the controlled comparison.

## CSS approximations are not browser emulation

Live fixture appearance, motion, text size, spacing, and contrast are authored CSS conditions. Forced colours and increased contrast are generated as Playwright browser-emulation captures at a fixed 900 × 900 viewport. The interface labels the distinction and locks fixture controls in captured modes. It never calls a CSS class operating-system emulation.

## Component states live in the registry

Each component declares its evaluation states in `data/registry.json`. Fixtures mark the same ids with `data-state` wrappers or, for components whose state is an open/closed configuration, a `data-states` map applied after the USWDS script initializes. Validation fails if a declared state is not reproducible. Alert, Accordion, and Banner have complete state models; Form and Radio validation still expose an initial state. A state can declare `interaction: "activate"` so evidence collection and capture know how to reach it. This avoids a second state registry in test code.

## Side-by-side shares the available width

Two iframes cannot both be 1280 CSS pixels wide on a laptop. Side-by-side therefore defaults to splitting the available container width and reflowing each fixture at its rendered width, with a keyboard/pointer slider for the baseline/experiment share. This is a real viewport, not a scaled screenshot. Reviewers who need the fixed viewport choose **Fit** (scaled, with a percentage badge) or **Actual** (fixed width with an explicit overflow warning and a one-click switch to split). The UI must say which of these is happening; never present a scaled or clipped pane as if it were fully visible at the selected width.

## Reveal and onion are visual only

The reveal divider and onion overlay set both iframes `inert` and `aria-hidden` so focus cannot enter a covered or clipped pane. Users are directed to side-by-side mode or the independent pages for keyboard and assistive-technology testing. The viewer does not mirror input.

## Pixel difference is a visual measurement

Difference mode compares matched Playwright captures in the browser and reports changed pixels, a percentage, and a bounding box. It explicitly does not report an accessibility score. Antialiasing, font rendering, and encoding affect the count. A missing capture pair is a coverage gap.

## Performance budgets are narrow and observable

The collector records transfer bytes, request counts, DOM size, and a small timing sample for each fixture pair. Byte, request, and DOM limits are hard checks; timing thresholds are warnings because local runs are noisy. The lab does not compute an aggregate performance score, use Lighthouse’s accessibility score, or claim field Web Vitals or energy impact. Lighthouse CI and sitespeed.io are deferred until there is a specific question they answer better than the native sample.

## Manual results are local and human-owned

Manual test definitions live in `data/manual-tests.json` without results. The evaluation workspace stores a reviewer's records in their browser and exports JSON or Markdown. Published evidence records zero completed manual tests. No result is auto-submitted, auto-committed, or inferred from Guidepup simulation.

## Evidence is honest, not flattering

The collector records failures, missing states, and axe findings. `validate` fails if an evidence run has failed pages (unless explicitly allowed for local inspection). A green build is never an approval.

## No automatic upstream action

The lab may prepare a contribution package, but it never opens, comments on, or submits an upstream issue or pull request without explicit human authorization.

## Static hosting first

The site is static HTML, CSS, and small modules. GitHub Pages is the deployment target; no database, server authentication, proprietary API, or cloud AI service is required.

## The landing demo uses a licensed OGDS hybrid

`demo.html` compares USWDS 3.14.0 with the same content rendered through a USWDS + OGDS Elements `1.0.0-beta.2` hybrid. OGDS components are used only where the beta package exports a built module: banner, header/primary navigation, and accordion. The alert remains USWDS because beta.2 does not export a built alert module; hero, cards, search, and footer remain USWDS. The left pane never loads OGDS.

Public-domain permission is recorded in [OGDS-PERMISSION.md](OGDS-PERMISSION.md). The hybrid is labelled as a hybrid, not a full replacement, and is not a conformance or endorsement claim. OGDS components use shadow DOM; Guidepup transcripts cover slotted light-DOM text only, so browser tests, axe observations, and screenshots are the primary evidence for this page.

## One content model, two renderers

The landing and forms comparisons are generated from `content/pages/*.json`. `renderers/uswds.mjs` and `renderers/ogds.mjs` render the same blocks; `data/coverage.json` decides whether a block has an OGDS alternate or falls back to USWDS. The renderers cannot silently drop an uncovered block: the fallback is explicit and appears in the page coverage table.

Both generated pages carry the same `data-content-hash`. Tests assert the hash and content parity, and the forms page uses the same USWDS controls on both sides. This keeps consistency at the content/behaviour contract level while allowing the OGDS markup to differ.

`content/sandbox.lock.json` pins selected content from `mgifford/uswds-sandbox` at commit `26d5a939476512ca08ce9a8f5b4f757a5df06198`. The lab adapts content; it does not fork or run the sandbox build.

