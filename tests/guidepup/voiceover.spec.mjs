/*
 * Guidepup automates the real VoiceOver screen reader on macOS.
 * This is automated AT evidence, not a human screen-reader session.
 */
import {voiceOverTest as test} from '@guidepup/playwright';
import {expect} from '@playwright/test';

test.describe.configure({mode: 'serial'});
test.use({voiceOverStartOptions: {capture: true}});

test.describe('Guidepup automated VoiceOver (not human testing)', () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({
      type: 'method',
      description: 'Guidepup automation of macOS VoiceOver. Not a human session and not WCAG conformance.'
    });
  });

  async function transcript(testInfo, voiceOver, label) {
    const phrases = await voiceOver.spokenPhraseLog();
    await testInfo.attach(`${label}-voiceover.json`, {
      body: JSON.stringify({
        method: 'Guidepup automated VoiceOver (macOS)',
        caveat: 'Automated AT observation. Not a human screen-reader session and not WCAG conformance.',
        label,
        phrases
      }, null, 2),
      contentType: 'application/json'
    });
    return phrases;
  }

  test('a dynamically inserted status alert is announced without moving focus', async ({page, voiceOver}, testInfo) => {
    await page.goto('/fixture/alert-experiment.html?state=dynamic');
    const trigger = page.getByRole('button', {name: 'Show status alert'});
    await trigger.waitFor();
    await voiceOver.navigateToWebContent();

    const capture = await voiceOver.capture(async () => {
      await trigger.click();
      await page.waitForTimeout(800);
    });
    const phrases = await transcript(testInfo, voiceOver, 'alert-dynamic');
    const spoken = `${capture.spokenPhrase} ${phrases.join(' ')}`;
    expect(spoken).toMatch(/application saved/i);
    expect(spoken).toMatch(/reference number/i);
    const activeText = await page.evaluate(() => document.activeElement?.textContent || '');
    expect(activeText).toContain('Show status alert');
  });

  test('an updated status alert announces the new text', async ({page, voiceOver}, testInfo) => {
    await page.goto('/fixture/alert-experiment.html?state=updated');
    const trigger = page.getByRole('button', {name: 'Update status'});
    await trigger.waitFor();
    await voiceOver.navigateToWebContent();

    const capture = await voiceOver.capture(async () => {
      await trigger.click();
      await page.waitForTimeout(800);
    });
    const phrases = await transcript(testInfo, voiceOver, 'alert-updated');
    const spoken = `${capture.spokenPhrase} ${phrases.join(' ')}`;
    expect(spoken).toMatch(/review updated|review complete/i);
    expect(spoken).toMatch(/document/i);
  });

  test('a static error alert exposes its text in the reading order', async ({page, voiceOver}, testInfo) => {
    await page.goto('/fixture/alert-experiment.html?state=error');
    await page.getByRole('heading', {name: 'Some information is missing'}).waitFor();
    await voiceOver.navigateToWebContent();
    for (let index = 0; index < 25; index += 1) await voiceOver.next();
    const phrases = await transcript(testInfo, voiceOver, 'alert-static-error');
    expect(phrases.join(' ')).toMatch(/Some information is missing/i);
    expect(phrases.join(' ')).toMatch(/Enter a required response/i);
  });

  test('the accordion expands and exposes the question', async ({page, voiceOver}, testInfo) => {
    await page.goto('/fixture/accordion-experiment.html?state=collapsed');
    const trigger = page.getByRole('button', {name: 'Who can apply?'});
    await trigger.waitFor();
    await voiceOver.navigateToWebContent();

    const capture = await voiceOver.capture(async () => {
      await trigger.focus();
      await trigger.press('Enter');
      await page.waitForTimeout(500);
    });
    const phrases = await transcript(testInfo, voiceOver, 'accordion-expand');
    const spoken = `${capture.spokenPhrase} ${phrases.join(' ')}`;
    expect(spoken).toMatch(/who can apply/i);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#faq-eligibility')).toBeVisible();
  });

  test('the banner disclosure expands and exposes its name', async ({page, voiceOver}, testInfo) => {
    await page.goto('/fixture/banner-experiment.html?state=collapsed');
    const trigger = page.getByRole('button', {name: 'How this banner works'});
    await trigger.waitFor();
    await voiceOver.navigateToWebContent();

    const capture = await voiceOver.capture(async () => {
      await trigger.focus();
      await trigger.press('Enter');
      await page.waitForTimeout(500);
    });
    const phrases = await transcript(testInfo, voiceOver, 'banner-expand');
    const spoken = `${capture.spokenPhrase} ${phrases.join(' ')}`;
    expect(spoken).toMatch(/how this banner works/i);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#banner-info')).toBeVisible();
  });
});
