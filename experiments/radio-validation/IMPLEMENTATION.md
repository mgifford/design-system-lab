# Implementation: native radio validation

## Markup

```html
<form id="radio-validation-form" data-local-validation data-status-target="radio-validation-status">
  <fieldset>
    <legend>How should we contact you? <span class="fixture-required">(required)</span></legend>
    <p id="contact-hint">Choose one option. The browser will block an empty submission.</p>
    <div class="usa-radio">
      <input class="usa-radio__input" id="contact-email" name="contact" value="email" type="radio" required>
      <label class="usa-radio__label" for="contact-email">Email</label>
    </div>
    <div class="usa-radio">
      <input class="usa-radio__input" id="contact-phone" name="contact" value="phone" type="radio" required>
      <label class="usa-radio__label" for="contact-phone">Phone call</label>
    </div>
  </fieldset>
  <button type="submit">Continue</button>
  <button type="reset">Clear response</button>
</form>
<p id="radio-validation-status" role="status" aria-live="polite"></p>
```

## Behavior

The form uses native constraint validation. `site/assets/fixture.js` attaches a local submit handler only to show a status message when the form is valid; it does not replace the browser's invalid-submission behavior. No data is sent.

Do not add `aria-required` to native `required` inputs. Do not add `role="radiogroup"`: the fieldset and legend already provide the group name and relationship.

## What the browser exposes

- The fieldset/legend relationship.
- A group of radio inputs with the same `name`.
- `required` on each input.
- Native `:invalid` matching after a failed submission.
- Focus on the first invalid radio in tested Chromium; record Firefox separately.

## How to test

1. Open the fixture with JavaScript enabled.
2. Press Tab to the first radio; use arrow keys and Space.
3. Submit with no selection; record `document.activeElement` and `form.checkValidity()`.
4. Select an option with the keyboard and submit; verify the local status.
5. Reset and confirm the status clears.
6. Repeat with `?theme=dark` to check the radio surface and focus ring.

## What a real contribution would need

- Reproduce the Voice Control issue with the named speech tool and operating system.
- Compare native input positioning with possible alternatives.
- Record browser-specific focus and validation behavior.
- Propose the smallest upstream change, with regression tests.

## Known gaps

- No real Voice Control session.
- No real screen-reader session.
- The browser's validation bubble cannot be inspected programmatically.
