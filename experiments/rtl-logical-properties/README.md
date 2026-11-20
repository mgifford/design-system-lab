# Logical properties for RTL support

**Status: Prototype. Automated evidence may exist; human review is pending.**

**Category:** Alternative implementation  
**Baseline:** USWDS v3.14.0  
**Proposal:** Use logical properties for the banner and alert instead of mirrored physical overrides.

## Why this exists

USWDS issue [#5336](https://github.com/uswds/uswds/issues/5336) remains open. Maintainers asked for a concrete RTL example and LTR compatibility checks. Issue [#6030](https://github.com/uswds/uswds/issues/6030) prototyped logical properties for the banner and was consolidated into #5336.

RTL support is not the same as flipping the page. Text direction, language, logical padding, icon placement, focus order, and content order must remain meaningful.

## What stable USWDS provides

USWDS uses a mix of logical and physical properties. Some components already respond to `dir="rtl"`, but the alert's accent border and some alignment details need explicit review. The lab does not claim that the whole design system is RTL-ready.

## What is proposed

The experimental stylesheet:

- replaces the alert's physical left border with `border-inline-start`;
- sets `text-align:start` on accordion and banner buttons;
- keeps the document's `lang` and `dir` separate: direction is not a translation;
- adds a small sample Arabic paragraph with `lang="ar" dir="rtl"` to test mixed-direction content.

## What changed in the lab

Only the experimental pane changes. The baseline keeps the official output. The same English fixture content is used in both panes, plus the labelled Arabic sample.

## Evidence status

Automated evidence covers `?dir=rtl` on the banner and alert fixtures, computed `text-align` and border sides, and the mixed-direction sample. Native-language review is outstanding. The decision record is pending.

## Known limitations

- The Arabic sample is short and was written for direction testing; a native speaker has not reviewed it.
- This is not a translation or a full localization implementation.
- The lab does not test every USWDS component or browser bidi algorithm edge case.
- Icon mirroring, focused-element placement, and long mixed-direction forms need further work.
