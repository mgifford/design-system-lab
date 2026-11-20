# Test plan: user preferences panel

## Deterministic browser checks

- [ ] Page loads with a descriptive title and one visible `h1`.
- [ ] The panel is a form with labelled native controls and a fieldset/legend for appearance.
- [ ] Selecting dark sets `data-theme="dark"` and the page background changes.
- [ ] Selecting light sets `data-theme="light"` and overrides emulated system dark.
- [ ] Selecting system removes `data-theme` so the media query applies.
- [ ] Text size sets `data-text-size` and the root font size changes.
- [ ] Contrast and motion set their attributes.
- [ ] Reloading the page restores the saved preference.
- [ ] Reset removes the key and restores system defaults.
- [ ] The status region announces save/reset and storage failure.
- [ ] Keyboard-only operation reaches every control and the reset button.
- [ ] 320px viewport and 200% zoom keep labels and controls readable.
- [ ] With JavaScript disabled, the page and explanation remain readable and the `<noscript>` message is visible.

## Evidence

- [ ] Guidepup transcript of the initial panel.
- [ ] Screenshot in light and dark appearance.
- [ ] Axe scan with no serious/critical violations, or documented findings.

## Human review

A reviewer must decide whether the settings have a documented user need, whether the storage and reset contract are acceptable, and whether the panel risks being mistaken for an accessibility overlay. Record the decision in [DECISION.md](DECISION.md).
