import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html'],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    // Descomentar se precisar de autenticação global:
    // {
    //   name: 'setup',
    //   testMatch: /.*\.setup\.ts/,
    // },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // dependencies: ['setup'],  // descomentar com auth
      // use: { storageState: 'auth.json' },  // descomentar com auth
    },
    // Descomentar para multi-browser:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
