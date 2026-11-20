# Test plan: logical properties for RTL

## Deterministic browser checks

- [ ] Banner and alert fixtures load in LTR and RTL.
- [ ] `document.documentElement.dir` is `rtl` for `?dir=rtl`.
- [ ] The page language remains `en` unless `?lang=ar` is explicitly requested.
- [ ] The Arabic sample has `lang="ar"` and `dir="rtl"`.
- [ ] The alert's computed start border is on the right in RTL and on the left in LTR.
- [ ] Accordion and banner button text uses `text-align:start`.
- [ ] The banner disclosure remains keyboard operable in RTL.
- [ ] Focus remains visible in RTL and dark mode.
- [ ] 320px viewport keeps content readable.
- [ ] LTR screenshots and computed values are recorded as the regression reference.

## Evidence

- [ ] Guidepup transcript in RTL.
- [ ] Screenshots in LTR and RTL.
- [ ] Axe scan in both directions.

## Human review

A native Arabic speaker and a human reviewer must assess the sample and the layout. Record the decision and any conditions in [the central decision log](https://github.com/mgifford/design-system-lab/blob/main/docs/EXPERIMENT-DECISIONS.md). Automated computed styles are not a substitute for that review.
