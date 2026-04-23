import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";
const serverMode = process.env.PLAYWRIGHT_SERVER_MODE ?? "preview";
const defaultPort = new URL(baseURL).port || "4173";
const webServerCommand =
  serverMode === "dev"
    ? `pnpm run dev -- --host 127.0.0.1 --port ${defaultPort} --strictPort`
    : `pnpm run preview -- --host 127.0.0.1 --port ${defaultPort} --strictPort`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: skipWebServer
    ? undefined
    : {
        command: webServerCommand,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        url: baseURL,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
