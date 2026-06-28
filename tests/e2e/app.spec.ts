import { expect, test } from "@playwright/test";

async function expandSettings(page: Parameters<typeof test>[0]["page"]) {
  await page.getByRole("button", { name: /Expand settings/i }).click();
}

async function expandGeneralColors(page: Parameters<typeof test>[0]["page"]) {
  await page.getByRole("button", { name: /Expand color settings/i }).click();
}

async function expandHud(page: Parameters<typeof test>[0]["page"]) {
  await page.getByRole("button", { name: /Expand HUD/i }).click();
}

async function selectAmberBox(page: Parameters<typeof test>[0]["page"]) {
  await page.waitForFunction(() => window.__OKUYUKI_E2E__);
  await page.evaluate(() => window.__OKUYUKI_E2E__?.selectObject("amber-box"));
}

test("shows the 3d prototype screen", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Okuyuki-UI-Playground/,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /Expand settings/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Move tool/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Switch to Rotate tool/i }),
  ).toHaveCount(0);
  await expect(page.getByLabel(/面に吸着/i)).toHaveCount(0);
  await expect(page.getByLabel(/軸に吸着/i)).toHaveCount(0);
  await expect(page.getByLabel(/一定間隔に吸着/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Expand HUD/i })).toBeVisible();
  await expect(page.getByText("FPS", { exact: true })).toHaveCount(0);

  await selectAmberBox(page);
  await expect(
    page.getByRole("button", { name: /Move selected object/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Rotate selected object/i }),
  ).toBeVisible();
  await expect(page.getByLabel(/面に吸着/i)).toHaveCount(0);

  await page.getByRole("button", { name: /Move selected object/i }).click();
  const surfaceSnapToggle = page.getByLabel(/面に吸着/i);
  const axisSnapToggle = page.getByLabel(/軸に吸着/i);
  const intervalSnapToggle = page.getByLabel(/一定間隔に吸着/i);
  await expect(surfaceSnapToggle).toBeVisible();
  await expect(surfaceSnapToggle).not.toBeChecked();
  await expect(axisSnapToggle).not.toBeChecked();
  await expect(intervalSnapToggle).not.toBeChecked();
  await surfaceSnapToggle.check();
  await expect(surfaceSnapToggle).toBeChecked();
  await axisSnapToggle.check();
  await expect(axisSnapToggle).toBeChecked();
  await intervalSnapToggle.check();
  await expect(axisSnapToggle).not.toBeChecked();
  await expect(intervalSnapToggle).toBeChecked();

  await expandHud(page);
  await expect(
    page.getByText(
      /Move mode: drag the center point to move on the screen plane/i,
    ),
  ).toBeVisible();
  await expect(page.getByText("FPS", { exact: true })).toBeVisible();

  await expandSettings(page);

  await expect(
    page.getByRole("button", { name: /Collapse settings/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Physics")).toBeVisible();
  await expect(page.getByLabel("Show FPS / FPS表示")).toBeVisible();
  await expect(page.getByRole("button", { name: /全体/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /物理演算/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Move screen-depth drag/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Rotate arcball rotate/i }),
  ).toBeVisible();

  await expandGeneralColors(page);

  await expect(page.getByLabel("Scene Background")).toBeVisible();
  await expect(page.getByLabel("Fog Color")).toBeVisible();
  await expect(page.getByLabel("Floor Color")).toBeVisible();
  await expect(page.getByLabel("Grid Major")).toBeVisible();
  await expect(page.getByLabel("Grid Minor")).toBeVisible();
});

test("collapses the settings window", async ({ page }) => {
  await page.goto("/");

  await expandSettings(page);
  await page.getByRole("button", { name: /Collapse settings/i }).click();

  await expect(
    page.getByRole("button", { name: /Expand settings/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Move tool/i }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /全体/i })).toHaveCount(0);
});

test("switches to physics settings", async ({ page }) => {
  await page.goto("/");

  await expandSettings(page);
  await page.getByRole("button", { name: /物理演算/i }).click();

  await expect(page.getByLabel("Rigid Body Mode")).toBeVisible();
  await expect(page.getByLabel("Object Friction")).toBeVisible();
  await expect(page.getByLabel("Gravity Y")).toBeVisible();
});

test("switches tool mode and opens rotate settings", async ({ page }) => {
  await page.goto("/");

  await selectAmberBox(page);
  await expect(
    page.getByRole("button", { name: /Rotate selected object/i }),
  ).toBeVisible();
  await expect(page.getByLabel(/ドラッグ感度/i)).toHaveCount(0);
  await page.getByRole("button", { name: /Rotate selected object/i }).click();

  await expect(page.getByText(/Object Rotate/i)).toBeVisible();
  await expandHud(page);
  await expect(
    page.getByText(/Rotate mode: drag the sphere gizmo to rotate/i),
  ).toBeVisible();
  await expect(page.getByLabel(/面に吸着/i)).toHaveCount(0);
  const rotateQuickSettings = page.getByLabel("Rotate quick settings");
  const quickSensitivity = rotateQuickSettings.getByLabel(/ドラッグ感度/i);
  await expect(quickSensitivity).toBeVisible();
  await quickSensitivity.fill("1.5");
  await expect(rotateQuickSettings.getByText("1.50x")).toBeVisible();

  await expandSettings(page);
  await page.getByRole("button", { name: /Rotate arcball rotate/i }).click();

  await expect(page.getByLabel("UI Strength")).toBeVisible();
  await expect(page.getByLabel("Arcball Sensitivity")).toBeVisible();
  await expect(page.getByLabel("UI Radius Px")).toBeVisible();
  await expect(page.getByLabel("Wheel Rotate Step")).toBeVisible();
  await expect(page.getByLabel("Twist Axis")).toBeVisible();
});
