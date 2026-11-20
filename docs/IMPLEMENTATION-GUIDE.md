# Implementation and accessibility testing plan

This project follows USWDS's distinction between component-level tests and checks that must be performed in a particular implementation. Do not mark a behavior as accessible merely because the isolated example passed.

## Accordion

**Authoring:** real `<button>` inside a heading, unique `aria-controls` target, accurate `aria-expanded`, readable content without script initialization. Compare initially collapsed and initially expanded states, including repeated actions.

**Verification:** Tab to the button, Enter and Space; focus stays predictable; target content becomes visible or hidden; expanded state changes; forced-color border and focus remain distinct. Capture a virtual transcript at rest and after expansion. Test the [official USWDS accordion guidance](https://designsystem.digital.gov/components/accordion/accessibility-tests/).

**Lab notes:** The no-JavaScript fallback hides the dead disclosure buttons and shows the content. This avoids a button that says “collapsed” while the content is visible.

## Alert

**Authoring:** message text conveys meaning without relying on icon or color; use contextual roles only when genuinely appropriate. Distinguish static informational alerts from status updates that need announcements.

**Verification:** verify headings, text, colors, and borders across themes, text resize, forced colors, and color perception. A static alert does not need a live region simply because it looks like a banner. Test the [official USWDS alert guidance](https://designsystem.digital.gov/components/alert/accessibility-tests/).

**Lab notes:** The RTL experiment replaces the physical left border with `border-inline-start`. The alert heading carries the meaning, so color is not the only cue.

## Banner

**Authoring:** demonstrate the layout pattern without falsely claiming government affiliation. A real agency banner must be accurate, linked to its actual trust/identity documentation, and localizable.

**Verification:** keyboard disclosure state, no-JavaScript availability, layout at 320 CSS px, logical padding and start/end controls in RTL, announcements in the transcript. Test the [official USWDS banner guidance](https://designsystem.digital.gov/components/banner/accessibility-tests/).

**Lab notes:** The fixture includes a short Arabic sample with `lang="ar"` and `dir="rtl"`. Native-language review is outstanding.

## Forms and native validation

**Authoring:** explicit labels, fieldset and legend for radio groups, required fields identified in text, and a locally handled form with no network submission. Respect browser-native validity and avoid merely relocating inputs offscreen.

**Verification:** submit empty via keyboard; confirm the browser prevents submission; record where focus lands; confirm validity messages are perceivable in real browsers; selection works via keyboard; document Voice Control testing as unavailable until a person performs it. Test [USWDS form guidance](https://designsystem.digital.gov/components/form/) and [radio button accessibility tests](https://designsystem.digital.gov/components/radio-buttons/accessibility-tests/).

**Lab notes:** Required fields use visible “(required)” text, not an unexplained asterisk. The experiment does not add `aria-required` to native `required` inputs.

## Radio validation

**Authoring:** a fieldset/legend, native radio inputs with `required`, no `role="radiogroup"` or redundant `aria-required`, and a local status message for the valid path.

**Verification:** submit an empty group; record `form.checkValidity()` and `document.activeElement`; repeat in Chromium and Firefox; select with arrow keys and Space; submit; confirm the status. Do not claim that this fixes upstream positioning or Voice Control. See issue [#6068](https://github.com/uswds/uswds/issues/6068) and the consolidated history in [#6080](https://github.com/uswds/uswds/issues/6080).

## User preferences panel

**Authoring:** native radios and selects, a labelled fieldset for appearance, a `role="status"` region, visible reset, and no third-party overlay. Store only the four preference values in `localStorage`; catch storage failures.

**Verification:** keyboard operation, persistence after reload, reset, text size, dark appearance, no-JavaScript readability, and narrow layout. Confirm the panel does not imply that preferences replace accessible design.

## RTL and logical properties

**Authoring:** use `border-inline-start`, `padding-inline`, and `text-align:start` where they express the intended direction. Do not visually reverse an LTR page and call it localization.

**Verification:** compare computed border sides and alignment in LTR and RTL; test the disclosure with the keyboard; confirm `lang` and `dir` on the sample content; record native-language review as a gap until performed. See issue [#5336](https://github.com/uswds/uswds/issues/5336).

## Browser and virtual transcript evidence

Capture all published lab routes and applicable states, recording browser version, date, source hashes, site URL, theme, direction, and limitations. Distinguish virtual screen reader output, browser accessibility attributes, and actual assistive technology sessions. A difference in transcript is a signal to investigate, not automatically an accessibility regression.

## What the lab does not establish

- A passing Playwright or axe run is not WCAG conformance.
- Guidepup is not a real screen reader.
- A component that works in isolation can still be inaccessible when implemented incorrectly.
- Dark mode, RTL, and preference controls require human review and real-device testing.
