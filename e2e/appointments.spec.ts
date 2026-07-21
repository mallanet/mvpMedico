import { test, expect } from "@playwright/test";

/**
 * Full appointment flow against a live Supabase.
 * Skips when E2E credentials are not provided.
 */
test.describe("appointments core", () => {
  test.skip(
    !process.env.E2E_DOCTOR_EMAIL || !process.env.E2E_DOCTOR_PASSWORD,
    "Set E2E_DOCTOR_EMAIL and E2E_DOCTOR_PASSWORD to run authenticated agenda tests",
  );

  test("doctor can open calendar and see create appointment form", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_DOCTOR_EMAIL!);
    await page.getByLabel(/contraseña/i).fill(process.env.E2E_DOCTOR_PASSWORD!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/calendar/);
    await expect(page.getByRole("form", { name: /crear turno/i })).toBeVisible();
  });
});
