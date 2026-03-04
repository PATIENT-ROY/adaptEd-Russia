import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3010",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev:once",
      cwd: "../server",
      url: "http://localhost:3013/health",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        RATE_LIMIT: "false",
        NODE_ENV: "test",
        PORT: "3013",
      },
    },
    {
      command: "npm run dev -- -p 3010",
      cwd: ".",
      url: "http://localhost:3010",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: "http://localhost:3013/api",
      },
    },
  ],
});
