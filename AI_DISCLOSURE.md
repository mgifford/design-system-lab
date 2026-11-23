# AI assistance disclosure

## Initial starter

The initial starter code and documentation were drafted with OpenAI ChatGPT assistance on November 20, 2026, following human project requirements. The initial source structure and behavior were not reviewed or approved by upstream USWDS or OGDS maintainers. Automated local smoke validation in the authoring environment does not constitute real assistive-technology testing or standards conformance.

## Current implementation pass

On November 20, 2026, the DeepSeek Harness coding agent (`deepseek-flash`) extended the starter: source locking, the experiment registry and pages, the dark-mode token layer and contrast fixes, the user preferences panel, RTL and radio-validation prototypes, the evidence collector, browser and unit tests, CI configuration, and documentation.

AI assistance was used for issue research, code generation, test scaffolding, evidence generation, and documentation drafting. The agent:

- did not push a branch, open an issue, or submit anything upstream;
- did not mark any experiment as human-reviewed;
- did not invent test results, screenshots, or transcript output;
- recorded browser substitutions and blocked checks rather than hiding them.

## Evaluation-interface pass

On November 23, 2026, the same agent added the evaluation workspace: shared URL/state configuration, evaluator-versus-fixture preference separation, four comparison modes, browser-emulated capture pairs, per-state axe observations, state-level finding classification, the twelve-state Alert pilot, and local-only manual test recording. It also added unit and browser tests, documentation, and the evidence-collection changes.

On the same day, the agent added a native fixture performance sample (cold-context runs, transfer/request/DOM budgets, timing warnings) and a cost-and-stability panel. It did not add a performance score, did not run Lighthouse or sitespeed.io, and did not claim field or energy measurements.

The agent did not record any manual test result, did not mark a state or experiment reviewed, and did not submit anything upstream. Manual results are intentionally absent from published evidence until a person performs the tests.

## Human review status

**No human has reviewed or approved most experiments in this pass.** Dark mode was accepted as a lab experiment by Mike Gifford on 2026-11-20 and is recorded in `docs/EXPERIMENT-DECISIONS.md`; the other three experiments are pending. A passing build, a clean axe scan, and a Guidepup transcript are observations, not approval.

A human reviewer must still:

- verify the issue history and user need;
- inspect semantics, keyboard behavior, focus, and state communication;
- perform real screen-reader and, where relevant, speech-input testing;
- evaluate forced colors, high contrast, zoom, and text spacing;
- assess upstream compatibility, maintenance cost, and licensing;
- record the decision and its limitations.

## Future contributions

Indicate which code, tests, documentation, and judgments involved AI; identify the human who reviewed them; link evidence; specify limitations and any source or license concerns. AI-generated tests may contain incorrect assumptions. Do not attribute human work to AI, and do not claim a model contribution that cannot be verified.
