import { expect, test } from "@playwright/test";

test("shows the 3d prototype screen", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Okuyuki-UI-Playground/,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /Collapse settings/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Scene loading")).toBeVisible();
  await expect(page.getByLabel("Physics")).toBeVisible();
  await expect(page.getByLabel("Shift Depth Step")).toBeVisible();
  await expect(page.getByLabel("Ctrl Grid Snap Step")).toBeVisible();
  await expect(
    page.getByText(
      /Physics enabled: select an object to start screen-depth-drag editing/i,
    ),
  ).toBeVisible();
});

test("collapses the settings window", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Collapse settings/i }).click();

  await expect(
    page.getByRole("button", { name: /Expand settings/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Depth Wheel Step")).toHaveCount(0);
});
