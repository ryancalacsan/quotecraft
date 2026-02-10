import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    // Global setup - runs once before all tests
    {
      name: 'global-setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: /global\.teardown\.ts/,
    },

    // Auth setup - authenticates and saves session state
    // Longer timeout as Clerk Sign-In Token flow can be slow
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      dependencies: ['global-setup'],
      timeout: 120000,
    },

    // Smoke tests - no auth required
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Demo login tests - test the login flow itself (depends on global-setup only)
    {
      name: 'demo-login',
      testMatch: /demo-login\.spec\.ts/,
      dependencies: ['global-setup'],
      use: { ...devices['Desktop Chrome'] },
    },

    // Authenticated tests - depend on auth setup
    {
      name: 'authenticated',
      testMatch: /^(?!.*(?:smoke|demo-login|auth\.setup|global)).*\.spec\.ts$/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
