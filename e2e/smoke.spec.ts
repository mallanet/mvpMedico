import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home shows Waira brand and CTAs", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");
    await expect(main.getByText("Waira").first()).toBeVisible();
    await expect(
      main.getByRole("heading", { name: /un horario/i }),
    ).toBeVisible();
    await expect(
      main.getByRole("link", { name: /activar membresía/i }).first(),
    ).toBeVisible();
    await expect(
      main.getByRole("link", { name: /ver perfil demo/i }).first(),
    ).toBeVisible();
  });

  test("preview sandbox loads clinic picker", async ({ page }) => {
    await page.goto("/preview");
    await expect(
      page.getByRole("heading", { name: /elegí clínica/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /metropolitano/i }),
    ).toBeVisible();
    await page.getByRole("option", { name: /vozandes/i }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /vozandes/i }),
    ).toBeVisible();
    await expect(page.getByRole("form", { name: /pedir turno/i })).toBeVisible();
  });

  test("doctor panel and cross-clinic overlap", async ({ page }) => {
    await page.goto("/preview/doctor");
    await expect(
      page.getByRole("heading", { name: /panel doctor/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/nombre del doctor/i)).toBeVisible();

    const seedLabel = await page.evaluate(() => {
      const key = "waira-preview-sandbox-v2";
      const windows = [1, 2, 3, 4, 5].flatMap((weekday) => [
        { weekday, start: "09:00", end: "13:00" },
        { weekday, start: "15:00", end: "18:00" },
      ]);
      const doctor = {
        id: "sandbox-doctor",
        displayName: "Dra. Demo Waira",
        affiliations: [
          { clinicId: "metropolitano-quito", windows },
          { clinicId: "vozandes-quito", windows },
        ],
        appointmentsByClinic: {} as Record<string, unknown[]>,
      };

      const day = new Date();
      day.setHours(12, 0, 0, 0);
      while (day.getDay() === 0) day.setDate(day.getDate() + 1);
      let starts = new Date(day);
      starts.setHours(16, 0, 0, 0);
      if (starts.getTime() <= Date.now()) {
        day.setDate(day.getDate() + 1);
        while (day.getDay() === 0) day.setDate(day.getDate() + 1);
        starts = new Date(day);
        starts.setHours(16, 0, 0, 0);
      }
      const ends = new Date(starts.getTime() + 30 * 60 * 1000);
      const id = crypto.randomUUID();
      doctor.appointmentsByClinic["metropolitano-quito"] = [
        {
          id,
          resource_id: "sandbox-metropolitano-quito",
          patient_id: null,
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          status: "scheduled",
          notes: null,
          patients_min: {
            id: `p-${id}`,
            full_name: "Paciente Seed",
            phone: "0999999999",
            email: null,
          },
        },
      ];
      localStorage.setItem(key, JSON.stringify(doctor));
      return starts.toISOString();
    });

    await page.goto("/preview/doctor/calendar");
    await expect(page.getByText(/paciente seed/i)).toBeVisible();
    await expect(page.getByText(/metropolitano/i).first()).toBeVisible();

    // Same instant must be rejected for Vozandes by the store API (overlap global)
    const createBlocked = await page.evaluate((startsAt) => {
      const key = "waira-preview-sandbox-v2";
      const doctor = JSON.parse(localStorage.getItem(key)!);
      const endsAt = new Date(
        new Date(startsAt).getTime() + 30 * 60 * 1000,
      ).toISOString();
      const busy = Object.values(
        doctor.appointmentsByClinic as Record<
          string,
          { status: string; starts_at: string; ends_at: string }[]
        >,
      )
        .flat()
        .filter((a) => a.status !== "cancelled");
      return busy.some(
        (b) => startsAt < b.ends_at && endsAt > b.starts_at,
      );
    }, seedLabel);
    expect(createBlocked).toBe(true);

    await page.goto("/preview?clinic=vozandes-quito");
    await expect(
      page.getByRole("heading", { level: 1, name: /vozandes/i }),
    ).toBeVisible();
    await expect(page.getByRole("form", { name: /pedir turno/i })).toBeVisible();
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
