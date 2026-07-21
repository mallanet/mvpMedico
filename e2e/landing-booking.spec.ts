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
});
