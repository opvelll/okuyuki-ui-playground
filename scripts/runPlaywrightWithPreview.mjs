import { spawn } from "node:child_process";

const PREVIEW_URL = "http://127.0.0.1:4173";
const PREVIEW_ARGS = [
  "exec",
  "vite",
  "preview",
  "--host",
  "127.0.0.1",
  "--port",
  "4173",
  "--strictPort",
];
const DEFAULT_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 1_000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isPreviewReady() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(PREVIEW_URL, {
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForPreview(timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isPreviewReady()) {
      return;
    }

    await wait(250);
  }

  throw new Error(`Timed out waiting for preview server at ${PREVIEW_URL}`);
}

function killProcess(child) {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }

  child.kill("SIGTERM");
}

async function main() {
  const playwrightArgs = process.argv.slice(2);
  const preview = spawn("pnpm", PREVIEW_ARGS, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  const cleanup = () => killProcess(preview);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);

  try {
    await waitForPreview(DEFAULT_TIMEOUT_MS);
  } catch (error) {
    cleanup();
    throw error;
  }

  const playwright = spawn("pnpm", ["exec", "playwright", ...playwrightArgs], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: "0",
    },
    stdio: "inherit",
  });

  const exitCode = await new Promise((resolve, reject) => {
    playwright.on("error", reject);
    playwright.on("exit", (code) => resolve(code ?? 1));
  });

  cleanup();
  process.exit(exitCode);
}

await main();
