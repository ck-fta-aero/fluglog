import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [['list'], ['json', { outputFile: 'reports/e2e.json' }]],
  use: {
    baseURL: 'http://localhost:4173',
    serviceWorkers: 'allow',
  },
  projects: [{ name: 'webkit-iphone13', use: { ...devices['iPhone 13'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
