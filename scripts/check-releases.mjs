#!/usr/bin/env node
/**
 * Source provenance and release checks.
 *
 *   npm run sources:verify   Compare the committed lock with the installed package.
 *   npm run sources:write    Refresh hashes/version in data/sources.lock.json.
 *   npm run sources:latest   Query GitHub for the latest non-prerelease release.
 *
 * A newer release is reported, never promoted automatically. Promotion is a
 * maintainer decision recorded in GOVERNANCE.md and a reviewed pull request.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = path.join(root, 'data', 'sources.lock.json');
const packagePath = path.join(root, 'package.json');
const installedPath = path.join(root, 'node_modules', '@uswds', 'uswds', 'package.json');
const cssPath = path.join(root, 'node_modules', '@uswds', 'uswds', 'dist', 'css', 'uswds.min.css');
const jsPath = path.join(root, 'node_modules', '@uswds', 'uswds', 'dist', 'js', 'uswds.min.js');
const lockfilePath = path.join(root, 'package-lock.json');

const args = new Set(process.argv.slice(2));
const sha256 = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const today = () => new Date().toISOString().slice(0, 10);

function fail(message) {
  console.error(`source-check: ${message}`);
  process.exit(1);
}

function installed() {
  if (!fs.existsSync(installedPath)) fail('@uswds/uswds is not installed; run npm ci first.');
  return readJson(installedPath).version;
}

function expected() {
  if (!fs.existsSync(lockPath)) fail('data/sources.lock.json is missing.');
  return readJson(lockPath);
}

function currentHashes() {
  const missing = [cssPath, jsPath, lockfilePath].filter(file => !fs.existsSync(file));
  if (missing.length) fail(`missing files: ${missing.map(file => path.relative(root, file)).join(', ')}`);
  return {
    version: installed(),
    packageLockSha256: sha256(lockfilePath),
    assets: {
      css: {path: 'dist/css/uswds.min.css', sha256: sha256(cssPath)},
      js: {path: 'dist/js/uswds.min.js', sha256: sha256(jsPath)}
    }
  };
}

function verify() {
  const lock = expected();
  const current = currentHashes();
  const problems = [];
  if (lock.baseline.version !== current.version) problems.push(`version ${current.version} != locked ${lock.baseline.version}`);
  if (lock.baseline.packageLock?.sha256 !== current.packageLockSha256) problems.push('package-lock.json hash differs from the lock');
  if (lock.baseline.assets?.css?.sha256 !== current.assets.css.sha256) problems.push('USWDS CSS hash differs from the lock');
  if (lock.baseline.assets?.js?.sha256 !== current.assets.js.sha256) problems.push('USWDS JS hash differs from the lock');
  const pkg = readJson(packagePath);
  if (pkg.dependencies?.['@uswds/uswds'] !== lock.baseline.version) problems.push('package.json is not pinned to the locked version');
  if (problems.length) {
    console.error(problems.map(problem => ` - ${problem}`).join('\n'));
    console.error('If this change is intentional, run npm run sources:write in a reviewed pull request.');
    process.exit(1);
  }
  console.log(`Verified USWDS ${current.version} (${lock.baseline.release}), CSS/JS hashes, and package-lock hash.`);
}

function write() {
  const lock = expected();
  const current = currentHashes();
  lock.verifiedAt = today();
  lock.baseline.version = current.version;
  lock.baseline.packageLock = {path: 'package-lock.json', sha256: current.packageLockSha256};
  lock.baseline.assets = current.assets;
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`Updated data/sources.lock.json for USWDS ${current.version}.`);
  console.log('Review the diff: version, commit, release date, and hashes are provenance, not decoration.');
}

async function latest() {
  const lock = expected();
  const response = await fetch('https://api.github.com/repos/uswds/uswds/releases/latest', {
    headers: {'User-Agent': 'uswds-futures-lab-source-check', Accept: 'application/vnd.github+json'}
  });
  if (!response.ok) fail(`GitHub release query failed: HTTP ${response.status}`);
  const release = await response.json();
  if (release.draft || release.prerelease) fail('GitHub returned a draft or prerelease as latest.');
  console.log(`Locked baseline: ${lock.baseline.release} (${lock.baseline.version})`);
  console.log(`GitHub latest:   ${release.tag_name} published ${release.published_at}`);
  if (release.tag_name === lock.baseline.release) {
    console.log('Baseline is current. No change proposed.');
    return;
  }
  console.log('\nA newer stable release exists. This does NOT change the baseline automatically.');
  console.log('Proposal workflow:');
  console.log(' 1. Open an issue recording the release notes and compatibility questions.');
  console.log(' 2. Create a branch, update the dependency and lockfile, run npm run sources:write.');
  console.log(' 3. Rebuild, run all tests and evidence collection, and compare historical reports.');
  console.log(' 4. A maintainer records an explicit decision before the baseline changes.');
}

if (args.has('--verify')) verify();
else if (args.has('--write')) write();
else if (args.has('--latest')) await latest();
else {
  console.log('Usage: node scripts/check-releases.mjs [--verify|--write|--latest]');
  process.exitCode = 0;
}
