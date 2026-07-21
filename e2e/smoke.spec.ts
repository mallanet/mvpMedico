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
      page.getByRole("heading", { name: /presencia entre clínicas/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/nombre del doctor/i)).toBeVisible();

    const seedLabel = await page.evaluate(() => {
      const key = "waira-preview-sandbox-v3";
      const windows = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        start: "08:00",
        end: "20:00",
      }));
      const doctor = {
        id: "sandbox-doctor",
        displayName: "Dra. Valentina Reyes",
        specialty: "Cardiología",
        zone: "Quito · multi-sede",
        bioShort: "Demo",
        seedVersion: 3,
        affiliations: [
          { clinicId: "metropolitano-quito", windows },
          { clinicId: "vozandes-quito", windows },
        ],
        appointmentsByClinic: {} as Record<string, unknown[]>,
      };

      const day = new Date();
      day.setHours(12, 0, 0, 0);
      let starts = new Date(day);
      starts.setHours(16, 0, 0, 0);
      if (starts.getTime() <= Date.now()) {
        day.setDate(day.getDate() + 1);
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

    const createBlocked = await page.evaluate((startsAt) => {
      const key = "waira-preview-sandbox-v3";
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
    await expect(page.getByText(/cardiolog/i).first()).toBeVisible();
    await expect(page.getByLabel(/^nombre$/i)).toBeVisible();
    await expect(page.getByLabel(/^apellido$/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first(),
    ).toBeVisible({ timeout: 10_000 });
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

  test("demo mode login and landing book", async ({ page }) => {
    test.skip(
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "mock" &&
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      "Requires demo mode (NEXT_PUBLIC_SUPABASE_URL=mock)",
    );

    await page.goto("/login");
    await page.getByLabel(/email/i).fill("doctor@example.com");
    await page.getByLabel(/contraseña/i).fill("password123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/calendar/);
    await expect(page.getByText(/valentina|reyes|demo/i).first()).toBeVisible();

    await page.goto("/l/dra-reyes");
    await expect(
      page.getByRole("heading", { name: /valentina|reyes|agenda/i }),
    ).toBeVisible();
    await expect(page.getByRole("form", { name: /pedir turno/i })).toBeVisible();
    const slot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
    await expect(slot).toBeVisible({ timeout: 10_000 });
    await slot.click();
    await page.getByLabel(/^nombre$/i).fill("Paciente");
    await page.getByLabel(/^apellido$/i).fill("Demo");
    await page.getByLabel(/teléfono/i).fill("+593990000000");
    await page.getByRole("button", { name: /confirmar turno/i }).click();
    await expect(page.getByText(/turno solicitado/i)).toBeVisible();
    await expect(page.getByText(/WRA-/i)).toBeVisible();
  });
});
