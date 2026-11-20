# Governance for the pilot

This is an independent exploratory project, not a USWDS release channel or an alternative standards body.

## Decision lifecycle

1. **Candidate:** Reference an authoritative issue, review its discussion, and distinguish implementation status from triage/closure status.
2. **Proposed:** Describe the user need and what the experiment would change. Keep existing USWDS defaults unchanged until explicitly accepted.
3. **Built:** Create an independent fixture with source provenance, a new variation, a test and a reproduction guide.
4. **Observed:** Attach machine-generated browser results, screenshots where useful, virtual speech transcripts and failures.
5. **Reviewed:** A human explicitly examines evidence and signs a decision record (`reports/templates/DECISION.md`), noting limitations.
6. **Upstream-ready:** Draft an issue/PR description for the appropriate maintainer. Submit only after human authorization. Approval here is not approval upstream.

## AI-assisted development

Generated code and summaries may be offered as proposals. The contributor must identify AI involvement, examine licenses, verify security and accessibility claims, and assume responsibility for correctness. Autonomous approval, publication of uncertain findings as facts, and silent code modification are prohibited.

## Source provenance

All upstream code must keep its original license. A baseline must be pinned to an immutable published version or commit, not an unqualified `main` reference. Use an evidence manifest with the actual version. Do not treat an issue closed as completed; track its successor issue and upstream rationale.

## Maintainer accountability

Human maintainers decide whether to accept or reject an experimental change. Record dissent and unknowns. If evidence is inconclusive, classify the outcome accordingly rather than claiming a pass.
