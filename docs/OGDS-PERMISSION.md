# OGDS Elements permission and provenance

**Status: permission confirmed. Upstream licence file and npm metadata are still pending.**

On 2026-11-20, the OGDS Elements project confirmed permission to the USWDS Futures Lab maintainer for this comparison. The confirmed position is that OGDS Elements is dedicated to the **public domain**, consistent with the default treatment of U.S. government works and with USWDS. A copy of the written permission should be retained with the project’s records; this page records the scope used by the lab.

## Pinned source

- Package: `@ogds/elements`
- Version: `1.0.0-beta.2`
- Git tag: `v1.0.0-beta.2`
- Commit: `59b05f1`
- Tarball: `https://registry.npmjs.org/@ogds/elements/-/elements-1.0.0-beta.2.tgz`
- Integrity: `sha512-yqyqrJDFuQ0ZrFvqamkOjBLJhhnOOZ+D0ArQ5V8kU3VdmmbMf0433CwdhPrGZ4tY9J6sjIii4wQ8Glwuboyyaw==`

The lab bundles the published package with `esbuild` for the browser and copies the published token CSS. It does not modify OGDS source.

## Third-party dependencies

- `lit` — BSD-3-Clause. Included in the browser bundle with its licence notices retained.
- `@ogds/tokens` `1.0.0-alpha.3` — part of the OGDS project. Its own upstream licence metadata is also pending; treat it under the same OGDS permission until the upstream licence file/npm metadata is updated.
- `@uswds/uswds` `3.14.0` — public domain / CC0, with separate third-party notices in the installed package.

## Scope and limits

- The permission covers this lab’s comparison use, evidence screenshots, and published static builds with attribution.
- It does not imply endorsement by OGDS, USWDS, GSA, or any agency.
- It does not establish WCAG conformance, browser support, or production fitness.
- The lab must not describe the OGDS hybrid as a full replacement for USWDS, and must record components that remain USWDS.
- If the upstream licence or package name changes, update this record and the pinned version; do not silently retarget.

## Current component boundary

The beta.2 package exports built modules for banner, header/primary navigation, accordion, accordion-toggle, and task list. It includes `ogds-alert` source but no built alert module; the lab therefore keeps the USWDS alert on both sides and records the gap in the comparison matrix.

## Attribution

OGDS Elements is an independent open-source project: <https://github.com/open-government-design-system/ogds-elements>. The lab’s MIT licence applies only to original lab code and documentation, not to OGDS or USWDS assets.
