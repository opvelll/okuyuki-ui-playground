import { expect, test } from "@playwright/test";

test("shows the 3d prototype screen", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /3D UI Playground/,
    }),
  ).toBeVisible();
});
