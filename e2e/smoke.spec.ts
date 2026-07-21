import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home shows Waira brand and CTAs", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");
    await expect(main.getByText("Waira").first()).toBeVisible();
    await expect(
      main.getByRole("heading", { name: /una agenda/i }),
    ).toBeVisible();
    await expect(main.getByRole("link", { name: /empezar/i })).toBeVisible();
    await expect(main.getByRole("link", { name: /entrar/i })).toBeVisible();
  });

  test("login page renders auth form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /entrar/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
  });

  test("signup page renders auth form", async ({ page }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("heading", { name: /crear cuenta|registr/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
  });
});
