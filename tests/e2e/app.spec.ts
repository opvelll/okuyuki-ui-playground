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
  await expect(page.getByRole("button", { name: /全体/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /物理演算/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Move UI tool/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Move UI screen-depth drag/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Rotate UI turntable rotate/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Rotate UI tool/i }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Physics enabled: select an object to start screen-depth-drag editing/i,
    ),
  ).toBeVisible();
  await expect(page.getByText("FPS")).toBeVisible();
});

test("collapses the settings window", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Collapse settings/i }).click();

  await expect(
    page.getByRole("button", { name: /Expand settings/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Move UI tool/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /全体/i })).toHaveCount(0);
});

test("switches to physics settings", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /物理演算/i }).click();

  await expect(page.getByLabel("Rigid Body Mode")).toBeVisible();
  await expect(page.getByLabel("Object Friction")).toBeVisible();
  await expect(page.getByLabel("Gravity Y")).toBeVisible();
});

test("switches tool mode and opens rotate settings", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Switch to Rotate UI tool/i }).click();

  await expect(page.getByText(/Object Rotate/i)).toBeVisible();
  await expect(page.getByText(/Rotate mode:/i)).toBeVisible();

  await page
    .getByRole("button", { name: /Rotate UI turntable rotate/i })
    .click();

  await expect(page.getByLabel("UI Opacity")).toBeVisible();
  await expect(page.getByLabel("UI Radius Px")).toBeVisible();
  await expect(page.getByLabel("Wheel Rotate Step")).toBeVisible();
  await expect(page.getByLabel("Twist Axis")).toBeVisible();
});
