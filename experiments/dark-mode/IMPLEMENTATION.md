# Implementation: native dark-mode support

## Approach

The experiment keeps the official USWDS CSS and JS. It adds one stylesheet with semantic custom properties and a small set of component overrides.

```css
:root {
  --fx-canvas: #fff;
  --fx-surface: #f1f3f5;
  --fx-text: #1b1b1b;
  --fx-border: #77808b;
  --fx-link: #005ea2;
  --fx-focus: #005ea2; /* 6.2:1 on the light surface */
}
:root[data-mode="dark"] {
  --fx-canvas: #151c28;
  --fx-surface: #273448;
  --fx-text: #f5f6f9;
  --fx-border: #aab7c8;
  --fx-link: #86c9fa;
  --fx-focus: #ffbe2e; /* 10.7:1 on the dark canvas */
}
@media (prefers-color-scheme: dark) {
  :root[data-mode="system"] { /* the same dark values */ }
}
```

`data-mode` is set by `site/assets/fixture.js` from the `?theme=` query parameter or the saved preference. The default is `system`, which is resolved entirely by the media query; no JavaScript is required for the system preference.

## Component rules

- Accordion and banner buttons use `--fx-surface` for the control and `--fx-canvas` for the panel.
- Alerts use semantic warning/error/info backgrounds and keep a heading; color is not the only cue.
- The form input uses `--fx-canvas` and `--fx-text`.
- **Radio and checkbox containers need explicit treatment.** Upstream sets `.usa-radio{background:#fff}` and `.usa-checkbox{background:#fff}`. The lab sets both the container and the label color in dark mode; otherwise the page shows a white slab or dark-on-dark text.
- The banner's small “About this banner” text is visually hidden from assistive technology upstream but is still visible text on narrow screens. It uses `--fx-link` in dark mode.
- Focus is a 3px outline with a 3px offset. The light token is `#005ea2` (6.2:1 on the light surface and 4.7:1 on the page); the dark token is `#ffbe2e` (10.7:1 on the dark canvas). The outline sits on the page surface because of the offset, so the contrast is measured against the surface behind it.

## RTL and logical properties

The alert uses `border-inline-start` and removes the physical left border, so the accent moves to the start side in RTL. Accordion and banner buttons use `text-align:start`. This is a small demonstration, not a complete multilingual layout.

## Forced colors and reduced motion

`@media(forced-colors: active)` restores a system `Highlight` focus outline and `ButtonText` borders. The theme does not set `forced-color-adjust:none` on components. `@media(prefers-reduced-motion: reduce)` removes non-essential transitions. Dark mode is not a substitute for either preference.

## How to use it

- `fixture/accordion-experiment.html?theme=dark`
- `fixture/accordion-experiment.html?theme=system`
- `compare.html?component=accordion&theme=dark`
- The preferences panel stores an explicit override in `localStorage`; reset removes it.

## What upstream would need

A real contribution would need to map Sass tokens to runtime custom properties, document the supported component matrix, and resolve hard-coded colors in upstream CSS. This experiment does not claim that a short `--fx-*` list is complete USWDS support.

## Known gaps

- No high-contrast OS session or real screen-reader session.
- No header/footer/navigation/table/card coverage.
- Some states use `!important` because upstream selectors have higher specificity.
- No measured performance claim; the extra CSS is small, but it has not been benchmarked.
