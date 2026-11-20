import {expect} from '@playwright/test';

export function contrastRatio(foreground, background) {
  const parse = value => {
    const match = String(value).match(/rgba?\(([^)]+)\)/);
    if (!match) throw new Error(`Unsupported color: ${value}`);
    const parts = match[1].split(',').map(part => Number(part.trim()));
    return parts.slice(0, 3);
  };
  const linear = channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = rgb => 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
  const first = luminance(parse(foreground));
  const second = luminance(parse(background));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export async function goto(page, route) {
  const response = await page.goto(`/${route}`, {waitUntil: 'load'});
  expect(response, `No response for ${route}`).not.toBeNull();
  expect(response.status(), `HTTP status for ${route}`).toBe(200);
}

export async function styles(page, selector, properties) {
  return page.locator(selector).first().evaluate((element, props) => {
    const computed = getComputedStyle(element);
    return Object.fromEntries(props.map(property => [property, computed.getPropertyValue(property)]));
  }, properties);
}

export async function bodyBackground(page) {
  return page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor);
}
