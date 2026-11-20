# Implementation: logical properties for RTL

## CSS

```css
.usa-alert {
  border-left: 0 !important;
  border-right: 0 !important;
  border-inline-start: 8px solid var(--fx-info-edge) !important;
  text-align: start;
}
.usa-alert--warning { border-inline-start-color: var(--fx-warn-edge) !important; }
.usa-alert--error { border-inline-start-color: var(--fx-error-edge) !important; }
.usa-accordion__button,
.usa-banner__button,
.usa-banner__header-text,
.usa-banner__header-action { text-align: start; }
```

`border-inline-start` resolves to `border-left` in `ltr` and `border-right` in `rtl`. The physical `border-left`/`border-right` declarations are removed so the two rules cannot disagree.

## Direction and language

`site/assets/fixture.js` sets `dir` from `?dir=rtl` and only sets `lang="ar"` when explicitly requested with `?lang=ar`. The banner fixture includes:

```html
<p lang="ar" dir="rtl">معلومات الخدمة …</p>
```

The inline `lang` and `dir` keep the sample from changing the language of the surrounding English page. Do not set `dir="rtl"` on an English page and call that localization.

## How to test

- `fixture/banner-experiment.html?dir=rtl`
- `fixture/alert-experiment.html?dir=rtl`
- `compare.html?component=banner&direction=rtl`
- Inspect computed `text-align`, `border-left-width`, and `border-right-width`.
- Tab through the banner: the disclosure button and focus ring should remain visible.
- Confirm the Arabic sample has `lang="ar"` and `dir="rtl"`.

## What a real contribution would need

- A component-by-component audit of physical properties.
- Native-language review and longer mixed-direction content.
- LTR regression screenshots and tests.
- Documentation of where logical properties cannot be used because of upstream constraints.
- A decision about icon mirroring and focus placement.

## Known gaps

- No native Arabic review.
- No full page translation.
- No visual regression baseline; the lab records screenshots and computed properties.
