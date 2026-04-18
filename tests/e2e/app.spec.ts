import { expect, test } from "@playwright/test";

async function expandSettings(page: Parameters<typeof test>[0]["page"]) {
  await page.getByRole("button", { name: /Expand settings/i }).click();
}

async function expandGeneralColors(page: Parameters<typeof test>[0]["page"]) {
  await page.getByRole("button", { name: /Expand color settings/i }).click();
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
    page.getByRole("button", { name: /Switch to Prototype screen/i }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Switch to Modeling screen/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Scene loading")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Move UI tool/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Rotate UI tool/i }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Physics enabled: select an object to start screen-depth-drag editing/i,
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
    page.getByRole("button", { name: /Modeling modeling pointer/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Move UI screen-depth drag/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Rotate UI arcball rotate/i }),
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
    page.getByRole("button", { name: /Switch to Move UI tool/i }),
  ).toBeVisible();
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

  await page.getByRole("button", { name: /Switch to Rotate UI tool/i }).click();

  await expect(page.getByText(/Object Rotate/i)).toBeVisible();
  await expect(page.getByText(/Rotate mode:/i)).toBeVisible();

  await expandSettings(page);
  await page.getByRole("button", { name: /Rotate UI arcball rotate/i }).click();

  await expect(page.getByLabel("UI Strength")).toBeVisible();
  await expect(page.getByLabel("Arcball Sensitivity")).toBeVisible();
  await expect(page.getByLabel("UI Radius Px")).toBeVisible();
  await expect(page.getByLabel("Wheel Rotate Step")).toBeVisible();
  await expect(page.getByLabel("Twist Axis")).toBeVisible();
});

test("switches to the modeling screen", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("button", { name: /Switch to Modeling screen/i })
    .click();

  await expect(
    page.getByText("Modeling Screen", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Pointer tool: hover to move the 3D pointer/i),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Modeling screen/i }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Switch to Prototype screen/i }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: /Switch to 3D Pointer tool/i }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Switch to Camera Move tool/i }),
  ).toHaveAttribute("aria-pressed", "false");
});
