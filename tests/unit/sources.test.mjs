import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const sha256 = relative => createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
const lock = readJson('data/sources.lock.json');

test('package lock matches the source lock', () => {
  assert.equal(sha256('package-lock.json'), lock.baseline.packageLock.sha256);
});

test('installed USWDS assets match the source lock', t => {
  const css = 'node_modules/@uswds/uswds/dist/css/uswds.min.css';
  const js = 'node_modules/@uswds/uswds/dist/js/uswds.min.js';
  if (!fs.existsSync(path.join(root, css)) || !fs.existsSync(path.join(root, js))) {
    t.skip('node_modules is not installed; run npm ci to verify asset hashes.');
    return;
  }
  assert.equal(sha256(css), lock.baseline.assets.css.sha256);
  assert.equal(sha256(js), lock.baseline.assets.js.sha256);
  assert.equal(readJson('node_modules/@uswds/uswds/package.json').version, lock.baseline.version);
});
