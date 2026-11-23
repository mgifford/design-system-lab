/*
 * Lightweight performance evidence for baseline/experiment fixtures.
 *
 * This is an observation, not a Core Web Vitals judgement. It uses the same
 * Playwright browser, local server, viewport, and cold context for each run.
 * Byte/request/DOM budgets are hard checks; timing budgets are warnings because
 * local CI timing is noisy.
 */
import fs from 'node:fs';
import path from 'node:path';

export const RESOURCE_GROUPS = ['html', 'css', 'javascript', 'font', 'image', 'other'];

const number = value => (Number.isFinite(value) ? Number(value) : 0);
const median = values => {
  const sorted = values.filter(value => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round = value => Math.round(value * 100) / 100;

export function classifyResource(entry) {
  const pathname = (() => {
    try {
      return new URL(entry.name).pathname.toLowerCase();
    } catch {
      return String(entry.name || '').toLowerCase();
    }
  })();
  if (pathname.endsWith('.css')) return 'css';
  if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) return 'javascript';
  if (/\.(woff2?|ttf|otf|eot)$/.test(pathname)) return 'font';
  if (/\.(png|jpe?g|gif|webp|avif|svg|ico)$/.test(pathname)) return 'image';
  if (pathname.endsWith('.html') || entry.initiatorType === 'navigation') return 'html';
  return 'other';
}

export function summarizeRun({navigation, resources, domElements, vitals}) {
  const transferSize = Object.fromEntries(RESOURCE_GROUPS.map(group => [group, 0]));
  const requests = Object.fromEntries(RESOURCE_GROUPS.map(group => [group, 0]));
  transferSize.html = number(navigation?.transferSize) || number(navigation?.encodedBodySize);
  requests.html = 1;
  for (const entry of resources || []) {
    const group = classifyResource(entry);
    transferSize[group] += number(entry.transferSize) || number(entry.encodedBodySize);
    requests[group] += 1;
  }
  const totalTransfer = RESOURCE_GROUPS.reduce((total, group) => total + transferSize[group], 0);
  const totalRequests = RESOURCE_GROUPS.reduce((total, group) => total + requests[group], 0);
  const longTasks = (vitals?.longTasks || []).map(number);
  return {
    transferSize: {...transferSize, total: totalTransfer},
    requests: {...requests, total: totalRequests},
    domElements: number(domElements),
    timings: {
      ttfb: round(number(navigation?.responseStart)),
      firstContentfulPaint: round(number(vitals?.firstContentfulPaint)),
      largestContentfulPaint: round(number(vitals?.largestContentfulPaint)),
      cumulativeLayoutShift: round(number(vitals?.cumulativeLayoutShift)),
      totalBlockingTime: round(longTasks.reduce((total, duration) => total + Math.max(0, duration - 50), 0)),
      longTaskCount: longTasks.length,
      domContentLoaded: round(number(navigation?.domContentLoadedEventEnd)),
      load: round(number(navigation?.loadEventEnd))
    }
  };
}

export function aggregateRuns(runs) {
  if (!runs.length) throw new Error('At least one performance run is required.');
  const aggregate = (selector) => {
    const values = runs.map(selector);
    return {median: round(median(values)), min: round(Math.min(...values)), max: round(Math.max(...values))};
  };
  return {
    transferSize: Object.fromEntries([...RESOURCE_GROUPS, 'total'].map(group => [group, aggregate(run => run.transferSize[group])])),
    requests: Object.fromEntries([...RESOURCE_GROUPS, 'total'].map(group => [group, aggregate(run => run.requests[group])])),
    domElements: aggregate(run => run.domElements),
    timings: Object.fromEntries(Object.keys(runs[0].timings).map(key => [key, aggregate(run => run.timings[key])]))
  };
}

function budgetFor(budgets, route) {
  const override = budgets.routes?.[route] || {};
  const merge = (base = {}, extra = {}) => {
    const output = {...base};
    for (const [key, value] of Object.entries(extra)) {
      output[key] = value && typeof value === 'object' && !Array.isArray(value) ? merge(base[key] || {}, value) : value;
    }
    return output;
  };
  return merge(budgets.default || {}, override);
}

export function evaluateBudgets(metrics, budgets, route = '') {
  const limits = budgetFor(budgets, route);
  const checks = [];
  for (const group of [...RESOURCE_GROUPS, 'total']) {
    const limit = limits.transferSize?.[group];
    if (Number.isFinite(limit)) checks.push({kind: 'hard', metric: `transferSize.${group}`, actual: metrics.transferSize[group], limit});
  }
  for (const group of [...RESOURCE_GROUPS, 'total']) {
    const limit = limits.requests?.[group];
    if (Number.isFinite(limit)) checks.push({kind: 'hard', metric: `requests.${group}`, actual: metrics.requests[group], limit});
  }
  if (Number.isFinite(limits.domElements)) checks.push({kind: 'hard', metric: 'domElements', actual: metrics.domElements, limit: limits.domElements});
  for (const [metric, limit] of Object.entries(limits.timings || {})) {
    if (Number.isFinite(limit)) checks.push({kind: 'warn', metric: `timings.${metric}`, actual: metrics.timings[metric], limit});
  }
  return checks.map(check => ({...check, status: check.actual > check.limit ? (check.kind === 'hard' ? 'fail' : 'warn') : 'pass'}));
}

export function compareCosts(baseline, experiment) {
  const delta = (group = 'total') => {
    const before = baseline.transferSize[group];
    const after = experiment.transferSize[group];
    return {baseline: before, experiment: after, bytes: after - before, percent: before ? round(((after - before) / before) * 100) : null};
  };
  const deltaRequests = (group = 'total') => ({
    baseline: baseline.requests[group],
    experiment: experiment.requests[group],
    requests: experiment.requests[group] - baseline.requests[group]
  });
  return {
    transferSize: Object.fromEntries([...RESOURCE_GROUPS, 'total'].map(group => [group, delta(group)])),
    requests: Object.fromEntries([...RESOURCE_GROUPS, 'total'].map(group => [group, deltaRequests(group)])),
    domElements: {baseline: baseline.domElements, experiment: experiment.domElements, elements: experiment.domElements - baseline.domElements},
    timings: Object.fromEntries(Object.keys(baseline.timings).map(key => {
      const before = baseline.timings[key];
      const after = experiment.timings[key];
      return [key, {baseline: before, experiment: after, delta: round(after - before)}];
    }))
  };
}

function readBudgets(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'data', 'performance-budgets.json'), 'utf8'));
}

async function measurePage(browser, origin, route) {
  const context = await browser.newContext({viewport: {width: 1280, height: 850}, colorScheme: 'light'});
  try {
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', {rate: 4});
    await page.addInitScript(() => {
      window.__performanceEvidence = {largestContentfulPaint: 0, cumulativeLayoutShift: 0, longTasks: [], firstContentfulPaint: 0};
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) window.__performanceEvidence.largestContentfulPaint = entry.startTime;
        }).observe({type: 'largest-contentful-paint', buffered: true});
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__performanceEvidence.cumulativeLayoutShift += entry.value;
          }
        }).observe({type: 'layout-shift', buffered: true});
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) window.__performanceEvidence.longTasks.push(entry.duration);
        }).observe({type: 'longtask', buffered: true});
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint' && !window.__performanceEvidence.firstContentfulPaint) {
              window.__performanceEvidence.firstContentfulPaint = entry.startTime;
            }
          }
        }).observe({type: 'paint', buffered: true});
      } catch {}
    });
    const response = await page.goto(`${origin}/${route}`, {waitUntil: 'load', timeout: 30000});
    if (!response?.ok()) throw new Error(`HTTP ${response?.status()} for ${route}`);
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(500);
    const collected = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize
      }));
      return {
        navigation: navigation ? {
          transferSize: navigation.transferSize,
          encodedBodySize: navigation.encodedBodySize,
          responseStart: navigation.responseStart,
          domContentLoadedEventEnd: navigation.domContentLoadedEventEnd,
          loadEventEnd: navigation.loadEventEnd
        } : null,
        resources,
        domElements: document.getElementsByTagName('*').length,
        vitals: window.__performanceEvidence
      };
    });
    return summarizeRun(collected);
  } finally {
    await context.close();
  }
}

export async function collectPerformance(browser, origin, routes, {root = process.cwd(), runs = 3} = {}) {
  const budgets = readBudgets(root);
  const fixtureRoutes = routes.filter(route => /^fixture\/([a-z0-9-]+)-(baseline|experiment)\.html$/.test(route));
  const entries = [];
  for (const route of fixtureRoutes) {
    const match = route.match(/^fixture\/([a-z0-9-]+)-(baseline|experiment)\.html$/);
    const measured = [];
    for (let index = 0; index < runs; index += 1) measured.push(await measurePage(browser, origin, route));
    const aggregate = aggregateRuns(measured);
    const medianRun = {
      transferSize: Object.fromEntries([...RESOURCE_GROUPS, 'total'].map(group => [group, aggregate.transferSize[group].median])),
      requests: Object.fromEntries([...RESOURCE_GROUPS, 'total'].map(group => [group, aggregate.requests[group].median])),
      domElements: aggregate.domElements.median,
      timings: Object.fromEntries(Object.keys(aggregate.timings).map(key => [key, aggregate.timings[key].median]))
    };
    const checks = evaluateBudgets(medianRun, budgets, route);
    entries.push({
      route,
      component: match[1],
      variant: match[2],
      runs: measured,
      aggregate,
      budgets: checks,
      status: checks.some(check => check.status === 'fail') ? 'budget-failed' : checks.some(check => check.status === 'warn') ? 'warning' : 'within-budget'
    });
  }
  const byComponent = new Map();
  for (const entry of entries) {
    if (!byComponent.has(entry.component)) byComponent.set(entry.component, {});
    byComponent.get(entry.component)[entry.variant] = entry;
  }
  const comparison = [...byComponent].filter(([, pair]) => pair.baseline && pair.experiment).map(([component, pair]) => ({
    component,
    baseline: pair.baseline.route,
    experiment: pair.experiment.route,
    costs: compareCosts(
      {
        transferSize: Object.fromEntries([...RESOURCE_GROUPS, 'total'].map(group => [group, pair.baseline.aggregate.transferSize[group].median])),
        requests: Object.fromEntries([...RESOURCE_GROUPS, 'total'].map(group => [group, pair.baseline.aggregate.requests[group].median])),
        domElements: pair.baseline.aggregate.domElements.median,
        timings: Object.fromEntries(Object.keys(pair.baseline.aggregate.timings).map(key => [key, pair.baseline.aggregate.timings[key].median]))
      },
      {
        transferSize: Object.fromEntries([...RESOURCE_GROUPS, 'total'].map(group => [group, pair.experiment.aggregate.transferSize[group].median])),
        requests: Object.fromEntries([...RESOURCE_GROUPS, 'total'].map(group => [group, pair.experiment.aggregate.requests[group].median])),
        domElements: pair.experiment.aggregate.domElements.median,
        timings: Object.fromEntries(Object.keys(pair.experiment.aggregate.timings).map(key => [key, pair.experiment.aggregate.timings[key].median]))
      }
    )
  }));
  const failures = entries.flatMap(entry => entry.budgets.filter(check => check.status === 'fail').map(check => ({route: entry.route, ...check})));
  const warnings = entries.flatMap(entry => entry.budgets.filter(check => check.status === 'warn').map(check => ({route: entry.route, ...check})));
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: 'Playwright / PerformanceObserver / Resource Timing / CDP CPU throttling',
    conditions: {
      viewport: '1280x850',
      colourScheme: 'light',
      cpuThrottlingRate: 4,
      cache: 'new browser context per run',
      network: 'localhost (no network shaping)',
      runs,
      fixtureState: 'default fixture rendering (all declared states visible)',
      note: 'Local timings are noisy and are warnings only. Byte, request, and DOM budgets are hard checks. This is not a Lighthouse or Web Vitals field score.'
    },
    budgets,
    entries,
    comparison,
    summary: {
      routes: entries.length,
      runs: entries.reduce((total, entry) => total + entry.runs.length, 0),
      budgetFailures: failures.length,
      timingWarnings: warnings.length,
      failedRoutes: [...new Set(failures.map(failure => failure.route))],
      warningRoutes: [...new Set(warnings.map(warning => warning.route))],
      comparisons: comparison.length,
      generatedAt: new Date().toISOString()
    }
  };
}
