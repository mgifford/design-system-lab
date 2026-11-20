import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildSync} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {fixtureHtml} from './components.mjs';
import {landingHtml} from './landing.mjs';
import {renderPage} from './layout.mjs';
import {renderMarkdown, escapeHtml} from './markdown.mjs';
import {buildStaticPages, buildComponentPages, buildExperimentPages, buildDocPages} from './pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const vendor = path.join(root, 'node_modules', '@uswds', 'uswds', 'dist');
const requireUswds = process.argv.includes('--require-uswds');
const packageFile = path.join(root, 'package.json');
const installedFile = path.join(root, 'node_modules', '@uswds', 'uswds', 'package.json');
const lockFile = path.join(root, 'data', 'sources.lock.json');
const packageLock = path.join(root, 'package-lock.json');
const cssPath = path.join(vendor, 'css', 'uswds.min.css');
const jsPath = path.join(vendor, 'js', 'uswds.min.js');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const exists = file => fs.existsSync(file);
const sha256 = file => exists(file) ? createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
const write = (relative, content) => {
  const target = path.join(dist, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, content);
};

const ogdsRoot = path.join(root, 'node_modules', '@ogds', 'elements');
const ogdsPackageFile = path.join(ogdsRoot, 'package.json');
const ogdsEntry = path.join(ogdsRoot, 'dist', 'components', 'index.js');
const ogdsCssDir = path.join(ogdsRoot, 'build', 'css');
const ogdsVersion = exists(ogdsPackageFile) ? readJson(ogdsPackageFile).version : null;
const ogdsReady = ogdsVersion === '1.0.0-beta.2' && exists(ogdsEntry) && exists(path.join(ogdsCssDir, 'colors.css'));

const pkg = readJson(packageFile);
const registry = readJson(path.join(root, 'data', 'registry.json'));
const issues = readJson(path.join(root, 'data', 'issues.json'));
const review = readJson(path.join(root, 'data', 'review.json'));
if (!exists(lockFile)) throw new Error('data/sources.lock.json is missing. Run npm run sources:write after installing the pinned USWDS package.');
const lock = readJson(lockFile);
const installedVersion = exists(installedFile) ? readJson(installedFile).version : null;
const realAssets = installedVersion === lock.baseline.version && exists(cssPath) && exists(jsPath);

if (pkg.dependencies?.['@uswds/uswds'] !== lock.baseline.version) {
  throw new Error(`package.json pins ${pkg.dependencies?.['@uswds/uswds']}; sources.lock.json expects ${lock.baseline.version}.`);
}
if (!exists(packageLock)) {
  if (requireUswds) throw new Error('Strict build requires package-lock.json. Run npm ci and commit the generated lockfile.');
  console.warn('WARNING: package-lock.json is missing; the build is not reproducible.');
}
if (lock.baseline.packageLock?.sha256 && exists(packageLock) && sha256(packageLock) !== lock.baseline.packageLock.sha256) {
  const message = 'package-lock.json does not match data/sources.lock.json. Run npm run sources:write in a reviewed change if the dependency change is intentional.';
  if (requireUswds) throw new Error(message);
  console.warn(`WARNING: ${message}`);
}
if (realAssets && lock.baseline.assets) {
  const cssHash = sha256(cssPath);
  const jsHash = sha256(jsPath);
  if (cssHash !== lock.baseline.assets.css?.sha256 || jsHash !== lock.baseline.assets.js?.sha256) {
    const message = 'Installed USWDS CSS/JS hashes do not match data/sources.lock.json.';
    if (requireUswds) throw new Error(`${message} Run npm run sources:write in a reviewed change if the release changed.`);
    console.warn(`WARNING: ${message}`);
  }
}
if (requireUswds && !realAssets) {
  throw new Error(`Strict build requires @uswds/uswds ${lock.baseline.version} with dist CSS and JS. Installed: ${installedVersion || 'none'}. Run npm ci first.`);
}
if (requireUswds && !ogdsReady) {
  throw new Error(`Strict build requires @ogds/elements 1.0.0-beta.2 with dist components and token CSS. Installed: ${ogdsVersion || 'none'}. Run npm ci first.`);
}

fs.rmSync(dist, {recursive: true, force: true});
fs.mkdirSync(dist, {recursive: true});
fs.cpSync(path.join(root, 'site', 'assets'), path.join(dist, 'assets'), {recursive: true});

fs.mkdirSync(path.join(dist, 'data'), {recursive: true});
for (const file of ['registry.json', 'issues.json', 'review.json', 'sources.lock.json']) {
  fs.copyFileSync(path.join(root, 'data', file), path.join(dist, 'data', file));
}

if (realAssets) {
  const destination = path.join(dist, 'vendor', 'uswds');
  fs.mkdirSync(destination, {recursive: true});
  for (const folder of ['css', 'js', 'img', 'fonts']) {
    const source = path.join(vendor, folder);
    if (exists(source)) fs.cpSync(source, path.join(destination, folder), {recursive: true});
  }
  const license = path.join(root, 'node_modules', '@uswds', 'uswds', 'LICENSE.md');
  if (exists(license)) fs.copyFileSync(license, path.join(destination, 'LICENSE.md'));
  if (!exists(path.join(destination, 'css', 'uswds.min.css')) || !exists(path.join(destination, 'js', 'uswds.min.js'))) {
    throw new Error('Missing copied USWDS dist assets.');
  }
}

if (ogdsReady) {
  const ogdsVendor = path.join(dist, 'vendor', 'ogds');
  fs.mkdirSync(ogdsVendor, {recursive: true});
  buildSync({
    entryPoints: [ogdsEntry],
    bundle: true,
    format: 'esm',
    minify: true,
    platform: 'browser',
    target: ['es2022'],
    legalComments: 'eof',
    outfile: path.join(ogdsVendor, 'ogds-elements.js'),
    logLevel: 'warning'
  });
  const ogdsCssVendor = path.join(ogdsVendor, 'css');
  fs.mkdirSync(ogdsCssVendor, {recursive: true});
  for (const file of ['colors.css', 'spacing.css', 'breakpoints.css']) {
    fs.copyFileSync(path.join(ogdsCssDir, file), path.join(ogdsCssVendor, file));
  }
  const permission = path.join(root, 'docs', 'OGDS-PERMISSION.md');
  if (exists(permission)) fs.copyFileSync(permission, path.join(ogdsVendor, 'NOTICE.md'));
}

// Fixtures are generated for every registered component. A new-component
// experiment (no stable equivalent) is a page, not a fabricated baseline pair.
for (const component of registry.components) {
  for (const variant of ['baseline', 'experiment']) {
    write(`fixture/${component.slug}-${variant}.html`, fixtureHtml({
      component: component.slug,
      variant,
      realAssets
    }));
  }
}

for (const variant of ['uswds', 'ogds']) {
  write(`demo/${variant}-landing.html`, landingHtml({variant, realAssets, ogdsReady}));
}

const manifestPath = path.join(root, 'reports', 'latest', 'MANIFEST.json');
const manifest = exists(manifestPath) ? readJson(manifestPath) : {generated: false, runId: null, pages: [], succeeded: 0, failed: 0};
const buildInfo = {
  uswdsRealAssets: realAssets,
  uswdsVersion: realAssets ? lock.baseline.version : null,
  baselineRelease: lock.baseline.release,
  sourceCommit: lock.baseline.commit,
  generatedAt: new Date().toISOString(),
  components: registry.components.map(component => component.slug),
  experiments: registry.experiments.map(experiment => experiment.id),
  source: '@uswds/uswds ' + lock.baseline.version + ' (npm)',
  assetSha256: realAssets ? {css: sha256(cssPath), js: sha256(jsPath)} : null,
  lockSha256: sha256(path.join(root, 'package-lock.json')),
  ogdsVersion: ogdsReady ? ogdsVersion : null,
  ogdsCommit: '59b05f1',
  ogdsLicense: 'public-domain (permission confirmed 2026-11-20)'
};

// Evidence is published only from the current reports/latest run. Nothing from
// a previous run is copied into dist, because the directory is recreated.
fs.rmSync(path.join(dist, 'evidence'), {recursive: true, force: true});
const latest = path.join(root, 'reports', 'latest');
let evidenceInfo = {generated: false, reason: realAssets ? 'No evidence run is published in this build.' : 'Offline illustration; evidence is not published.'};
if (realAssets && exists(manifestPath) && Array.isArray(manifest.pages) && manifest.pages.length) {
  evidenceInfo = {
    generated: true,
    status: manifest.status || 'completed',
    runId: manifest.runId,
    generatedAt: manifest.generatedAt || manifest.finishedAt || manifest.startedAt,
    source: manifest.source,
    gitSha: manifest.gitSha,
    browser: manifest.browser,
    succeeded: manifest.succeeded,
    failed: manifest.failed,
    pages: manifest.pages,
    coverage: manifest.coverage || null
  };
  const evidenceDir = path.join(dist, 'evidence', 'latest');
  fs.mkdirSync(evidenceDir, {recursive: true});
  const copyEvidence = directory => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const full = path.join(directory, entry.name);
      const relative = path.relative(latest, full).split(path.sep).join('/');
      const target = path.join(evidenceDir, relative);
      if (entry.isDirectory()) {
        fs.mkdirSync(target, {recursive: true});
        copyEvidence(full);
      } else if (/\.(md|png|json)$/.test(entry.name)) {
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.copyFileSync(full, target);
        if (entry.name.endsWith('.md')) {
          const markdown = fs.readFileSync(full, 'utf8');
          const title = (markdown.match(/^#\s+(.+)$/m) || [null, entry.name])[1];
          const outputDir = path.posix.dirname(`evidence/latest/${relative}`);
          const depth = outputDir.split('/').filter(Boolean).length;
          const base = '../'.repeat(depth);
          const html = renderPage({
            route: `evidence/latest/${relative}`,
            title,
            description: `Generated evidence: ${relative}`,
            current: 'evidence',
            base,
            content: `<p class="eyebrow">Generated evidence</p><div class="callout warning"><strong>Automated observation only.</strong> This is not a real screen-reader session, a WCAG conformance statement, or human approval.</div><article class="prose">${renderMarkdown(markdown)}</article>
<p class="small"><a href="${base}evidence.html">Back to the evidence index</a> · <a href="${base}data/sources.lock.json">Source lock</a></p>`
          });
          fs.writeFileSync(path.join(evidenceDir, relative.replace(/\.md$/, '.html')), html);
        }
      }
    }
  };
  copyEvidence(latest);
  write('data/evidence.json', `${JSON.stringify(evidenceInfo, null, 2)}\n`);
} else {
  write('data/evidence.json', `${JSON.stringify(evidenceInfo, null, 2)}\n`);
}

const pageManifest = realAssets ? manifest : {generated: false, pages: [], succeeded: 0, failed: 0};
const pages = [
  ...buildStaticPages({root, registry, issues, buildInfo, manifest: pageManifest, lock}),
  ...buildComponentPages({root, registry, issues, manifest: pageManifest, lock}),
  ...buildExperimentPages({root, registry, issues, manifest: pageManifest}),
  ...buildDocPages({root})
];
for (const page of pages) write(page.route, page.html);

const routes = [
  'index.html',
  'components.html',
  'experiments.html',
  'ideas.html',
  'evidence.html',
  'compare.html',
  'guide.html',
  'preferences.html',
  'demo.html',
  'demo/uswds-landing.html',
  'demo/ogds-landing.html',
  ...registry.components.flatMap(component => ['baseline', 'experiment'].map(variant => `fixture/${component.slug}-${variant}.html`)),
  ...registry.components.map(component => `component/${component.slug}.html`),
  ...registry.experiments.map(experiment => `experiment/${experiment.id}.html`)
];
if (new Set(routes).size !== routes.length) throw new Error('Duplicate route generated.');
write('data/routes.json', `${JSON.stringify(routes, null, 2)}\n`);
write('data/build.json', `${JSON.stringify(buildInfo, null, 2)}\n`);

console.log(`Built ${dist}`);
console.log(`  baseline: ${realAssets ? `${lock.baseline.release} (${lock.baseline.version})` : 'OFFLINE ILLUSTRATION; no USWDS assets'}`);
console.log(`  fixtures: ${registry.components.length * 2}; components: ${registry.components.length}; experiments: ${registry.experiments.length}`);
const docPageCount = pages.filter(page => page.route.startsWith('docs/')).length;
console.log(`  lab routes: ${routes.length}; documentation pages: ${docPageCount}`);
console.log(`  evidence: ${evidenceInfo.generated ? `run ${evidenceInfo.runId} (${evidenceInfo.succeeded} collected, ${evidenceInfo.failed} failed)` : 'none in this build'}`);
if (!realAssets) console.log('  WARNING: offline illustration only. Do not report its visual output as upstream USWDS.');
