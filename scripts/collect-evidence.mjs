/*
 * Reproducible evidence collector.
 *
 * - Clears reports/latest and writes a running manifest before collection.
 * - Captures Guidepup virtual transcripts (not a real screen reader).
 * - Captures state-specific transcripts, screenshots, and axe observations.
 * - Finalizes the manifest in every path so a crash cannot leave old evidence
 *   looking current. Historical runs are copied to reports/runs/<run-id>.
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawn, execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {JSDOM, VirtualConsole} from 'jsdom';
import {virtual} from '@guidepup/virtual-screen-reader';
import AxeBuilder from '@axe-core/playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const latest = path.join(root, 'reports', 'latest');
const runs = path.join(root, 'reports', 'runs');
const build = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'data', 'build.json'), 'utf8'));
if (!build.uswdsRealAssets) throw new Error('Refusing to collect upstream comparison evidence from an offline fallback. Run npm ci and npm run build:strict.');
const routes = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'data', 'routes.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'registry.json'), 'utf8'));

const startedAt = new Date().toISOString();
const runId = startedAt.replaceAll(':', '-').replaceAll('.', '-');
let gitSha = 'unknown';
let gitDirty = null;
try {
  gitSha = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
  gitDirty = execFileSync('git', ['status', '--porcelain'], {cwd: root, encoding: 'utf8'}).trim().length > 0;
} catch {}
const manifest = {
  generated: true,
  schemaVersion: 1,
  status: 'running',
  runId,
  startedAt,
  generatedAt: startedAt,
  finishedAt: null,
  source: `@uswds/uswds ${build.uswdsVersion} (npm)`,
  gitSha,
  gitDirty,
  browser: null,
  viewport: '1280x850',
  pages: [],
  succeeded: 0,
  failed: 0,
  coverage: null
};

fs.rmSync(latest, {recursive: true, force: true});
fs.mkdirSync(latest, {recursive: true});
const writeManifest = () => fs.writeFileSync(path.join(latest, 'MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeManifest();

const esc = value => String(value ?? '').replaceAll('\r', ' ').replaceAll('\n', ' ').replaceAll('|', '\\|');
const slugify = route => route.replaceAll('/', '--').replace(/\.html$/, '').replace(/[^a-zA-Z0-9-]/g, '-');
const withParams = (route, params) => {
  const url = new URL(`http://local/${route}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return `${url.pathname.replace(/^\//, '')}${url.search}`;
};
const write = (relative, content) => {
  const target = path.join(latest, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, content);
  return relative;
};

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const {port} = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(origin) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${origin}/index.html`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('Evidence server did not start.');
}

function virtualSpeech(html) {
  const jsdomErrors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => {
    if (/Not implemented/.test(error.message)) jsdomErrors.push(error.message);
    else console.error(error.message);
  });
  const dom = new JSDOM(html, {pretendToBeVisual: true, virtualConsole});
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    Node: globalThis.Node,
    Element: globalThis.Element,
    HTMLElement: globalThis.HTMLElement,
    getComputedStyle: globalThis.getComputedStyle,
    CSS: globalThis.CSS
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Node = dom.window.Node;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  // jsdom 26 does not implement CSS.escape; Guidepup uses it for IDREFs.
  globalThis.CSS = dom.window.CSS ?? {
    escape: value => String(value).replace(/[^a-zA-Z0-9_-]/g, character => `\\${character}`)
  };
  return (async () => {
    try {
      await virtual.start({container: dom.window.document.body});
      let truncated = false;
      for (let index = 0; index < 400; index += 1) {
        try {
          await virtual.next();
        } catch {
          break;
        }
        const phrase = await virtual.lastSpokenPhrase();
        if (phrase === 'end of document') break;
        if (index === 399) truncated = true;
      }
      const log = await virtual.spokenPhraseLog();
      return {phrases: log.map(phrase => String(phrase)), truncated, jsdomErrors};
    } finally {
      try {
        await virtual.stop();
      } catch {}
      dom.window.close();
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
      }
    }
  })();
}

function writeState(route, state, transcript, extra = {}) {
  const slug = slugify(route);
  const relative = `guidepup/${slug}/${state}.md`;
  const lines = [
    `# Guidepup transcript: ${route} — ${state}`,
    '',
    '**Method: virtual screen reader over a DOM snapshot. Not a real VoiceOver, NVDA, or JAWS test.**',
    '',
    `- Run: ${manifest.runId}`,
    `- Source: ${manifest.source}`,
    `- Git revision: ${gitSha}${gitDirty ? ' (dirty worktree)' : ''}`,
    `- Browser: ${manifest.browser}`,
    `- Viewport: ${manifest.viewport}`,
    `- Page: ${route}`,
    `- State: ${state}`,
    ...Object.entries(extra).map(([key, value]) => `- ${key}: ${esc(value)}`),
    '',
    '## Phrases',
    '',
    ...(transcript.jsdomErrors?.length ? [`**Simulator limitation:** jsdom reported ${transcript.jsdomErrors.length} unsupported pseudo-element style request(s). CSS-generated content may be omitted.`, ''] : []),
    ...transcript.phrases.map(phrase => `- ${esc(phrase)}`),
    '',
    '## Limits',
    '',
    '- Guidepup is a simulator over the DOM; CSS-only differences (including dark appearance) are not represented in speech.',
    '- Axe and browser assertions are separate evidence. A transcript difference is not automatically a regression.',
    '- Real assistive-technology testing remains outstanding.',
    ''
  ];
  if (transcript.truncated) lines.splice(lines.indexOf('## Phrases'), 0, '**Transcript truncated at 400 phrases.**\n');
  write(relative, lines.join('\n'));
  return `${relative.replace(/\.md$/, '.html')}`;
}

function screenshotPath(route, state) {
  const relative = `screenshots/${slugify(route)}-${state}.png`;
  const target = path.join(latest, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  return {relative, target};
}

async function transcript(page) {
  const html = await page.content();
  const result = await virtualSpeech(html);
  if (!result.phrases.length) throw new Error('Guidepup virtual transcript was empty.');
  return result;
}

async function open(browser, route, options = {}) {
  const context = await browser.newContext({
    viewport: {width: 1280, height: 850},
    colorScheme: options.colorScheme || 'light'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  const response = await page.goto(`${options.origin}/${route}`, {waitUntil: 'load', timeout: 30000});
  if (!response?.ok()) throw new Error(`HTTP ${response?.status()} for ${route}`);
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(80);
  return {page, context, errors};
}

async function axe(page) {
  const results = await new AxeBuilder({page})
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.length
  }));
}

function routeReport(route, entry, notes) {
  const states = entry.states.map(state => `- [${state.name}](${state.file})`).join('\n') || '- None collected.';
  const shots = entry.screenshots.map(shot => `- [${shot.state}](screenshots/${shot.file})`).join('\n') || '- None.';
  const blocking = (entry.axe || []).filter(violation => ['critical', 'serious'].includes(violation.impact));
  return `# Evidence: ${route}

**Automated observation only. Human review: pending.**

- Run: ${manifest.runId}
- Source: ${manifest.source}
- Git revision: ${gitSha}
- Browser: ${manifest.browser}
- Viewport: ${manifest.viewport}
- Page: ${route}
- Collection: ${entry.result}
- Page/console errors: ${entry.pageErrors?.length || 0}

## Axe observations

- Total violations: ${entry.axeViolations ?? 'not recorded'}
- Serious/critical: ${blocking.length}
${blocking.length ? blocking.map(violation => `- ${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes} node(s)`).join('\n') : '- None reported by this run.'}

Axe was run on the initial route state only. A zero axe count is not a conformance claim.

## State transcripts

${states}

## Screenshots

${shots}

## Observations

${notes}

## Limitations

- Guidepup is a virtual screen reader over a DOM snapshot; it is not a real NVDA, JAWS, or VoiceOver session.
- Dark mode and other CSS-only differences are visible in screenshots but not in the speech transcript.
- Forced colors was tested only by browser emulation, and real Windows High Contrast Mode was not used.
- Voice Control and real screen-reader operation of the radio and form fixtures remain untested.
- The comparison page transcript does not include iframe documents; fixture pages are collected separately.

## Decision

Pending human review. Do not infer an upstream recommendation or WCAG conformance.
`;
}

async function collectRoute(browser, origin, route, entry) {
  const notes = [];
  const {page, context, errors} = await open(browser, route, {origin});
  entry.pageErrors = errors;

  const violations = await axe(page);
  entry.axe = violations;
  entry.axeViolations = violations.length;

  const initial = await transcript(page);
  entry.states.push({name: 'initial', file: writeState(route, 'initial', initial, {Theme: 'light/system', Direction: 'ltr'})});
  const initialShot = screenshotPath(route, 'initial');
  await page.screenshot({path: initialShot.target});
  entry.screenshots.push({state: 'initial', file: path.basename(initialShot.target)});

  const disclosure = page.locator('.usa-accordion__button').first();
  if (await disclosure.count()) {
    await disclosure.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
    const expanded = (await disclosure.getAttribute('aria-expanded')) === 'true';
    if (!expanded) notes.push('Keyboard activation did not expand the disclosure in this run.');
    const expandedTranscript = await transcript(page);
    entry.states.push({name: expanded ? 'expanded' : 'expand-failed', file: writeState(route, expanded ? 'expanded' : 'expand-failed', expandedTranscript, {Interaction: 'Enter key'})});
    const expandedShot = screenshotPath(route, expanded ? 'expanded' : 'expand-failed');
    await page.screenshot({path: expandedShot.target});
    entry.screenshots.push({state: expanded ? 'expanded' : 'expand-failed', file: path.basename(expandedShot.target)});
    if (expanded) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(120);
      const collapsed = (await disclosure.getAttribute('aria-expanded')) === 'false';
      const collapsedTranscript = await transcript(page);
      entry.states.push({name: collapsed ? 'collapsed' : 'collapse-failed', file: writeState(route, collapsed ? 'collapsed' : 'collapse-failed', collapsedTranscript, {Interaction: 'Enter key'})});
      if (!collapsed) notes.push('Second keyboard activation did not collapse the disclosure.');
    }
  }

  const form = page.locator('form[data-local-validation]').first();
  if (await form.count()) {
    const submit = form.locator('button[type="submit"]').first();
    await submit.click();
    await page.waitForTimeout(120);
    const validity = await form.evaluate(element => element.checkValidity());
    const activeId = await page.evaluate(() => document.activeElement?.id || '');
    notes.push(`Invalid submit: form.checkValidity()=${validity}; activeElement=${activeId || '(none)'}.`);
    const invalidTranscript = await transcript(page);
    entry.states.push({name: 'invalid', file: writeState(route, 'invalid', invalidTranscript, {Interaction: 'Submit with empty required fields', ActiveElement: activeId || '(none)'})});
    const invalidShot = screenshotPath(route, 'invalid');
    await page.screenshot({path: invalidShot.target});
    entry.screenshots.push({state: 'invalid', file: path.basename(invalidShot.target)});

    const radio = form.locator('input[type="radio"]').first();
    if (await radio.count()) {
      await radio.focus();
      await page.keyboard.press('Space');
    }
    const text = form.locator('input[type="text"]').first();
    if (await text.count()) await text.fill('Sample reference');
    await submit.click();
    await page.waitForTimeout(120);
    const status = await page.locator('[role="status"]').last().textContent().catch(() => '');
    notes.push(`Valid submit status: ${status?.trim() || '(none)'}`);
    const validTranscript = await transcript(page);
    entry.states.push({name: 'valid', file: writeState(route, 'valid', validTranscript, {Interaction: 'Submit with required values', Status: status?.trim() || '(none)'})});
    const validShot = screenshotPath(route, 'valid');
    await page.screenshot({path: validShot.target});
    entry.screenshots.push({state: 'valid', file: path.basename(validShot.target)});
  }

  await context.close();

  const dark = await open(browser, withParams(route, {theme: 'dark'}), {origin, colorScheme: 'dark'});
  const darkTranscript = await transcript(dark.page);
  entry.states.push({name: 'dark', file: writeState(route, 'dark', darkTranscript, {Theme: 'explicit dark or system dark', Direction: 'ltr'})});
  const darkShot = screenshotPath(route, 'dark');
  await dark.page.screenshot({path: darkShot.target});
  entry.screenshots.push({state: 'dark', file: path.basename(darkShot.target)});
  entry.pageErrors.push(...dark.errors);
  await dark.context.close();

  if (route.includes('banner-experiment') || route.includes('alert-experiment')) {
    const rtl = await open(browser, withParams(route, {dir: 'rtl'}), {origin});
    const rtlTranscript = await transcript(rtl.page);
    entry.states.push({name: 'rtl', file: writeState(route, 'rtl', rtlTranscript, {Theme: 'light/system', Direction: 'rtl'})});
    const rtlShot = screenshotPath(route, 'rtl');
    await rtl.page.screenshot({path: rtlShot.target});
    entry.screenshots.push({state: 'rtl', file: path.basename(rtlShot.target)});
    entry.pageErrors.push(...rtl.errors);
    await rtl.context.close();
  }

  if (entry.pageErrors.length) notes.push(`Uncaught page errors: ${entry.pageErrors.join('; ')}`);
  if (entry.axeViolations) notes.push(`Axe recorded ${entry.axeViolations} violation(s); see the table above.`);

  entry.result = 'collected-not-reviewed';
  write(`${slugify(route)}.md`, routeReport(route, entry, notes.join('\n') || 'No additional observation.'));
  entry.report = `${slugify(route)}.html`;
  return entry;
}

let browser;
let child;
try {
  const port = Number(process.env.EVIDENCE_PORT) || await freePort();
  const origin = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: root,
    env: {...process.env, PORT: String(port)},
    stdio: 'ignore'
  });
  await waitForServer(origin);
  const launch = {headless: true};
  if (process.env.PLAYWRIGHT_CHANNEL) launch.channel = process.env.PLAYWRIGHT_CHANNEL;
  browser = await chromium.launch(launch);
  manifest.browser = browser.version();

  for (const route of routes) {
    const entry = {name: route, result: 'not-tested', report: null, axeViolations: null, states: [], screenshots: [], pageErrors: []};
    manifest.pages.push(entry);
    try {
      await collectRoute(browser, origin, route, entry);
      console.log(`collected ${route} (${entry.states.length} states, ${entry.axeViolations} axe)`);
    } catch (error) {
      entry.result = `failed: ${error.message}`;
      entry.report = null;
      console.error(`FAILED ${route}: ${error.stack || error.message}`);
    }
  }
} catch (error) {
  manifest.status = 'failed';
  manifest.error = error.message;
  manifest.finishedAt = new Date().toISOString();
  writeManifest();
  throw error;
} finally {
  await browser?.close().catch(() => {});
  child?.kill('SIGTERM');
}

manifest.succeeded = manifest.pages.filter(page => page.result === 'collected-not-reviewed').length;
manifest.failed = manifest.pages.length - manifest.succeeded;
manifest.status = 'completed';
manifest.finishedAt = new Date().toISOString();
manifest.coverage = {
  routes: manifest.pages.length,
  states: manifest.pages.reduce((total, page) => total + page.states.length, 0),
  withAxe: manifest.pages.filter(page => Number.isFinite(page.axeViolations)).length,
  withScreenshots: manifest.pages.reduce((total, page) => total + page.screenshots.length, 0)
};
writeManifest();

const stateNames = ['initial', 'expanded', 'collapsed', 'invalid', 'valid', 'dark', 'rtl'];
const summary = [
  '# Evidence summary',
  '',
  '**Automated collection, not a conformance or human acceptance statement.**',
  '',
  `- Run: ${manifest.runId}`,
  `- Status: ${manifest.status}`,
  `- Source: ${manifest.source}`,
  `- Git revision: ${gitSha}`,
  `- Browser: ${manifest.browser}`,
  `- Collected: ${manifest.succeeded} of ${manifest.pages.length} routes`,
  '',
  '| Page | Status | Axe | Evidence |',
  '|---|---|---|---|',
  ...manifest.pages.map(page => `| ${esc(page.name)} | ${esc(page.result)} | ${page.axeViolations ?? '—'} | ${page.report ? `[Report](${page.report})` : 'Not generated'} |`),
  '',
  '## Method',
  '',
  'Playwright loaded every lab route with the pinned USWDS distribution. Guidepup traversed a jsdom snapshot; disclosure, form, dark, and RTL states were captured separately. Axe recorded violations and screenshots were captured for visual inspection.',
  '',
  '## Not tested',
  '',
  '- Real NVDA, JAWS, VoiceOver, or TalkBack sessions.',
  '- Voice Control or speech-input operation.',
  '- Windows High Contrast Mode on a real Windows device.',
  '- Every browser, OS, zoom, and text-spacing combination.',
  '',
  '## Decision',
  '',
  'Pending maintainer review. Do not infer an upstream recommendation.'
];
write('SUMMARY.md', summary.join('\n') + '\n');

const coverage = [
  '# Coverage matrix',
  '',
  `Run ${manifest.runId}. Axe and screenshots are separate from Guidepup states.`,
  '',
  `| Route | ${stateNames.join(' | ')} | Axe |`,
  `|---|${stateNames.map(() => '---').join('|')}|---|`,
  ...manifest.pages.map(page => {
    const collected = new Set(page.states.map(state => state.name));
    return `| ${esc(page.name)} | ${stateNames.map(state => collected.has(state) ? 'yes' : '—').join(' | ')} | ${page.axeViolations ?? '—'} |`;
  }),
  '',
  '## Gaps',
  '',
  '- Forced colors is captured only by Playwright emulation, not on a real high-contrast device.',
  '- Firefox and WebKit evidence is not collected by this collector; run the browser suite separately.',
  '- The comparison page transcript excludes iframe documents. Fixture routes are collected separately.',
  '- Dark appearance is a visual state; Guidepup speech does not change with CSS.'
];
write('COVERAGE.md', coverage.join('\n') + '\n');

fs.mkdirSync(runs, {recursive: true});
fs.cpSync(latest, path.join(runs, runId), {recursive: true});
console.log(`Evidence: ${manifest.succeeded}/${manifest.pages.length}; ${manifest.failed} failed. Reports in ${latest}`);
if (manifest.failed) process.exitCode = 1;
