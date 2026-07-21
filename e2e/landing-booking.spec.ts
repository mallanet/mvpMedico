import { test, expect } from "@playwright/test";

test.describe("landing booking", () => {
  test.skip(
    !process.env.E2E_LANDING_SLUG,
    "Set E2E_LANDING_SLUG (published landing) to run public booking UI test",
  );

  test("published landing shows booking form or paused notice", async ({
    page,
  }) => {
    await page.goto(`/l/${process.env.E2E_LANDING_SLUG}`);
    const booking = page.getByRole("form", { name: /pedir turno/i });
    const paused = page.getByText(/reservas online están pausadas/i);
    await expect(booking.or(paused)).toBeVisible();
  });

  test("slot picker and confirmation when membership active", async ({
    page,
  }) => {
    test.skip(
      !process.env.E2E_FULL_BOOKING,
      "Set E2E_FULL_BOOKING=1 to exercise slot booking end-to-end",
    );

    await page.goto(`/l/${process.env.E2E_LANDING_SLUG}`);
    const form = page.getByRole("form", { name: /pedir turno/i });
    await expect(form).toBeVisible();

    const slot = form.getByRole("button").filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await slot.click();

    await form.getByLabel(/tu nombre/i).fill("Paciente Landing");
    await form.getByLabel(/teléfono/i).fill("+5491188880000");
    await form.getByRole("button", { name: /confirmar pedido/i }).click();

    await expect(
      page.getByRole("status", { name: /confirmación de turno/i }),
    ).toBeVisible();
  });
});
