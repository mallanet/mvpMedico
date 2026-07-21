import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingIsland } from "@/components/booking/booking-island";
import { isDemoMode } from "@/lib/mock/mode";
import { getDemoLandingBySlug } from "@/lib/mock/appointments";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (isDemoMode()) {
    const demo = await getDemoLandingBySlug(slug);
    if (!demo) return { title: "Landing no encontrada · Waira" };
    return {
      title: `${demo.landing.headline || slug} · Waira`,
      description:
        demo.landing.body?.slice(0, 160) || "Pedí tu turno online",
    };
  }

  const supabase = await createClient();
  const { data: landing } = await supabase
    .from("landings")
    .select("headline, body, is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!landing) {
    return { title: "Landing no encontrada · Waira" };
  }

  return {
    title: `${landing.headline || slug} · Waira`,
    description: landing.body?.slice(0, 160) || "Pedí tu turno online",
    openGraph: {
      title: landing.headline || slug,
      description: landing.body?.slice(0, 160) || "Pedí tu turno online",
      type: "website",
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;

  if (isDemoMode()) {
    const demo = await getDemoLandingBySlug(slug);
    if (!demo) notFound();

    const donationUrl =
      demo.landing.donation_url ||
      process.env.NEXT_PUBLIC_MALLANET_DONATION_URL ||
      "#";
    const canBook = demo.membership.status === "active";
    const doctorName = demo.doctorName;

    return (
      <article className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-12">
        <div className="space-y-5">
          <p className="text-sm text-teal-800/75">
            {demo.directory.specialty || "Consulta médica"}
            {demo.directory.zone ? ` · ${demo.directory.zone}` : ""}
          </p>
          <h1 className="min-w-0 break-words font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight leading-[1.12] text-teal-950">
            {demo.landing.headline || doctorName}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-teal-900/75">
            {demo.landing.body ||
              demo.directory.bio_short ||
              "Pedí tu turno desde aquí."}
          </p>
          {demo.landing.show_donation_cta ? (
            <p className="text-sm text-teal-900/70">
              ¿Querés donar a Mallanet?{" "}
              <a
                href={donationUrl}
                className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-950"
                target="_blank"
                rel="noreferrer"
              >
                Ir a donar
              </a>
              . No hace falta para reservar.
            </p>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-6">
          {canBook ? (
            <BookingIsland
              slug={slug}
              doctorName={doctorName}
              specialty={demo.directory.specialty}
              ctaLabel={demo.landing.cta_label || "Pedir turno"}
            />
          ) : (
            <div
              className="rounded-[var(--radius-panel)] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"
              role="status"
            >
              Las reservas online están pausadas porque la membresía no está
              activa. Escribile al consultorio por otro medio.
            </div>
          )}
        </div>
      </article>
    );
  }

  const supabase = await createClient();

  const { data: landing } = await supabase
    .from("landings")
    .select(
      "id, resource_id, slug, headline, body, cta_label, show_donation_cta, donation_url, is_published",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!landing) notFound();

  const { data: resource } = await supabase
    .from("resources")
    .select("display_name, clinic_id")
    .eq("id", landing.resource_id)
    .maybeSingle();

  const [{ data: directory }, { data: membership }] = await Promise.all([
    supabase
      .from("directory_profiles")
      .select("specialty, zone, bio_short")
      .eq("resource_id", landing.resource_id)
      .maybeSingle(),
    resource?.clinic_id
      ? supabase
          .from("memberships")
          .select("status")
          .eq("clinic_id", resource.clinic_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const donationUrl =
    landing.donation_url ||
    process.env.NEXT_PUBLIC_MALLANET_DONATION_URL ||
    "#";

  const canBook = membership?.status === "active";
  const doctorName = resource?.display_name || landing.headline || "Médico";

  return (
    <article className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-12">
      <div className="space-y-5">
        <p className="text-sm text-teal-800/75">
          {directory?.specialty || "Consulta médica"}
          {directory?.zone ? ` · ${directory.zone}` : ""}
        </p>
        <h1 className="min-w-0 break-words font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight leading-[1.12] text-teal-950">
          {landing.headline || doctorName}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-teal-900/75">
          {landing.body || directory?.bio_short || "Pedí tu turno desde aquí."}
        </p>
        {landing.show_donation_cta ? (
          <p className="text-sm text-teal-900/70">
            ¿Querés donar a Mallanet?{" "}
            <a
              href={donationUrl}
              className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-950"
              target="_blank"
              rel="noreferrer"
            >
              Ir a donar
            </a>
            . No hace falta para reservar.
          </p>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-6">
        {canBook ? (
          <BookingIsland
            slug={slug}
            doctorName={doctorName}
            specialty={directory?.specialty || undefined}
            ctaLabel={landing.cta_label || "Pedir turno"}
          />
        ) : (
          <div
            className="rounded-[var(--radius-panel)] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"
            role="status"
          >
            Las reservas online están pausadas porque la membresía no está
            activa. Escribile al consultorio por otro medio.
          </div>
        )}
      </div>
    </article>
  );
}
