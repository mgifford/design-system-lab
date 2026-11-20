# Test plan: native radio validation

## Deterministic browser checks

- [ ] Baseline and experimental fixtures load with the required group.
- [ ] Both radios are native inputs with the same `name` and `required`.
- [ ] The fieldset has a legend that includes “required”.
- [ ] Empty submit leaves the form invalid and focus on an invalid radio.
- [ ] Native `:invalid` state is observable after the failed submit.
- [ ] Arrow keys move within the radio group; Space selects.
- [ ] Valid submit shows the `role="status"` confirmation.
- [ ] Reset clears the status and selection.
- [ ] No page errors occur.
- [ ] Dark mode keeps the radio surface, label, and focus ring legible.
- [ ] Test results are recorded separately for Chromium and Firefox.

## Evidence

- [ ] Initial Guidepup transcript.
- [ ] Transcript after invalid submission.
- [ ] Transcript after valid submission.
- [ ] Screenshot in light and dark.
- [ ] Axe scan.

## Human review

A human reviewer must confirm the test does not overstate Voice Control support and must record the browser-specific focus result. Complete [DECISION.md](DECISION.md).
