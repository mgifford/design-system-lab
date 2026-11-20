# Implementation: user preferences panel

## Markup

```html
<form id="prefs-form" aria-describedby="prefs-help">
  <p id="prefs-help">Changes apply immediately and are stored in this browser.</p>
  <fieldset>
    <legend>Appearance</legend>
    <label><input type="radio" name="theme" value="system" checked> System</label>
    <label><input type="radio" name="theme" value="light"> Light</label>
    <label><input type="radio" name="theme" value="dark"> Dark</label>
  </fieldset>
  <label for="pref-text-size">Text size</label>
  <select id="pref-text-size">…</select>
  <button type="button" id="prefs-reset">Reset to system defaults</button>
  <p id="prefs-status" role="status" aria-live="polite"></p>
</form>
```

The real page uses labelled selects for text size, contrast, and motion, and a fieldset with native radios for appearance. Every control has a visible label. There is no custom `role="radiogroup"`; the native fieldset and input behavior are used.

## Behavior

`site/assets/prefs.js`:

- reads `uswds-lab-prefs` from `localStorage` inside `try/catch`;
- applies `data-theme`, `data-text-size`, `data-contrast`, and `data-motion` on `<html>`;
- updates the page immediately on `change`;
- writes the four values back to storage;
- reports storage failure in the status region without breaking the page;
- resets by removing the key and returning to `system`/default;
- reloads the iframe preview so it reads the current preference.

An inline head script applies the stored values before CSS paints, which reduces a flash of the wrong theme. The module re-applies the same values after load.

## CSS

The shell tokens are in `site/assets/base.css`:

```css
:root[data-text-size="large"] { font-size: 112.5%; }
:root[data-text-size="x-large"] { font-size: 125%; }
:root[data-contrast="more"] { --border: currentColor; --muted: var(--ink); }
:root[data-motion="reduce"] * { animation-duration: .01ms !important; … }
```

Dark appearance is resolved by `prefers-color-scheme` for `system` and by `data-theme="dark"` for an explicit choice. The experiment fixtures read the same stored values in `site/assets/fixture.js`.

## No-JavaScript behavior

The page, labels, and explanation remain readable. The controls are present but do not save; a `<noscript>` message says so. The fixtures remain readable and the dead disclosure buttons are hidden by CSS. This is a documented fallback, not a claim that preferences work without JavaScript.

## Accessibility notes

- Native controls, visible labels, and a fieldset/legend for appearance.
- Status updates use `role="status"` and `aria-live="polite"`.
- No color-only state; the selected radio is the state.
- The panel works at 320px and with long labels; controls are allowed to wrap.
- Storage failure is announced, not silent.
- The panel does not trap focus or open a modal.

## What a real upstream component would need

A shared placement strategy, a documented storage key and version, a server-rendered fallback, a reset contract, and evidence that each setting actually helps the intended users. The panel must not imply that a user preference fixes an inaccessible component.

## Known gaps

- No Voice Control or real screen-reader session.
- No cross-origin or server-side preference synchronization.
- No preference for language or writing direction; those belong to content, not a display panel.
