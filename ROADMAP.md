# Pilot roadmap

## P0: Validate the delivered starter

- [ ] Run `npm install` locally and commit the generated `package-lock.json`; switch CI to `npm ci`.
- [ ] Inspect real `@uswds/uswds@3.14.0` assets and verify all baseline fixtures match official implementation guidance.
- [ ] Run Chromium tests, Guidepup evidence collector and inspect every report.
- [ ] Run Firefox and WebKit tests, record coverage gaps, and confirm native validation behavior.
- [ ] Confirm correct independent deployment under the final GitHub Pages repository subpath.

## P1: Complete a defensible dark mode pilot

- [ ] Review all semantic token roles, including text, links, icons, borders, backgrounds, warnings, forms and focus.
- [ ] Implement component-specific expected contrast checks and documented manual reviews.
- [ ] Add `prefers-contrast`, color scheme persistence, high zoom and RTL journey scenarios without overriding OS forced colors.
- [ ] Document how selected techniques could be proposed upstream without requiring a whole Sass redesign.
- [ ] Record unchanged behavior for the existing light theme and reduced-motion support.

## P2: Add interoperable adapters

- [ ] Verify OGDS Elements licensing and select an immutable package version; build isolated test frames from real package code, never a lookalike.
- [ ] Add USWDS Elements only when stable enough to reproduce and license-reviewed.
- [ ] Compare like-for-like *capabilities*, not assumed identical component markup.
- [ ] Preserve source versions, compatibility notes and missing components.

## P3: Sustainable community issue workflow

- [ ] Add a read-only GitHub issue/discussion importer with provenance and explicit human curation.
- [ ] Import issue comments and linked PR evidence, preserving why something was closed or consolidated.
- [ ] Add reviewer decisions, screenshots and before/after accessibility-tree differences.
- [ ] Evaluate selected RTL, native form validation, accordion loading and contrast false-positive proposals.
- [ ] Generate upstream-ready PR drafts only after the pilot has reproducible, reviewed evidence.
