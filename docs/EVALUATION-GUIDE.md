# Evaluation workspace guide

The evaluation workspace is the lab's main comparison surface. It is not a component showcase and not a visual-diff toy. It is designed to answer four questions:

1. **What changed** between pinned USWDS 3.14.0 and the experiment?
2. **Under which user preferences and environmental conditions** does the change matter?
3. **What evidence** demonstrates an improvement or a regression?
4. **What remains unknown** or requires a person to verify?

Open it at `compare.html`, or follow **Evaluate** in the primary navigation, the **Evaluate this component** button on a component page, or **Evaluate this experiment** on an experiment page.

Automated output in this workspace is observation. Nothing here establishes WCAG conformance, and a clean axe run is not approval.

## Interface map

| Area | What it does |
|---|---|
| Evaluation header | Component, experiment, pinned baseline, experiment status, source links, current state, known limits, official USWDS guidance and accessibility tests |
| What to evaluate | Component, experiment, declared component state, and comparison mode |
| Fixture conditions | Appearance, motion, contrast, text size, text spacing, direction, language, viewport width, and preview source |
| Evaluation tool display | Appearance, text size, motion, and contrast for the workspace itself. Stored separately from fixture conditions |
| Preview | Two independently addressable fixtures, or matched screenshots for browser-level conditions |
| Keyboard focus inspector | Reports the focused element's role, accessible name, and exposed state in each live pane |
| Evidence | Current run, per-route axe counts, state-level axe and regression classification, captured pairs, limitations |
| Manual tests | Component-specific human test instructions and local result recording |
| Save and share | Versioned URL plus browser-local named presets |

## Evaluator preferences are not fixture conditions

The interface has its own accessibility needs. A reviewer may need the tool in dark mode while testing the component in light mode, then compare both implementations under forced colours.

- **Evaluation tool display** changes this page only. It uses the same `uswds-lab-prefs` storage as the site preferences panel. It has its own reset control.
- **Reset fixture conditions** restores the default appearance, motion, contrast, text, spacing, direction, language, width, preview source, and comparison mode while keeping the selected component, experiment, and state.
- **Default preset** performs the same reset; “forced colours”, “dark”, “reduced motion”, and the other preset buttons apply one testing configuration without pretending to be a substitute for testing with people.
- **Fixture conditions** change the components under test. They are passed as URL parameters to each fixture iframe.
- Fixtures ignore stored lab preferences unless they are opened with `?prefs=1`. Only the preferences-panel preview uses that explicit opt-in. This prevents a reviewer's tool setting from silently becoming a test condition.
- Applying the same fixture conditions to both panes is the controlled before/after comparison. Independent pane conditions are not evidence of a controlled comparison.

## Preference coverage and honest limits

| Condition | Live iframe | Captured screenshot | What it actually is |
|---|---|---|---|
| System/light/dark appearance | Yes | Light and dark | Fixture CSS follows `prefers-color-scheme` or an explicit `data-mode`; the baseline has no theme layer, so it stays unchanged |
| Forced colours | No | Yes, Playwright `forcedColors: active` | Browser emulation, not Windows High Contrast Mode on a real device |
| Increased contrast | CSS approximation only | Yes, Playwright `prefers-contrast: more` | The live `contrast=more` control is authored fixture CSS, not browser preference emulation |
| Reduced motion | CSS fixture override | Not captured | A CSS override in the fixture; the evaluation shell is unaffected |
| 200% text | CSS root scale | Not captured | Not browser zoom. Test 200% and 400% browser zoom separately |
| WCAG text spacing | CSS preset | Not captured | Authored values, not a user stylesheet |
| Narrow viewport | 320, 390, 768, 1280, custom | Fixed 900 px captures | Captures are fixed at 900 × 900 and are not a substitute for live reflow testing |
| RTL / Arabic | Yes | Not captured | Direction-only simulation plus one Arabic content sample; not a native-language review |
| Orientation | Width only | No | The iframe height is fixed for comparison; orientation is not a separate captured condition |
| JavaScript disabled | Direct fixture only | No | The workspace requires JavaScript. Static fixture links and explanations remain available |

Captured screenshots use a fixed matrix: **900 × 900 CSS pixels, device scale factor 1, default text size, LTR, default spacing, no reduced motion**. Only the listed browser condition changes. The interface labels this limitation and locks fixture controls in captured modes.

Do not describe a CSS approximation as operating-system emulation. Do not mark a real high-contrast or zoom test complete from a capture.

## Comparison modes

- **Side by side** — live iframes with matched width, independent links, synchronized scrolling, and the focus inspector. Keyboard input is not mirrored between panes.
- **Reveal slider** — a keyboard-operable range clips one pane over the other. Visual only: both frames are removed from keyboard order. Use side-by-side mode or the independent links to interact.
- **Onion skin** — the experiment layer fades over the baseline. Visual only, with the same keyboard caveat.
- **Pixel difference** — matched Playwright captures are decoded in the browser and compared channel by channel. The result reports changed pixels, a percentage, and a bounding box. It never reports an accessibility score. Antialiasing, font rendering, and encoding can change the count.

Pixel difference needs a matched capture pair for the selected state and condition. If the current evidence run has no pair, the workspace says so and treats it as a coverage gap.

## Finding experiments

The experiments index records each experiment's declared user preferences, accessibility concerns, automated fixture coverage, and manual-test definition count. It filters by component category, status, user preference, automated coverage, concern tag, and whether manual definitions exist. Having screenshots or a complete fixture run does not mean human review is complete.

## Component states

States are declared in `data/registry.json` on each component. Alert is the first complete state model: informational, success, warning, error, emergency, no heading, link, long content, Arabic, dynamically inserted, dynamically updated, and multiple.

Each state is:

- declared once in the registry;
- marked in the fixture with `data-state="<id>"`;
- selectable in the workspace and reproducible with `?state=<id>`;
- scanned by axe during evidence collection after any required activation, under the default light fixture condition;
- captured for baseline and experiment where the capture matrix applies.

A state without fixture markup is a validation error. Screenshots of one state are never evidence for another state.

## Reproducible URLs

Every change updates the address bar. The schema is versioned and validated against fixed lists.

```text
compare.html?v=1&component=alert&experiment=dark-mode&state=warning
  &view=reveal&theme=dark&direction=ltr&language=en&width=390
  &motion=reduce&contrast=more&textSize=200&spacing=wcag
  &render=live&capture=light
```

| Parameter | Values | Default |
|---|---|---|
| `v` | `1` | `1` |
| `component` | Registered component slug | First component |
| `experiment` | Experiment registered for that component | First matching experiment |
| `state` | State declared for that component | First state |
| `view` | `split`, `reveal`, `onion`, `difference` | `split` |
| `theme` | `system`, `light`, `dark` | `system` |
| `direction` | `ltr`, `rtl` | `ltr` |
| `language` | `en`, `ar` | `en` |
| `width` | Integer 240–1920 | `1280` |
| `motion` | `system`, `reduce` | `system` |
| `contrast` | `normal`, `more` | `normal` |
| `textSize` | `default`, `large`, `x-large`, `200` | `default` |
| `spacing` | `default`, `wcag` | `default` |
| `render` | `live`, `captured` | `live` |
| `capture` | `light`, `dark`, `forced-colors`, `contrast-more` | `light` |

Invalid values are ignored, replaced with a safe default, and reported in the interface. The URL never carries script, HTML, or arbitrary CSS. Values are not interpolated into markup without escaping.

The URL can reproduce the configuration, not the browser engine. It cannot enable real `forced-colors` rendering in a live iframe; that requires the captured condition or a local Playwright session.

## Reading the evidence

The evidence section shows:

- run id, date, source version, git revision, and browser;
- baseline and experiment collection status and initial-state axe counts;
- state-level axe counts and a classification of **only baseline** (candidate fix), **only experiment** (introduced), and **both**;
- captured pair count;
- local manual-test completion;
- known limitations.

Playwright traces are retained by the local browser test runner for failed tests only; the evidence collector does not publish traces. Do not imply that a trace exists for every route. Contrast observations use WCAG 2.x ratios where measured; APCA is a different metric and is not substituted or compared as equivalent.

Important interpretation rules:

- A disappearing violation is a **candidate fix**. The tested content must still be equivalent. Removing content is not an accessibility fix.
- An axe count is not a conformance score. A zero does not prove accessibility.
- There is no aggregate accessibility percentage.
- A failed collection or missing state is a gap, not a pass.
- Published evidence records **zero completed manual tests** unless a person has exported and attached their records. The interface never submits them.

## Manual tests

Manual tests live in `data/manual-tests.json`. The alert pilot uses the USWDS alert accessibility checklist plus a dynamic status-message test. Each definition contains the requirement, source, purpose, preconditions, steps, expected result, assistive-technology flag, and conditional status.

Record a result only after performing the test:

1. Choose **Pass**, **Fail**, **Needs review**, **Blocked**, **Not applicable**, or **Not tested**.
2. Record the reviewer, date, browser and operating system, assistive technology (if used), baseline observation, experiment observation, evidence link or note, and limitations.
3. **Not applicable** requires a written justification; otherwise the status is not saved.
4. Export JSON or Markdown and attach it to the review record you choose. Nothing is committed or sent automatically.

Guidepup transcripts are a virtual screen reader over a DOM snapshot. They support investigation and do not count as NVDA, JAWS, VoiceOver, or Voice Control testing.

## Adding evaluation support for a component

1. Add or extend `states` in the component's registry entry. Use stable slugs and describe the action needed to reach the state.
2. Add matching `data-state` wrappers in `scripts/components.mjs`. Interactive states also need a local-only action.
3. Add component-specific human tests to `data/manual-tests.json`, citing the official USWDS accessibility tests and the relevant WCAG requirement.
4. Add deterministic Playwright checks for the new state and interactions.
5. Run `npm run check`, `npm run test:browser:chromium`, then `npm run evidence`. Captures for every registered component and state are generated automatically under all four browser conditions.
6. Update the experiment documentation and the human decision log. Do not mark a manual test complete on someone else's behalf.

## What this workspace does not do

- Axe state scans run under the default light fixture condition only. Dark and forced-colours captures are visual evidence, not additional axe scans.
- It does not test real screen readers, speech input, switch access, or real Windows High Contrast Mode.
- It does not replicate browser zoom or a user stylesheet.
- It does not mirror keyboard input between panes.
- It does not prove that a component is accessible because axe reports zero violations.
- It does not replace human review, participant research, or upstream maintainer judgment.
