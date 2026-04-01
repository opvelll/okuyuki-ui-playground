import { expect, test } from "@playwright/test";

test("shows the starter screen", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /React \/ Three\.js の制作環境をそのまま触り始められる土台/,
    }),
  ).toBeVisible();
});
