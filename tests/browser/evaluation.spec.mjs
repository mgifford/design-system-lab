import fs from 'node:fs';
import {test, expect} from '@playwright/test';
import {goto} from './helpers.mjs';

const base = 'compare.html';

async function evidenceData(page) {
  return page.evaluate(() => fetch('data/evidence.json').then(response => response.json()).catch(() => ({generated: false})));
}

test('evaluation: workspace is first-class and registry-driven', async ({page}) => {
  await goto(page, base);
  await expect(page.getByRole('navigation', {name: 'Primary'}).getByRole('link', {name: 'Evaluate'})).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#eval-title')).toHaveText('Accordion');
  await expect(page.locator('#component option')).toHaveCount(5);
  await expect(page.locator('#view option')).toHaveCount(4);
  await expect(page.locator('#state option').first()).toHaveText('Both collapsed');
  await expect(page.locator('#eval-evidence')).toContainText(/Evidence run|No automated evidence/);
  await expect(page.locator('#eval-accessibility')).toHaveAttribute('href', /designsystem\.digital\.gov/);
});

test('evaluation: URL conditions apply to fixtures and controls', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning&theme=dark&motion=reduce&direction=rtl&language=ar&width=390&view=reveal&textSize=200&spacing=wcag&contrast=more`);
  await expect(page.locator('#component')).toHaveValue('alert');
  await expect(page.locator('#state')).toHaveValue('warning');
  await expect(page.locator('#theme')).toHaveValue('dark');
  await expect(page.locator('#motion')).toHaveValue('reduce');
  await expect(page.locator('#direction')).toHaveValue('rtl');
  await expect(page.locator('#language')).toHaveValue('ar');
  await expect(page.locator('#width')).toHaveValue('390');
  await expect(page.locator('#textSize')).toHaveValue('200');
  await expect(page.locator('#spacing')).toHaveValue('wcag');
  await expect(page.locator('#view')).toHaveValue('reveal');
  await expect(page.locator('#before')).toHaveAttribute('src', /state=warning&theme=dark&dir=rtl&lang=ar&motion=reduce&contrast=more&textSize=200&spacing=wcag/);
  await expect(page.locator('#reveal-control')).toBeVisible();
  await expect(page.locator('#before')).toHaveAttribute('inert', '');
  await expect(page.locator('#reveal-note')).toBeVisible();
  expect(page.url()).toContain('v=1');
});

test('evaluation: invalid parameters fall back and are reported', async ({page}) => {
  await goto(page, `${base}?component=nope&state=nope&view=hack&theme=neon&width=9999&capture=nope`);
  await expect(page.locator('#component')).toHaveValue('accordion');
  await expect(page.locator('#state')).toHaveValue('collapsed');
  await expect(page.locator('#view')).toHaveValue('split');
  await expect(page.locator('#theme')).toHaveValue('system');
  await expect(page.locator('#width')).toHaveValue('1280');
  await expect(page.locator('#param-status')).toBeVisible();
  await expect(page.locator('#param-status')).toContainText('Ignored invalid value');
  await expect(page.locator('#param-status')).toContainText('component');
  await expect(page.locator('#param-status')).toContainText('capture');
});

test('evaluation: accordion and banner states are reproducible in both panes', async ({page}) => {
  await goto(page, `${base}?component=accordion&state=collapsed`);
  await expect(page.locator('#before')).toHaveAttribute('src', /state=collapsed/);
  const baseline = page.frameLocator('#before');
  const experiment = page.frameLocator('#after');
  for (const frame of [baseline, experiment]) {
    await expect(frame.getByRole('button', {name: 'Who can apply?'})).toHaveAttribute('aria-expanded', 'false');
    await expect(frame.locator('#faq-eligibility')).toBeHidden();
    await expect(frame.getByRole('button', {name: 'Which documents do I need?'})).toHaveAttribute('aria-expanded', 'false');
  }
  await page.locator('#state').selectOption('expanded');
  for (const frame of [baseline, experiment]) {
    await expect(frame.getByRole('button', {name: 'Who can apply?'})).toHaveAttribute('aria-expanded', 'true');
    await expect(frame.locator('#faq-eligibility')).toBeVisible();
    await expect(frame.getByRole('button', {name: 'Which documents do I need?'})).toHaveAttribute('aria-expanded', 'true');
  }

  await page.locator('#component').selectOption('banner');
  await page.locator('#state').selectOption('expanded');
  await expect(page.locator('#before')).toHaveAttribute('src', /state=expanded/);
  await expect(page.frameLocator('#before').getByRole('button', {name: 'How this banner works'})).toHaveAttribute('aria-expanded', 'true');
  await expect(page.frameLocator('#after').locator('#banner-info')).toBeVisible();
  await page.locator('#state').selectOption('collapsed');
  await expect(page.frameLocator('#before').getByRole('button', {name: 'How this banner works'})).toHaveAttribute('aria-expanded', 'false');
  await expect(page.frameLocator('#before').locator('#banner-info')).toBeHidden();
});

test('evaluation: form and radio states are reproducible in both panes', async ({page}) => {
  await goto(page, `${base}?component=form&state=invalid`);
  await expect(page.locator('#before')).toHaveAttribute('src', /state=invalid/);
  for (const frame of [page.frameLocator('#before'), page.frameLocator('#after')]) {
    expect(await frame.locator('#application').evaluate(form => form.checkValidity())).toBe(false);
    await expect(frame.locator('#form-status')).toHaveText('');
  }
  await page.locator('#state').selectOption('filled');
  for (const frame of [page.frameLocator('#before'), page.frameLocator('#after')]) {
    await expect(frame.locator('#new')).toBeChecked();
    await expect(frame.locator('#reference')).toHaveValue('Sample reference');
    expect(await frame.locator('#application').evaluate(form => form.checkValidity())).toBe(true);
    await expect(frame.locator('#form-status')).toHaveText('');
  }
  await page.locator('#state').selectOption('valid');
  for (const frame of [page.frameLocator('#before'), page.frameLocator('#after')]) {
    await expect(frame.locator('#form-status')).toContainText('validated locally');
  }

  await page.locator('#component').selectOption('radio-validation');
  await page.locator('#state').selectOption('selected');
  for (const frame of [page.frameLocator('#before'), page.frameLocator('#after')]) {
    await expect(frame.locator('#contact-email')).toBeChecked();
    await expect(frame.locator('#radio-validation-status')).toHaveText('');
  }
  await page.locator('#state').selectOption('valid');
  for (const frame of [page.frameLocator('#before'), page.frameLocator('#after')]) {
    await expect(frame.locator('#radio-validation-status')).toContainText('validated locally');
  }
});

test('evaluation: every declared alert state is selectable and reproducible', async ({page}) => {
  await goto(page, `${base}?component=alert&state=info`);
  const states = await page.locator('#state option').evaluateAll(options => options.map(option => option.value));
  expect(states.length).toBeGreaterThanOrEqual(12);
  for (const state of states) {
    await page.locator('#state').selectOption(state);
    await expect(page.locator('#before')).toHaveAttribute('src', new RegExp(`state=${state}`));
    await expect(page.locator('#state-description')).not.toBeEmpty();
  }
});

test('evaluation: side-by-side panes share the available width by default', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning`);
  await expect(page.locator('#sizing')).toHaveValue('split');
  await expect(page.locator('#width')).toBeDisabled();
  await expect(page.locator('#pane-size-note')).toContainText('share the available width');
  const widths = await page.evaluate(() => [document.getElementById('before').getBoundingClientRect().width, document.getElementById('after').getBoundingClientRect().width]);
  expect(widths[0]).toBeGreaterThan(100);
  expect(widths[1]).toBeGreaterThan(100);
  expect(widths[0]).toBeLessThan(1200);
  expect(widths[1]).toBeLessThan(1200);
  expect(Math.abs(widths[0] - widths[1])).toBeLessThan(3);
  const overflow = await page.locator('#stage').evaluate(element => element.scrollWidth - element.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator('#pane-size-before')).toContainText('viewport');
  await expect(page.locator('#pane-size-after')).toContainText('viewport');
});

test('evaluation: split slider is keyboard operable and changes both pane widths', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning`);
  const before = await page.locator('#before').evaluate(element => element.getBoundingClientRect().width);
  const slider = page.locator('#split');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#split-output')).toContainText('65% baseline / 35% experiment');
  const widths = await page.evaluate(() => [document.getElementById('before').getBoundingClientRect().width, document.getElementById('after').getBoundingClientRect().width]);
  expect(widths[0]).toBeGreaterThan(widths[1]);
  expect(widths[0]).toBeGreaterThan(before);
  expect(page.url()).toContain('split=65');
});

test('evaluation: actual sizing warns about overflow and offers split width', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning&sizing=actual&width=1280`);
  await expect(page.locator('#sizing')).toHaveValue('actual');
  await expect(page.locator('#width')).toBeEnabled();
  await expect(page.locator('#pane-overflow-note')).toBeVisible();
  await expect(page.locator('#pane-overflow-note')).toContainText('switch to split width');
  await page.locator('#use-split').click();
  await expect(page.locator('#sizing')).toHaveValue('split');
  await expect(page.locator('#pane-overflow-note')).toBeHidden();
  await expect(page.locator('#width')).toBeDisabled();
});

test('evaluation: fit sizing scales the fixed viewport and says so', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning&sizing=fit&width=1280`);
  await expect(page.locator('#sizing')).toHaveValue('fit');
  await expect(page.locator('#width')).toBeEnabled();
  const transform = await page.locator('#before').evaluate(element => getComputedStyle(element).transform);
  expect(transform).not.toBe('none');
  await expect(page.locator('#pane-size-before')).toContainText('% scale');
  await expect(page.locator('#pane-size-note')).toContainText('scaled');
  await page.locator('#sizing').selectOption('actual');
  expect(await page.locator('#before').evaluate(element => getComputedStyle(element).transform)).toBe('none');
});

test('evaluation: sizing and split survive URL round-trips', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning&sizing=actual&split=65`);
  await expect(page.locator('#sizing')).toHaveValue('actual');
  await expect(page.locator('#split')).toHaveValue('65');
  await expect(page.locator('#split-output')).toContainText('65% baseline / 35% experiment');
  expect(page.url()).toContain('sizing=actual');
  expect(page.url()).toContain('split=65');
});

test('evaluation: four comparison modes expose the right controls', async ({page}) => {
  await goto(page, `${base}?component=alert&state=info`);
  const view = page.locator('#view');
  await view.selectOption('onion');
  await expect(page.locator('#onion-control')).toBeVisible();
  await expect(page.locator('#onion-note')).toBeVisible();
  await expect(page.locator('#before')).toHaveAttribute('inert', '');
  await expect(page.locator('#after')).toHaveAttribute('inert', '');

  await view.selectOption('reveal');
  await expect(page.locator('#reveal-control')).toBeVisible();
  await expect(page.locator('#onion-control')).toBeHidden();
  await expect(page.locator('#reveal-note')).toBeVisible();
  await expect(page.locator('#before')).toHaveAttribute('inert', '');

  await view.selectOption('difference');
  await expect(page.locator('#difference-panel')).toBeVisible();
  await expect(page.locator('#diff-summary')).toContainText(/Changed pixels|No captured|coverage gap/i);

  await view.selectOption('split');
  await expect(page.locator('#before')).not.toHaveAttribute('inert', '');
  await expect(page.locator('#after')).not.toHaveAttribute('inert', '');
  await expect(page.locator('#difference-panel')).toBeHidden();
  await expect(page.locator('#reveal-note')).toBeHidden();
  await expect(page.locator('#onion-note')).toBeHidden();
});

test('evaluation: reveal slider is keyboard operable', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning&view=reveal`);
  const slider = page.locator('#reveal');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#reveal-output')).toHaveText('52%');
  expect(await page.locator('#stage').evaluate(element => element.style.getPropertyValue('--reveal-position'))).toBe('52%');
  await expect(slider).toBeFocused();
});

test('evaluation: onion opacity is keyboard operable and announced', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning&view=onion`);
  const slider = page.locator('#opacity');
  await slider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#opacity-output')).toHaveText('49%');
  expect(await page.locator('#stage').evaluate(element => element.style.getPropertyValue('--onion-opacity'))).toBe('0.49');
});

test('evaluation: evaluator display is separate from fixture conditions', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('uswds-lab-prefs', JSON.stringify({theme: 'dark', textSize: 'large', contrast: 'more', motion: 'reduce'}));
  });
  await goto(page, `${base}?component=accordion&theme=light&render=live`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'large');
  await expect(page.locator('#theme')).toHaveValue('light');
  const frame = page.frameLocator('#before');
  await expect(frame.locator('html')).toHaveAttribute('data-mode', 'light');
  expect(await frame.locator('html').getAttribute('data-text-size')).toBeNull();

  await page.locator('#eval-display-reset').click();
  expect(await page.locator('html').getAttribute('data-theme')).toBeNull();
  expect(await page.locator('html').getAttribute('data-text-size')).toBeNull();
});

test('fixtures ignore stored lab preferences unless prefs=1 is explicit', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('uswds-lab-prefs', JSON.stringify({theme: 'dark', textSize: 'large', contrast: 'more', motion: 'reduce'}));
  });
  await goto(page, 'fixture/accordion-experiment.html');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'system');
  expect(await page.locator('html').getAttribute('data-text-size')).toBeNull();

  await goto(page, 'fixture/accordion-experiment.html?prefs=1');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'large');
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'more');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
});

test('evaluation: manual results require a person and export locally', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning`);
  const testId = 'alert-color-alone';
  const article = page.locator(`#manual-${testId}`);
  await expect(article).toBeVisible();
  await expect(page.locator('#manual-summary')).toContainText('0 of 11');

  await article.locator('[data-manual-field="status"]').selectOption('pass');
  await article.locator('[data-manual-field="reviewer"]').fill('Test Reviewer');
  await article.locator('[data-manual-field="notes"]').fill('Heading and text carried the meaning in grayscale.');
  await expect(page.locator('#manual-summary')).toContainText('1 of 11');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('uswds-lab-manual-results')));
  expect(stored[testId].status).toBe('pass');
  expect(stored[testId].reviewer).toBe('Test Reviewer');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#manual-export-json').click()
  ]);
  const file = await download.path();
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(payload.warning).toContain('Not published evidence');
  expect(payload.tests.find(entry => entry.id === testId).result.status).toBe('pass');

  await page.locator('#manual-reset').click();
  await expect(page.locator('#manual-summary')).toContainText('0 of 11');
});

test('evaluation: not applicable needs a justification', async ({page}) => {
  await goto(page, `${base}?component=alert`);
  const article = page.locator('#manual-alert-color-alone');
  const statusSelect = article.locator('[data-manual-field="status"]');
  await statusSelect.selectOption('not-applicable');
  await expect(page.locator('#manual-status')).toContainText('requires a justification');
  await expect(statusSelect).toHaveValue('not-tested');
  const stored = await page.evaluate(() => localStorage.getItem('uswds-lab-manual-results'));
  expect(stored === null || !JSON.parse(stored).alert).toBeTruthy();
});

test('evaluation: copy link carries a reproducible configuration', async ({page, context}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await goto(page, `${base}?component=alert&state=success&view=onion&width=768`);
  await page.locator('#copy-link').click();
  await expect(page.locator('#copy-status')).toContainText('copied');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('v=1');
  expect(clipboard).toContain('component=alert');
  expect(clipboard).toContain('state=success');
  expect(clipboard).toContain('view=onion');
  expect(clipboard).toContain('width=768');
});

test('evaluation: saved presets restore a configuration in this browser', async ({page}) => {
  await goto(page, `${base}?component=alert&state=error&width=320&theme=dark`);
  await page.locator('#preset-name').fill('Narrow dark alert');
  await page.locator('#preset-save').click();
  await expect(page.locator('#saved-presets')).toContainText('Narrow dark alert');
  await page.locator('#component').selectOption('banner');
  await expect(page.locator('#component')).toHaveValue('banner');
  await page.locator('#saved-presets [data-saved-preset="0"]').click();
  await expect(page.locator('#component')).toHaveValue('alert');
  await expect(page.locator('#state')).toHaveValue('error');
  await expect(page.locator('#width')).toHaveValue('320');
  await expect(page.locator('#theme')).toHaveValue('dark');
});

test('evaluation: reset fixture conditions keeps the component and state', async ({page}) => {
  await goto(page, `${base}?component=alert&state=error&theme=dark&width=320&view=onion&motion=reduce`);
  await page.locator('#fixture-reset').click();
  await expect(page.locator('#component')).toHaveValue('alert');
  await expect(page.locator('#state')).toHaveValue('error');
  await expect(page.locator('#theme')).toHaveValue('system');
  await expect(page.locator('#motion')).toHaveValue('system');
  await expect(page.locator('#width')).toHaveValue('1280');
  await expect(page.locator('#view')).toHaveValue('split');
  await expect(page.locator('#param-status')).toContainText('Fixture conditions reset');
});

test('evaluation: captured conditions use matched screenshots and lock fixture controls', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning&render=captured&capture=forced-colors`);
  await expect(page.locator('#render')).toHaveValue('captured');
  await expect(page.locator('#capture')).toHaveValue('forced-colors');
  await expect(page.locator('#capture-note')).toBeVisible();
  await expect(page.locator('#theme')).toBeDisabled();
  const evidence = await evidenceData(page);
  const pair = (evidence.comparison?.pairs || []).find(entry => entry.component === 'alert' && entry.state === 'warning' && entry.condition === 'forced-colors');
  if (pair) {
    await expect(page.locator('#capture-before')).toBeVisible();
    await expect(page.locator('#capture-before')).toHaveAttribute('src', /pairs\/alert\/warning--forced-colors--baseline\.png/);
    await expect(page.locator('#capture-missing')).toBeHidden();
    await page.locator('#view').selectOption('difference');
    await expect(page.locator('#diff-canvas')).toBeVisible();
    await expect(page.locator('#diff-summary')).toContainText('Changed pixels');
    await expect(page.locator('#diff-summary')).toContainText('not an accessibility score');
  } else {
    await expect(page.locator('#capture-missing')).toBeVisible();
    await expect(page.locator('#capture-missing')).toContainText('gap');
  }
});

test('evaluation: focus inspector reports role and name from a live pane', async ({page}) => {
  await goto(page, `${base}?component=accordion&state=default`);
  await page.locator('#focus-toggle').click();
  await expect(page.locator('#focus-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.frameLocator('#before').getByRole('button', {name: 'Who can apply?'}).focus();
  await expect(page.locator('#focus-before')).toContainText(/button/);
  await expect(page.locator('#focus-before')).toContainText('Who can apply?');
  await expect(page.locator('#focus-status')).toContainText(/Baseline/);
});

test('evaluation: works at 320 CSS pixels without page overflow', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await goto(page, `${base}?component=alert&state=warning&width=320`);
  await expect(page.locator('#eval-controls')).toBeVisible();
  await expect(page.locator('#component')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('evaluation: controls remain visible in forced colours', async ({browser}) => {
  const context = await browser.newContext({forcedColors: 'active'});
  const page = await context.newPage();
  await page.goto('/compare.html?component=alert&state=warning');
  await expect(page.locator('#component')).toBeVisible();
  await page.locator('#component').focus();
  const outline = await page.locator('#component').evaluate(element => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe('none');
  await context.close();
});

test('evaluation: no-JavaScript fallback offers direct fixtures and explanation', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('/compare.html?component=alert&state=warning');
  await expect(page.locator('main h1')).toHaveText('Accordion');
  await expect(page.locator('#no-js-note')).toBeVisible();
  await expect(page.locator('#no-js-note')).toContainText('requires JavaScript');
  await expect(page.locator('a[href="fixture/accordion-baseline.html"]').first()).toBeVisible();
  await expect(page.locator('#preview-conditions')).toContainText('Live preview requires JavaScript');
  await context.close();
});

test('evaluation: entry points from component, experiment, and evidence pages', async ({page}) => {
  await goto(page, 'component/alert.html');
  await expect(page.getByRole('link', {name: 'Evaluate this component'})).toHaveAttribute('href', /compare\.html\?component=alert&experiment=dark-mode/);
  await goto(page, 'experiment/dark-mode.html');
  await expect(page.getByRole('link', {name: 'Evaluate this experiment'})).toHaveAttribute('href', /compare\.html\?component=accordion&experiment=dark-mode/);
  await goto(page, 'experiments.html');
  await expect(page.locator('#experiment-preference')).toBeVisible();
  await page.locator('#experiment-preference').selectOption('forced-colors');
  await expect(page.locator('#experiment-list .card:visible')).toHaveCount(3);
  await page.locator('#experiment-evidence').selectOption('complete');
  await expect(page.locator('#experiment-count')).toBeVisible();
  await page.locator('#experiment-evidence').selectOption('all');
  await page.locator('#experiment-preference').selectOption('all');
  await page.locator('#experiment-concern').selectOption('screen-reader');
  await expect(page.locator('#experiment-list .card:visible')).toHaveCount(1);
  await page.locator('#experiment-concern').selectOption('all');
  await page.locator('#experiment-manual').selectOption('defined');
  await expect(page.locator('#experiment-list .card:visible')).toHaveCount(3);
});

test('evaluation: performance evidence is present or an explicit gap', async ({page}) => {
  await goto(page, `${base}?component=alert&state=warning`);
  const summary = page.locator('#performance-summary');
  await expect(summary).not.toBeEmpty();
  const text = await summary.textContent();
  expect(text).toMatch(/No performance evidence|No performance pair|Resource cost/);
  if (/Resource cost/.test(text)) {
    await expect(summary).toContainText('Total transfer');
    await expect(summary).toContainText('not a Lighthouse score');
  }
});

test('evaluation: evidence never reports a missing run as passing', async ({page}) => {
  await goto(page, `${base}?component=alert`);
  const text = await page.locator('#eval-evidence').textContent();
  expect(text).toMatch(/Axe counts are not a conformance claim|not a conformance claim|No automated evidence/);
  expect(text).not.toMatch(/WCAG (conformant|conformance achieved)/i);
});
