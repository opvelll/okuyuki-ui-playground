import { expect, test } from "@playwright/test";

test("shows the prototype app @prototype", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Okuyuki Prototype/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Open settings/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Scene loading")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Move UI tool/i }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Physics enabled: select an object to start screen-depth-drag editing/i,
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: /Open settings/i }).click();

  await expect(
    page.getByRole("dialog", { name: /Settings window/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /物理演算/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Modeling/i })).toHaveCount(0);
});

test("shows the modeling app @modeling", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Okuyuki Modeling/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Open settings/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Modeling scene loading")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch to Lasso tool/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/Lasso tool: drag a screen-space loop/i),
  ).toBeVisible();

  await page.getByRole("button", { name: /Open settings/i }).click();

  await expect(
    page.getByRole("dialog", { name: /Settings window/i }),
  ).toBeVisible();
  await expect(page.getByTitle(/modeling pointer/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /物理演算/i })).toHaveCount(0);
});
