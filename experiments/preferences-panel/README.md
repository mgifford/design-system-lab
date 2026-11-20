# User preferences panel

**Status: Prototype. Automated evidence may exist; human review is pending.**

**Category:** New component  
**Baseline:** No equivalent component in stable USWDS v3.14.0  
**Proposal:** A native-control panel for appearance, text size, contrast, and motion.

## Why this exists

USWDS issue [#5069](https://github.com/uswds/uswds/issues/5069) asked for personalization: light/dark preferences, text controls, and settings documentation. It was closed as not planned amid limited maintainer capacity. Issue [#4407](https://github.com/uswds/uswds/issues/4407) separately explored `prefers-contrast`.

Teams that need these controls often add third-party accessibility overlays. Those overlays can conflict with assistive technology, hide content, and create a parallel interface. A small, native, documented component is a more maintainable alternative.

## What stable USWDS provides

Stable USWDS provides accessible primitives (radios, selects, fieldsets, buttons, status messages) and guidance for building forms. It does not provide a preferences panel, a storage contract, or a documented reset behavior.

The lab does not invent a baseline panel. The absence is stated as a capability gap.

## What is proposed

A panel with four settings:

1. **Appearance:** system, light, or dark.
2. **Text size:** 100%, 112.5%, or 125% root scaling.
3. **Contrast:** default or stronger borders/focus.
4. **Motion:** follow system or reduce.

The panel uses native radios and selects, a labelled fieldset, a visible label for each control, a `role="status"` message, and a reset button. It stores only those four values in `localStorage` under `uswds-lab-prefs`. It does not store personal information and does not send data anywhere.

## What changed in the lab

The shell uses semantic tokens and `data-*` attributes so the panel can change the lab interface. The fixture runtime reads the same stored preference, so a fixture opened from the panel reflects it. The stable baseline pane remains unchanged.

## Scope boundaries

- This is not a replacement for accessible design or assistive technology.
- It does not override forced colors.
- It does not replace browser zoom or a user stylesheet.
- It is not a third-party overlay and does not hide page content.
- Storage is per origin and may be unavailable in private browsing; the page reports that failure and remains usable.

## Evidence status

Automated tests check persistence, reset, keyboard operation, no-JavaScript readability, dark appearance, and focus. Evidence is published on the lab evidence page after collection. The decision record remains pending.

## Known limitations

- The panel does not yet appear on every page as a floating utility; the page is the demonstration.
- Text size is a root font-size scale, not a full text-spacing override.
- Contrast preference is a small enhancement, not a high-contrast mode.
- A real screen-reader and speech-input session is outstanding.
