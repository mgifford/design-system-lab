# Experiment decisions

This is the **only human decision surface** for experiments. It replaces the four per-experiment `DECISION.md` forms.

A reviewer records only:

1. the decision;
2. the date and reviewer name;
3. one sentence of rationale;
4. conditions or exceptions not already covered by [`ACCESSIBILITY.md`](https://github.com/mgifford/design-system-lab/blob/main/ACCESSIBILITY.md);
5. upstream authorization, if any.

Everything else is evidence, not a reviewer task: the baseline release and hashes, test results, axe counts, Guidepup transcripts, browser coverage, and known gaps are linked from the evidence run and summarized by `ACCESSIBILITY.md`. Do not copy them into this table.

| Experiment | Decision | Date | Reviewer | Evidence | Conditions / next |
|---|---|---|---|---|---|
| [Native dark mode](https://github.com/mgifford/design-system-lab/tree/main/experiments/dark-mode) | **Accepted as a lab experiment** | 2026-11-20 | Mike Gifford | [Live evidence](https://mgifford.github.io/design-system-lab/evidence.html) | Four components only. Not authorized upstream. Real screen reader, Voice Control, Windows High Contrast, 400% zoom, and dark icon coverage remain open. |
| [User preferences panel](https://github.com/mgifford/design-system-lab/tree/main/experiments/preferences-panel) | **Not yet decided** | — | — | [Live evidence](https://mgifford.github.io/design-system-lab/evidence.html) | No form to fill. Decide when you choose to review it. |
| [RTL logical properties](https://github.com/mgifford/design-system-lab/tree/main/experiments/rtl-logical-properties) | **Not yet decided** | — | — | [Live evidence](https://mgifford.github.io/design-system-lab/evidence.html) | Native-language review still outstanding. |
| [Native radio validation](https://github.com/mgifford/design-system-lab/tree/main/experiments/radio-validation) | **Not yet decided** | — | — | [Live evidence](https://mgifford.github.io/design-system-lab/evidence.html) | Voice Control and real screen-reader testing still outstanding. |

## Decision values

- **Accepted as a lab experiment** — may remain published with the stated limitations.
- **Changes requested** — keep it published or mark it pending, and record the requested change.
- **Rejected** — remove or archive the experiment; record why.
- **Deferred** — keep the proposal and evidence, but do not prioritize it.
- **Upstream-ready** — a human has authorized preparing an upstream contribution package. This is separate from lab acceptance.

## What “accepted” does not mean

Acceptance is not upstream adoption, WCAG conformance, a real assistive-technology validation, or a claim that the known gaps are closed. Upstream work requires a separate, explicit authorization.

## How much comes from ACCESSIBILITY.md

[`ACCESSIBILITY.md`](https://github.com/mgifford/design-system-lab/blob/main/ACCESSIBILITY.md) supplies the target, the required human checks, the known gaps, the AI/human-review rules, and the rule that automated output is not conformance. The reviewer does **not** restate those. If a check is incomplete, record it under **Conditions**, or treat it as a reason to defer the decision.

## How to add or change a decision

1. Read the experiment’s README, implementation guidance, test plan, and the current evidence summary.
2. Edit one row in the table above.
3. Use the decision values exactly.
4. Do not edit `reports/latest` or invent evidence.

A pending experiment needs no row beyond **Not yet decided**. A new experiment does not require a separate decision file; `npm run experiment:new` points its registry entry here.
