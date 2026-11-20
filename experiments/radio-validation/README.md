# Native radio validation

**Status: Prototype. Automated evidence may exist; human review is pending.**

**Category:** Alternative implementation  
**Baseline:** USWDS v3.14.0  
**Proposal:** A focused reproduction of required radio-group validation and focus placement.

## Why this exists

USWDS issue [#6068](https://github.com/uswds/uswds/issues/6068) reports that checkbox and radio controls do not support Voice Control. Issue [#6080](https://github.com/uswds/uswds/issues/6080) reproduced a related native radio validation problem and was consolidated into #6068 rather than fixed.

This experiment does not claim to fix positioning or Voice Control. It records what the browser actually does with a required group, so a future proposal has a reproducible baseline.

## What stable USWDS provides

USWDS provides radio markup, visually hidden native inputs, and a label that draws the visible control. The native input remains focusable and participates in form validation.

## What is proposed

A required radio group with:

- a fieldset and legend;
- two native radio inputs with `required`;
- a visible hint that the group is required;
- no redundant `aria-required` or custom `role="radiogroup"`;
- a submit button and a local status message;
- a reset button.

## What changed in the lab

This is a new fixture (`radio-validation`) with baseline and experimental variants. The experimental variant adds the theme layer; the validation behavior is native in both. There is no custom validation script.

## Evidence status

Automated tests record `document.activeElement` after an invalid submit, native validity, keyboard selection, and the valid submission path. Browser differences are recorded rather than normalized away. Voice Control remains untested by a person.

## Known limitations

- Native validation bubbles are browser-controlled and vary by browser and language.
- Focus placement after invalid submission may differ between Chromium and Firefox; the test records the actual result.
- The lab has not tested Voice Control, Dragon, or a real screen reader.
- The fixture does not fix the upstream radio positioning issue.
