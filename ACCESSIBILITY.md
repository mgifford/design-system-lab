# Accessibility commitment

**Status:** Experimental pilot. No project-wide WCAG conformance claim. **Target:** WCAG 2.2 Level AA for the lab interface and its original fixtures, subject to human verification.

## What we check

- Every published route gets a browser smoke test and a Guidepup virtual transcript when evidence generation runs.
- Interactive fixtures have keyboard assertions where applicable.
- CSS experiments must be evaluated with forced colors, reduced motion, RTL, mobile viewport, and light/dark preference combinations.
- Each component links to the original USWDS implementation and accessibility guidance.
- The Evidence page distinguishes generated observations, missing tests, and human judgments.

## What we do not claim

Guidepup virtual speech is not a real VoiceOver, NVDA or JAWS session. An axe or Playwright success is not a WCAG conformance determination. These fixtures do not represent the full breadth of implementation contexts, languages, OS environments, content, disabilities or user journeys.

## Required human checks before approving an experiment

1. Navigate every interactive state via keyboard, including visible focus and escape/cancel behavior.
2. Review the rendered result at 200% text and 400% page zoom, across narrow layouts.
3. Evaluate light, dark, forced-colors, and reduced-motion behavior where relevant.
4. Read the Guidepup transcript alongside the DOM and accessible names; verify it is an informative representation, not a substitute for AT testing.
5. Check USWDS component-specific accessibility instructions and any new risks from customizations.
6. Record the tester, tools, browser/OS version, date, observations, limitations and decision.

## Reporting

Open an issue in the pilot repository, identifying the tested component, fixture URL, repeatable steps, source version, browser, observed behavior, expected behavior, and impact. For potentially sensitive security findings, do not post a public proof of concept; follow responsible disclosure channels.

Reference: https://github.com/mgifford/ACCESSIBILITY.md
