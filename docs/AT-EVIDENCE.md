# Automated real screen-reader evidence

The lab has two screen-reader layers:

1. **Guidepup Virtual Screen Reader** over a DOM snapshot — fast, runs in the main evidence collector, and is clearly a simulation.
2. **Guidepup automation of a real screen reader** — currently macOS VoiceOver — runs in a separate, OS-specific workflow. This is still **automated AT evidence**, not a human screen-reader session, and not WCAG conformance.

A third layer remains essential: **a person using assistive technology**. Automated AT cannot judge comprehension, frustration, or task success.

## Current workflow

`.github/workflows/at-voiceover.yml` runs on `workflow_dispatch` and weekly on a macOS runner:

1. Install dependencies and build the lab.
2. Install WebKit.
3. Configure the macOS runner with `@guidepup/setup`.
4. Install the pinned VoiceOver assets.
5. Run `npm run test:at:voiceover`.
6. Upload `test-results/guidepup` and `playwright-report/guidepup` as artifacts.

The workflow is **not** part of the normal pull-request gate. Real screen readers need an OS desktop, take longer, and are more brittle than the virtual/DOM suite. It is also not published into the static site: the phrase logs are review artifacts, not a claim that every build has a fresh VoiceOver run.

## Tests

`tests/guidepup/voiceover.spec.mjs` covers:

- dynamically inserted status alert: announcement includes the message and reference number, and focus stays on the trigger
- updated status alert: the changed text is announced
- static error alert: text appears in the VoiceOver reading order
- Accordion: expanding exposes the question and the panel
- Banner: expanding exposes the control name and the panel

Each test attaches a JSON spoken-phrase log containing the method and the caveat. The test name and annotation state that this is automated VoiceOver, not human testing.

## Running locally (macOS)

```sh
npx guidepup setup
node scripts/guidepup-setup.mjs install voiceover
npm run test:at:voiceover
```

`@guidepup/setup` may request administrator access and macOS Accessibility/Screen Recording permissions. This is expected: it configures the real screen reader. The local sandbox for this project cannot grant those permissions, so the workflow is verified on a macOS runner rather than claimed from a sandbox run. Run `45289287525` passed all five tests on `macos-latest` (4.8 minutes of screen-reader tests); the generated phrase attachments must still be read as automated observations.

Node 22 does not provide `Error.isError`, which the setup CLI uses. `scripts/guidepup-setup.mjs` polyfills it only for that CLI; project code remains on the declared Node engine.

## Interpretation rules

- A phrase log is **automated output**. It is not proof that a person can complete the task.
- VoiceOver speech varies by macOS, VoiceOver version, voice, verbosity, and web content. Do not over-fit assertions to one exact phrase.
- An automated AT test passing does **not** complete a manual test. The manual result still requires a person, reviewer, date, browser/OS, AT version, and observations.
- A failed or missing automated AT run is a coverage gap, not a pass.
- Do not describe this as NVDA, JAWS, or VoiceOver human testing.

## Next layers

- NVDA on Windows via `@guidepup/playwright` and a Windows runner.
- Orca on Linux/Docker if the runner support is stable.
- Human VoiceOver/NVDA sessions with exported notes for the manual test records.

## Licensing

`@guidepup/guidepup`, `@guidepup/playwright`, and `@guidepup/setup` are MIT-licensed dev dependencies. No Guidepup source is vendored into the lab. See [THIRD-PARTY.md](https://github.com/mgifford/design-system-lab/blob/main/THIRD-PARTY.md).
