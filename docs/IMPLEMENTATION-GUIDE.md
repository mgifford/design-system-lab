# Implementation and accessibility testing plan

This project follows USWDS's useful distinction between component-level tests and checks that must be performed in a particular implementation. Do not mark a behavior as accessible merely because the isolated example passed.

## Accordion

Authoring: real `<button>`, unique `aria-controls` target, accurate `aria-expanded`, readable content without script initialization. Compare initially collapsed and initially expanded states, including repeated actions.

Verification: Tab to button, Enter and Space; focus stays predictable; target content becomes visible/hidden; expanded state changes; forced-color border and focus remain distinct. Capture virtual transcript at rest and after expansion. Test [official USWDS accordion guidance](https://designsystem.digital.gov/components/accordion/accessibility-tests/).

## Alert

Authoring: message text conveys meaning without relying on icon or color; use contextual roles only when genuinely appropriate. Distinguish static informational alerts from status updates that need announcements.

Verification: verify headings, text, colors and borders across themes, text resize, forced colors, and color perception. A static alert does not need a live region simply because it looks like a banner. Test [official USWDS alert guidance](https://designsystem.digital.gov/components/alert/accessibility-tests/).

## Banner

Authoring: demonstrate the layout pattern without falsely claiming government affiliation. A real agency banner must be accurate, linked to its actual trust/identity documentation and localizable.

Verification: keyboard disclosure state, no-JavaScript availability, layout at 320 CSS px, logical padding and start/end controls in RTL, announcements in transcript. Test [official USWDS banner guidance](https://designsystem.digital.gov/components/banner/accessibility-tests/).

## Forms and native validation

Authoring: explicit labels, fieldset and legend for radio groups, required fields and a locally handled form with no network submission. Respect browser-native validity and avoid merely relocating inputs offscreen.

Verification: submit empty form via keyboard; confirm browser prevents submission; the invalid field can receive focus; validity messages can be perceived in real browsers; selection works via keyboard; document Voice Control testing as unavailable until a person actually performs it. Test [USWDS form guidance](https://designsystem.digital.gov/components/form/) and [radio button accessibility tests](https://designsystem.digital.gov/components/radio-buttons/accessibility-tests/) and source issues [#6068](https://github.com/uswds/uswds/issues/6068) and [#6080](https://github.com/uswds/uswds/issues/6080).

## Browser and virtual transcript evidence

Capture all pages and all applicable states, recording browser version, date, source hashes, site URL, theme, direction, and limitations. Distinguish virtual screen reader output, browser accessibility attributes, and actual assistive technology sessions. A difference in transcript is a signal to investigate, not automatically an accessibility regression.
