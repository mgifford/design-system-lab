import {defineConfig, devices} from '@playwright/test';
import {withGuidepup} from '@guidepup/playwright';

const port = Number(process.env.LAB_AT_PORT || 4182);
const baseURL = `http://127.0.0.1:${port}`;

export default withGuidepup({
  testDir: './tests/guidepup',
  outputDir: 'test-results/guidepup',
  fullyParallel: false,
  workers: 1,
  timeout: 5 * 60 * 1000,
  expect: {timeout: 20000},
  reporter: [['list'], ['html', {open: 'never', outputFolder: 'playwright-report/guidepup'}]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {name: 'voiceover', use: {...devices['Desktop Safari']}}
  ],
  webServer: {
    command: 'node scripts/serve.mjs',
    url: `${baseURL}/index.html`,
    env: {...process.env, PORT: String(port)},
    reuseExistingServer: false,
    timeout: 30000
  }
});
