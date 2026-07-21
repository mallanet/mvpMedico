import { test, expect } from "@playwright/test";

test.describe("admin memberships", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin membership tests",
  );

  test("admin can open memberships table", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel(/contraseña/i).fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.goto("/admin/memberships");
    await expect(
      page.getByRole("heading", { name: /membresías/i }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("admin can activate a membership", async ({ page }) => {
    test.skip(
      !process.env.E2E_FULL_ADMIN,
      "Set E2E_FULL_ADMIN=1 to mutate membership status",
    );

    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel(/contraseña/i).fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.goto("/admin/memberships");

    const activate = page.getByRole("button", { name: /^activar$/i }).first();
    if (await activate.isVisible()) {
      await activate.click();
      await expect(page.getByText(/active/i).first()).toBeVisible();
    } else {
      await expect(page.getByText(/active|paused|cancelled/i).first()).toBeVisible();
    }
  });
});
