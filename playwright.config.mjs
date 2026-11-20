import {defineConfig, devices} from '@playwright/test';

const port = Number(process.env.LAB_TEST_PORT || 4181);
const baseURL = `http://127.0.0.1:${port}`;
const channel = process.env.LAB_BROWSER_CHANNEL ? {channel: process.env.LAB_BROWSER_CHANNEL} : {};

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome'], ...channel}},
    {name: 'firefox', use: {...devices['Desktop Firefox']}},
    {name: 'webkit', use: {...devices['Desktop Safari']}}
  ],
  webServer: {
    command: 'node scripts/serve.mjs',
    url: `${baseURL}/index.html`,
    env: {...process.env, PORT: String(port)},
    reuseExistingServer: false,
    timeout: 30000
  }
});
