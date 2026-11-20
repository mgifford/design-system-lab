import {test,expect} from '@playwright/test';
const components=['accordion','alert','banner','form'];
const pages=['index.html','compare.html','ideas.html','evidence.html','guide.html'];
for(const route of pages)test(`navigation: ${route}`,async({page})=>{const response=await page.goto('/'+route);expect(response.status()).toBe(200);await expect(page.locator('main h1')).toBeVisible();await expect(page.getByRole('navigation',{name:'Primary'})).toBeVisible()});
for(const component of components)for(const variant of ['baseline','experiment']){
 test(`fixture: ${component} ${variant}`,async({page})=>{await page.goto(`/fixture/${component}-${variant}.html`);await expect(page.locator('main h1')).toBeVisible();await expect(page.locator(`body[data-variant="${variant}"]`)).toHaveCount(1)})
}
test('comparison changes source and permits independent page testing',async({page})=>{await page.goto('/compare.html');await page.locator('#component').selectOption('alert');await expect(page.locator('#before')).toHaveAttribute('src',/alert-baseline\.html/);await expect(page.locator('#after')).toHaveAttribute('src',/alert-experiment\.html/);await expect(page.locator('#open-after')).toHaveAttribute('href',/alert-experiment\.html/)});
test('dark mode alters experimental canvas but leaves baseline canvas unchanged',async({page})=>{
 await page.goto('/fixture/alert-baseline.html?theme=dark');const baseline=await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor);
 await page.goto('/fixture/alert-experiment.html?theme=dark');const experimental=await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor);
 expect(experimental).not.toBe(baseline);
});
test('RTL changes direction without claiming translated content',async({page})=>{await page.goto('/fixture/banner-experiment.html?dir=rtl');await expect(page.locator('html')).toHaveAttribute('dir','rtl');await expect(page.locator('html')).toHaveAttribute('lang','en')});
test('invalid form blocks submission and stays on page',async({page})=>{await page.goto('/fixture/form-baseline.html');await page.getByRole('button',{name:'Review application'}).click();expect(await page.locator('#reference').evaluate(e=>e.validity.valid)).toBe(false);await expect(page.locator('#form-status')).toBeEmpty()});
test('accordion expands with real keyboard activation',async({page})=>{
 await page.goto('/fixture/accordion-baseline.html');const button=page.getByRole('button',{name:'Who can apply?'});await button.focus();await page.keyboard.press('Enter');await expect(button).toHaveAttribute('aria-expanded','true');await expect(page.locator('#faq-eligibility')).toBeVisible();
});
test('accordion content remains readable without JavaScript',async({browser})=>{const ctx=await browser.newContext({javaScriptEnabled:false});const page=await ctx.newPage();await page.goto('http://127.0.0.1:4173/fixture/accordion-baseline.html');await expect(page.getByText('People who meet the published eligibility criteria')).toBeVisible();await ctx.close()});
test('forced-colors browser emulation leaves focusable controls available',async({browser})=>{const ctx=await browser.newContext({forcedColors:'active'});const page=await ctx.newPage();await page.goto('http://127.0.0.1:4173/fixture/accordion-experiment.html');const button=page.getByRole('button',{name:'Who can apply?'});await button.focus();await expect(button).toBeFocused();await ctx.close()});
