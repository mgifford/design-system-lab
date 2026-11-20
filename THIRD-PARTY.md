# Third-party source and licenses

## Packaged during `npm ci`

- `@uswds/uswds` v3.14.0: primarily United States public domain / CC0, with separate licenses covering included third-party code, fonts, and icons. See <https://github.com/uswds/uswds/blob/develop/LICENSE.md> and the installed package's `LICENSE.md`. The build copies distributed CSS, JS, image, and font assets and keeps the package license file.
- Playwright and `@playwright/test` (1.64.1): Apache-2.0. Development and testing only.
- `@guidepup/virtual-screen-reader` (0.32.1): MIT. Development and testing only.
- `jsdom` (26.1.0): MIT. Development and testing only.
- `marked` (18.2.1): MIT. Build-time Markdown rendering only.
- `@axe-core/playwright` (4.14.0): MPL-2.0. Development and testing only. The build does not redistribute axe-core.
- `@playwright/mcp` (0.0.86): Apache-2.0. Development tooling only.

## Build-time behavior

`marked` renders repository-authored Markdown to semantic HTML. Raw `<` in source is escaped before parsing, and script/data link schemes are removed. Markdown is rendered only during the static build; no client-side Markdown renderer is shipped.

## Referenced, not redistributed

- `mgifford/FOSDEM-website`: reference design for independent comparisons; this pilot does not copy its source code.
- `mgifford/drupal-core-lab`: GPL-2.0-or-later per its README; this pilot does not copy its source code. Its viewer, coverage, and report ideas informed independent implementation.
- `open-government-design-system/ogds-elements`: research link only. Verify licensing before downloading or including source or package distribution.
- `uswds/uswds-elements`: research link only. No source is bundled.
- `mgifford/uswds-sandbox`: existing CC0 reference for future fixtures; no source copied.

The repository's MIT license applies to original pilot code and documentation only. It does not override upstream licenses, patent rights, or trademark rights.

## Landing-demo content and OGDS Elements

- `@ogds/elements` `1.0.0-beta.2`: public domain by permission confirmed to the lab maintainer on 2026-11-20. The upstream `LICENSE` file and npm `license` metadata are still pending; see [docs/OGDS-PERMISSION.md](docs/OGDS-PERMISSION.md) for the pinned tag/commit, tarball integrity, scope, and component boundary. The lab bundles the published package with `esbuild` and copies its published token CSS; it does not modify OGDS source.
- `@ogds/tokens` `1.0.0-alpha.3`: OGDS project package, covered by the same permission record until upstream licence metadata is published.
- `lit`: BSD-3-Clause; included in the OGDS browser bundle with its licence notices retained.
- `esbuild` `0.28.2`: MIT; build-time bundling only.
- `mgifford/uswds-sandbox`: package metadata declares CC0-1.0 (no root LICENSE file). The landing-demo copy is adapted from its public sample content with attribution. The lab does not copy its build system or source code.
