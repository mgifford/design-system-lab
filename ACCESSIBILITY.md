# Accessibility commitment

**Status:** Experimental pilot. No project-wide WCAG conformance claim. **Target:** WCAG 2.2 Level AA for the lab interface and its original fixtures, subject to human verification.

## What we check

- Every lab route has a route smoke test, a Playwright behavior test where relevant, an axe scan, and a Guidepup virtual transcript when evidence collection runs.
- Disclosure controls are tested with real Enter and Space key presses; form and radio validation are tested through native browser behavior.
- Focus-ring contrast and dark-mode radio/checkbox surface contrast are measured with computed styles, not assumed from token values.
- The preferences panel is tested for keyboard operation, persistence, reset, text size, dark appearance, and no-JavaScript readability.
- RTL fixtures are tested for direction, language, a mixed-direction sample, logical border placement, and keyboard operation.
- No-JavaScript fixture content stays readable and dead disclosure buttons are removed from the visual and accessibility tree.
- Forced colors and reduced motion are exercised through browser emulation and recorded as emulation, not real-device testing.
- Each component links to the original USWDS implementation and accessibility guidance.
- The Evidence page distinguishes generated observations, collection failures, missing states, and human judgments.

## What we do not claim

Guidepup virtual speech is not a real VoiceOver, NVDA, or JAWS session. Axe is not a conformance determination. Forced-colors emulation is not Windows High Contrast Mode on a real device. The fixtures do not represent the full breadth of implementation contexts, languages, operating systems, content, disabilities, or user journeys.

## Required human checks before approving an experiment

1. Navigate every interactive state via keyboard, including visible focus, escape/cancel behavior where relevant, and focus after validation.
2. Review the rendered result at 200% text and 400% page zoom, across narrow layouts, including 320 CSS pixels.
3. Evaluate light, dark, forced-colors, reduced-motion, and increased-contrast behavior where relevant.
4. Read the Guidepup transcript alongside the DOM and accessible names; verify it is an informative representation, not a substitute for AT testing.
5. Check USWDS component-specific accessibility instructions and any new risks from customizations.
6. Perform at least one real screen-reader session and, for the radio/form work, a Voice Control or speech-input session; record the tool, OS, browser, and result.
7. Record the tester, tools, browser/OS version, date, observations, limitations, and decision in the experiment's `DECISION.md`.

## Known gaps in this pilot

- No real NVDA, JAWS, VoiceOver, or TalkBack session has been performed.
- Voice Control and speech-input operation of the radio and form fixtures are untested by a person.
- No real Windows High Contrast Mode session has been performed.
- Chromium (Chrome channel) and WebKit were run locally; the axe scan is Chromium-only. Firefox could not launch in the authoring sandbox because it could not create its profile folder, so Firefox remains untested there. CI currently runs Chromium only.
- 400% zoom, text-spacing overrides, and all browser/OS combinations have not been exhaustively tested.
- The Arabic sample in the RTL experiment has not had native-language review.
- Dark mode covers four components, not the whole design system.

## Reporting

Open an issue in the pilot repository, identifying the tested component, fixture URL, repeatable steps, source version, browser, observed behavior, expected behavior, and impact. For potentially sensitive security findings, do not post a public proof of concept; follow responsible disclosure channels.

Reference: <https://github.com/mgifford/ACCESSIBILITY.md>
