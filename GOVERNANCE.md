# Governance for the pilot

This is an independent exploratory project, not a USWDS release channel or an alternative standards body.

## Experiment categories

- **Component improvement:** a change to an existing USWDS component.
- **New component:** a proposal with no stable equivalent; the absence is stated, not fabricated as a baseline.
- **Cross-component capability:** a systematic change such as appearance preferences.
- **Alternative implementation:** a different approach to an existing interaction or layout problem.

Every registry experiment declares one category and one lifecycle status.

## Decision lifecycle

1. **Proposed:** Reference an authoritative issue, read its discussion, and distinguish implementation status from triage/closure status.
2. **Under investigation:** Describe the user need, scope, and what the experiment would change. Keep existing USWDS defaults unchanged.
3. **Prototype:** Build an independent fixture or page with source provenance and implementation guidance.
4. **Automated evidence collected:** Attach browser results, state-specific Guidepup transcripts, screenshots, axe observations, and failures.
5. **Ready for human review:** The contributor confirms the evidence is complete enough to review and lists what is missing.
6. **Changes requested / reviewed and accepted:** A human examines the evidence and records one row in `docs/EXPERIMENT-DECISIONS.md`, noting limitations and any conditions.
7. **Submitted upstream / adopted upstream:** Only after explicit human authorization. Approval here is not approval upstream.
8. **Deferred / archived:** A proposal may end as useful documentation or a rejected experiment. Not every experiment should become an upstream pull request.

## Human review

A human reviewer must assess the user need, implementation quality, semantics, keyboard behavior, accessibility evidence, browser compatibility, backward compatibility, maintenance implications, design consistency, and community/upstream context. The decision and limitations are recorded. AI may draft the material but cannot impersonate a reviewer or mark its own work as human-approved.

## AI-assisted development

Generated code and summaries are proposals. The contributor must identify AI involvement, examine licenses, verify security and accessibility claims, and assume responsibility for correctness. Autonomous approval, publication of uncertain findings as facts, and silent code modification are prohibited.

## Source provenance

All upstream code must keep its original license. A baseline must be pinned to an immutable published version or commit, not an unqualified `main` reference. `data/sources.lock.json` records the release, commit, package-lock hash, and asset hashes. A newer release is reported, never promoted automatically. Promotion requires a reviewed change and an explicit maintainer decision.

Do not treat an issue closed as completed as unresolved; track its successor issue and upstream rationale. Do not treat a closed-not-planned issue as proof that the user need was rejected.

## Maintainer accountability

Human maintainers decide whether to accept or reject an experimental change. Record dissent and unknowns. If evidence is inconclusive, classify the outcome accordingly rather than claiming a pass. No upstream issue, comment, or pull request may be created without explicit authorization.
