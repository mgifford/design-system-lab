# Performance evidence

The lab records a small, controlled performance sample for each baseline/experiment fixture pair. It is evidence about the cost of the authored fixture, not a field measurement and not a Lighthouse score.

## What is measured

Each `fixture/<component>-<baseline|experiment>.html` route is loaded three times by default in a new browser context, at a 1280 × 850 viewport, light colour scheme, with **4× CPU throttling**. Network is localhost with no shaping.

For each run the collector records:

- Resource Timing transfer size and request count, grouped as HTML, CSS, JavaScript, fonts, images, and other
- DOM element count
- Navigation Timing: TTFB, DOMContentLoaded, load
- Paint entries: First Contentful Paint
- Largest Contentful Paint, Cumulative Layout Shift, long tasks, and an approximate Total Blocking Time from `PerformanceObserver`

The median and min–max for three runs are shown in the evaluation workspace. Raw per-run values are in `performance.json` in the evidence run.

## Hard budgets vs timing warnings

`data/performance-budgets.json` defines **hard ceilings** for transfer size, request count, and DOM elements, plus **warning** thresholds for timing metrics.

- A hard budget failure is a validation error unless `--allow-evidence-failures` is used.
- Timing thresholds warn only. Local CI timing is noisy; a change of a few milliseconds is not a finding.
- The budgets are initial ceilings for this lab, not performance targets and not a statement that a page is “fast.” Update them only with a measured rationale in a reviewed change.
- No aggregate performance score is produced.

## Comparison

For each component the baseline/experiment pair is compared by:

- transfer size delta in bytes and percent
- request count delta
- DOM element delta
- timing median delta, with the spread retained

The workspace labels all timing values as observations and links the raw JSON and budgets.

## Why not Lighthouse or Sitespeed.io yet

Lighthouse CI and sitespeed.io are useful, but they would duplicate the lab's existing axe runs and introduce a much heavier execution model:

- Lighthouse’s accessibility category is axe-core; the lab already runs axe on the initial route and every declared state.
- Sitespeed.io’s `--axe.enable` is also axe-core. Running a second axe implementation with different timing creates conflicting counts, not more truth.
- The lab is a static GitHub Pages site with small fixtures. A Docker/FFmpeg/Graphite stack is disproportionate.
- Local timing variance means a performance score gate would be misleading.

The next step, if needed, is a **separate scheduled Lighthouse CI job** with narrow resource/DOM budgets and raw LHR artifacts, not an accessibility score. Sitespeed.io is only worth adopting if filmstrip/video, HAR analysis, or long-term trend dashboards become real requirements. The current method is documented above.

## Limits

- Localhost and CPU throttling are not a field network or device distribution.
- Three runs are a small sample; the median is descriptive, not inferential.
- The fixture page includes all declared states by default; this is not the same as a single component state in production.
- The fixture CSS and USWDS distribution are pinned; a future USWDS release must be reviewed and re-measured.
- No energy, carbon, or cost estimate is claimed.
- No Lighthouse, WebPageTest, or Sitespeed.io result is used as accessibility evidence.
