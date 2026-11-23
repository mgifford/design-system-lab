import fs from 'node:fs';
import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {bodyBackground, contrastRatio, goto, styles} from './helpers.mjs';

const registry = JSON.parse(fs.readFileSync(new URL('../../data/registry.json', import.meta.url), 'utf8'));
const routes = JSON.parse(fs.readFileSync(new URL('../../dist/data/routes.json', import.meta.url), 'utf8'));
const components = registry.components;

for (const route of routes) {
  test(`route: ${route}`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await goto(page, route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    if (!route.startsWith('fixture/')) await expect(page.getByRole('navigation', {name: 'Primary'})).toBeVisible();
    await expect(page.locator('main')).toHaveCount(1);
    expect(errors, `Uncaught page errors on ${route}`).toEqual([]);
  });
}

test('axe: no serious or critical violations on any lab route', async ({page, browserName}) => {
  test.skip(browserName !== 'chromium', 'Axe is run in Chromium; other engines are recorded as not scanned.');
  test.setTimeout(240000);
  const findings = [];
  for (const route of routes) {
    await page.goto(`/${route}`, {waitUntil: 'load'});
    const results = await new AxeBuilder({page})
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    for (const violation of results.violations) {
      if (violation.impact === 'critical' || violation.impact === 'serious') {
        findings.push(`${route}: ${violation.id} (${violation.impact}) — ${violation.help}`);
      }
    }
  }
  expect(findings, findings.join('\n')).toEqual([]);
});

for (const component of components) {
  for (const variant of ['baseline', 'experiment']) {
    test(`fixture: ${component.slug} ${variant}`, async ({page}) => {
      await goto(page, `fixture/${component.slug}-${variant}.html`);
      await expect(page.locator(`body[data-variant="${variant}"]`)).toHaveCount(1);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('.fixture-label')).toBeVisible();
      const hrefs = await page.evaluate(() => [...document.styleSheets].map(sheet => sheet.href).filter(Boolean));
      expect(hrefs.some(href => href.includes('uswds.min.css')), 'USWDS CSS should load').toBe(true);
      expect(hrefs.some(href => href.includes('experiment.css')), 'experiment CSS only on experiment').toBe(variant === 'experiment');
    });
  }
}

for (const variant of ['baseline', 'experiment']) {
  test(`accordion keyboard: ${variant}`, async ({page}) => {
    await goto(page, `fixture/accordion-${variant}.html`);
    const button = page.getByRole('button', {name: 'Who can apply?'});
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#faq-eligibility')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#faq-eligibility')).toBeHidden();
    await expect(button).toBeFocused();
  });

  test(`banner keyboard: ${variant}`, async ({page}) => {
    await goto(page, `fixture/banner-${variant}.html`);
    const button = page.getByRole('button', {name: 'How this banner works'});
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#banner-info')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });
}

test('form: invalid submission is blocked and valid submission completes locally', async ({page}) => {
  await goto(page, 'fixture/form-baseline.html');
  await page.getByRole('button', {name: 'Review application'}).click();
  expect(await page.locator('#reference').evaluate(element => element.validity.valid)).toBe(false);
  await expect(page.locator('#form-status')).toBeEmpty();
  await page.locator('#new').focus();
  await page.keyboard.press('Space');
  await page.locator('#reference').fill('Sample reference');
  await page.getByRole('button', {name: 'Review application'}).click();
  await expect(page.locator('#form-status')).toContainText('validated locally');
});

test('radio validation: invalid submit is blocked and the valid path works', async ({page, browserName}) => {
  await goto(page, 'fixture/radio-validation-baseline.html');
  await page.getByRole('button', {name: 'Continue'}).click();
  expect(await page.locator('#radio-validation-form').evaluate(form => form.checkValidity())).toBe(false);
  const activeId = await page.evaluate(() => document.activeElement?.id || '');
  test.info().annotations.push({type: 'focus-after-invalid-submit', description: `${browserName}: ${activeId || '(none)'}`});
  if (browserName === 'chromium') {
    expect(activeId).toMatch(/^contact-(email|phone)$/);
  } else {
    // Browser-specific focus placement is recorded, not normalized away.
    console.log(`[${browserName}] focus after invalid radio submit: ${activeId || '(none)'}`);
  }
  await expect(page.locator('#radio-validation-status')).toBeEmpty();
  await page.locator('#contact-phone').focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', {name: 'Continue'}).click();
  await expect(page.locator('#radio-validation-status')).toContainText('validated locally');
});

test('dark experiment: radio surface, label, and focus contrast are measured', async ({page}) => {
  await goto(page, 'fixture/form-experiment.html?theme=dark');
  const values = await page.locator('.usa-radio__label').first().evaluate(label => ({
    label: getComputedStyle(label).color,
    surface: getComputedStyle(label.closest('.usa-radio')).backgroundColor,
    body: getComputedStyle(document.body).backgroundColor
  }));
  expect(values.surface, 'The upstream white radio slab must be themed').not.toBe('rgb(255, 255, 255)');
  expect(contrastRatio(values.label, values.surface), 'radio label contrast').toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(values.label, values.body), 'radio label against page').toBeGreaterThanOrEqual(4.5);
});

for (const theme of ['light', 'dark']) {
  test(`focus contrast: ${theme}`, async ({page}) => {
    await goto(page, `fixture/accordion-experiment.html?theme=${theme}`);
    const button = page.getByRole('button', {name: 'Who can apply?'});
    await button.focus();
    await expect(button).toBeFocused();
    const values = await button.evaluate(element => ({
      outline: getComputedStyle(element).outlineColor,
      style: getComputedStyle(element).outlineStyle,
      background: getComputedStyle(document.body).backgroundColor
    }));
    expect(contrastRatio(values.outline, values.background), `${theme} focus ring contrast`).toBeGreaterThanOrEqual(3);
    expect(values.style).toBe('solid');
  });
}

test('RTL banner keeps direction, language, and keyboard behavior', async ({page}) => {
  await goto(page, 'fixture/banner-experiment.html?dir=rtl');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('[lang="ar"][dir="rtl"]')).toBeVisible();
  const button = page.getByRole('button', {name: 'How this banner works'});
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
});

test('RTL alert uses logical start border in both directions', async ({page}) => {
  await goto(page, 'fixture/alert-experiment.html?dir=rtl');
  const rtl = await styles(page, '.usa-alert', ['border-left-width', 'border-right-width', 'text-align']);
  expect(rtl['border-right-width']).toBe('8px');
  expect(rtl['border-left-width']).toBe('0px');
  expect(rtl['text-align']).toBe('start');
  await goto(page, 'fixture/alert-experiment.html');
  const ltr = await styles(page, '.usa-alert', ['border-left-width', 'border-right-width']);
  expect(ltr['border-left-width']).toBe('8px');
  expect(ltr['border-right-width']).toBe('0px');
});

test('preferences: appearance, text size, persistence, and reset', async ({page}) => {
  await goto(page, 'preferences.html');
  await page.getByLabel('Dark').check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Text size').selectOption('large');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'large');
  await page.getByLabel('Contrast').selectOption('more');
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'more');
  await page.getByLabel('Motion').selectOption('reduce');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'large');
  await page.getByRole('button', {name: 'Reset to system defaults'}).click();
  expect(await page.locator('html').getAttribute('data-theme')).toBeNull();
  expect(await page.locator('html').getAttribute('data-text-size')).toBeNull();
  expect(await page.locator('html').getAttribute('data-contrast')).toBeNull();
  expect(await page.locator('html').getAttribute('data-motion')).toBeNull();
  await expect(page.locator('#prefs-status')).toContainText('Reset to system defaults');
});

test('preferences: native controls operate by keyboard', async ({page}) => {
  await goto(page, 'preferences.html');
  await page.getByLabel('Light').focus();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Light')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('preferences: content and explanation remain readable without JavaScript', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('/preferences.html');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('noscript p')).toContainText('JavaScript is required to save preferences');
  await expect(page.locator('#prefs-form')).toBeVisible();
  await context.close();
});

test('comparison: component selection and onion isolation', async ({page}) => {
  await goto(page, 'compare.html');
  await expect(page.locator('#component option')).toHaveCount(components.length);
  await page.locator('#component').selectOption('alert');
  await expect(page.locator('#before')).toHaveAttribute('src', /alert-baseline\.html/);
  await expect(page.locator('#after')).toHaveAttribute('src', /alert-experiment\.html/);
  await page.locator('#view').selectOption('onion');
  await expect(page.locator('#before')).toHaveAttribute('inert', '');
  await expect(page.locator('#after')).toHaveAttribute('inert', '');
  await expect(page.locator('#before')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#onion-note')).toBeVisible();
  await page.locator('#view').selectOption('split');
  await expect(page.locator('#before')).not.toHaveAttribute('inert', '');
  await expect(page.locator('#onion-note')).toBeHidden();
});

test('comparison: query parameters select an experiment state', async ({page}) => {
  await goto(page, 'compare.html?component=banner&direction=rtl&theme=dark');
  await expect(page.locator('#component')).toHaveValue('banner');
  await expect(page.locator('#direction')).toHaveValue('rtl');
  await expect(page.locator('#theme')).toHaveValue('dark');
  await expect(page.locator('#before')).toHaveAttribute('src', /banner-baseline\.html\?theme=dark&dir=rtl/);
});

test('no JavaScript: accordion content is readable and dead buttons are hidden', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('/fixture/accordion-baseline.html');
  await expect(page.getByText('People who meet the published eligibility criteria')).toBeVisible();
  await expect(page.getByRole('button', {name: 'Who can apply?'})).toBeHidden();
  await context.close();
});

test('forced colors: focus remains available', async ({browser}) => {
  const context = await browser.newContext({forcedColors: 'active'});
  const page = await context.newPage();
  await page.goto('/fixture/accordion-experiment.html');
  const button = page.getByRole('button', {name: 'Who can apply?'});
  await button.focus();
  await expect(button).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)).not.toBe('none');
  await context.close();
});

test('reduced motion: transitions are near zero', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await goto(page, 'fixture/accordion-experiment.html');
  const values = await styles(page, '.usa-accordion__button', ['transition-duration']);
  expect(Number.parseFloat(values['transition-duration'])).toBeLessThanOrEqual(0.01);
  expect(await bodyBackground(page)).toBeTruthy();
});

test('component directory filters without hiding content from no-JS users', async ({page}) => {
  await goto(page, 'components.html');
  await expect(page.locator('#component-list > .card:visible')).toHaveCount(components.length);
  await page.getByLabel('Category').selectOption('Forms');
  await expect(page.locator('#component-list > .card:visible')).toHaveCount(2);
  await expect(page.locator('#component-count')).toContainText('2 of 5 components');
  await page.getByLabel('Experiment availability').selectOption('no');
  await expect(page.locator('#component-count')).toContainText('0 of 5 components');
});

test('experiment directory filters by category and status', async ({page}) => {
  await goto(page, 'experiments.html');
  await page.getByLabel('Category').selectOption('new-component');
  await expect(page.locator('#experiment-list > .card:visible')).toHaveCount(1);
  await expect(page.locator('#experiment-count')).toContainText('1 of 4 experiments');
  await page.getByLabel('Category').selectOption('all');
  await page.getByLabel('Status').selectOption('prototype');
  await expect(page.locator('#experiment-list > .card:visible')).toHaveCount(registry.experiments.filter(experiment => experiment.status === 'prototype').length);
});

test('community ideas search and status filters preserve upstream context', async ({page}) => {
  await goto(page, 'ideas.html');
  await page.getByLabel('Search title, proposal, or issue number').fill('5069');
  await expect(page.locator('#ideas > .card:visible')).toHaveCount(1);
  await expect(page.locator('#ideas .card:visible')).toContainText('Better personalization support');
  await page.getByLabel('Search title, proposal, or issue number').fill('');
  await page.getByLabel('Status').selectOption('completed');
  await expect(page.locator('#ideas > .card:visible')).toHaveCount(1);
  await expect(page.locator('#ideas .card:visible')).toContainText('Reduced-motion transitions');
});

test('landing demo: USWDS and OGDS hybrid share content', async ({page}) => {
  await goto(page, 'demo.html');
  const left = page.frameLocator('#demo-uswds');
  const right = page.frameLocator('#demo-ogds');
  await expect(left.locator('h1')).toHaveText('Get the support you need');
  await expect(right.locator('h1')).toHaveText('Get the support you need');

  const content = async frame => (await frame.locator('main').textContent()).replace(/\s+/g, '');
  expect(await content(right)).toBe(await content(left));
  expect(await right.locator('body').getAttribute('data-content-hash')).toBe(await left.locator('body').getAttribute('data-content-hash'));

  for (const tag of ['ogds-banner', 'ogds-header', 'ogds-primary-nav', 'ogds-accordion']) {
    await expect(right.locator(tag)).toHaveCount(1);
    await expect(left.locator(tag)).toHaveCount(0);
  }
  expect(await right.locator('ogds-banner').evaluate(element => Boolean(element.shadowRoot))).toBe(true);
  expect(await right.locator('ogds-header').evaluate(element => Boolean(element.shadowRoot))).toBe(true);
  await expect(right.locator('script[src*="ogds-elements.js"]')).toHaveCount(1);
  await expect(left.locator('script[src*="ogds-elements.js"]')).toHaveCount(0);

  const leftSheets = await left.locator('html').evaluate(() => [...document.styleSheets].map(sheet => sheet.href).filter(Boolean));
  const rightSheets = await right.locator('html').evaluate(() => [...document.styleSheets].map(sheet => sheet.href).filter(Boolean));
  expect(leftSheets.some(href => href.includes('colors.css'))).toBe(false);
  expect(rightSheets.some(href => href.includes('colors.css'))).toBe(true);
});

test('landing demo: disclosure is keyboard operable in both systems', async ({page}) => {
  await goto(page, 'demo.html');

  const leftButton = page.frameLocator('#demo-uswds').getByRole('button', {name: 'How do I apply?'});
  await leftButton.focus();
  await leftButton.press('Enter');
  await expect(leftButton).toHaveAttribute('aria-expanded', 'true');
  await leftButton.press('Space');
  await expect(leftButton).toHaveAttribute('aria-expanded', 'false');

  const right = page.frameLocator('#demo-ogds');
  const details = right.locator('details').first();
  const summary = details.locator('summary');
  await summary.focus();
  await summary.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await summary.press('Space');
  expect(await details.getAttribute('open')).toBeNull();
});

test('landing demo: full-width preview layout is available', async ({page}) => {
  await goto(page, 'demo.html');
  await page.locator('#preview-layout').selectOption('full');
  await expect(page.locator('.demo-compare')).toHaveAttribute('data-layout', 'full');
  const columns = await page.locator('.demo-compare').evaluate(element => getComputedStyle(element).gridTemplateColumns);
  expect(columns.trim().split(/\s+/)).toHaveLength(1);
});

test('forms demo: same content hash, OGDS shell, USWDS form controls', async ({page}) => {
  await goto(page, 'demo/forms.html');
  const left = page.frameLocator('#forms-uswds');
  const right = page.frameLocator('#forms-ogds');
  await expect(left.locator('h1')).toHaveText('Contact us');
  await expect(right.locator('h1')).toHaveText('Contact us');
  expect(await right.locator('body').getAttribute('data-content-hash')).toBe(await left.locator('body').getAttribute('data-content-hash'));

  const content = async frame => (await frame.locator('main').textContent()).replace(/\s+/g, '');
  expect(await content(right)).toBe(await content(left));

  await expect(left.locator('ogds-banner')).toHaveCount(0);
  await expect(left.locator('ogds-header')).toHaveCount(0);
  await expect(right.locator('ogds-banner')).toHaveCount(1);
  await expect(right.locator('ogds-header')).toHaveCount(1);
  await expect(left.locator('form#contact-form')).toHaveCount(1);
  await expect(right.locator('form#contact-form')).toHaveCount(1);
  await expect(left.locator('form#contact-form')).toHaveAttribute('class', /usa-form/);
  await expect(right.locator('form#contact-form')).toHaveAttribute('class', /usa-form/);

  const form = left.locator('form#contact-form');
  await form.locator('button[type="submit"]').click();
  await expect(left.locator('#contact-form-error-summary')).toBeVisible();
  await expect(left.locator('#contact-name-error')).toContainText('Enter full name');
  await expect(left.locator('#contact-name')).toHaveAttribute('aria-invalid', 'true');
  await expect(left.locator('#contact-name')).toHaveAttribute('aria-describedby', /contact-name-error/);
  expect(await left.locator('#contact-form-error-summary').evaluate(element => document.activeElement === element)).toBe(true);
  await expect(left.locator('#form-status')).toBeEmpty();
  await left.locator('#contact-name').fill('Sample Person');
  await left.locator('#contact-email').fill('sample@example.gov');
  await left.locator('#contact-subject').selectOption('general');
  await left.locator('#contact-message').fill('This is a sample message for local validation.');
  await form.locator('button[type="submit"]').click();
  await expect(left.locator('#form-status')).toContainText('validated locally');
  await expect(left.locator('#contact-form-error-summary')).toBeHidden();
  await expect(left.locator('#contact-name')).not.toHaveAttribute('aria-invalid', 'true');
});
