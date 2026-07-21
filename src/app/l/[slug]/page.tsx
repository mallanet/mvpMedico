import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingIsland } from "@/components/booking/booking-island";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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

  // DECISION: block booking when membership inactive to enforce paid model
  const canBook = membership?.status === "active";
  const doctorName = resource?.display_name || landing.headline || "Médico";

  return (
    <article className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
          {directory?.specialty || "Consulta médica"}
          {directory?.zone ? ` · ${directory.zone}` : ""}
        </p>
        <h1 className="font-[family-name:var(--font-source-serif)] text-4xl leading-tight text-stone-900">
          {landing.headline || doctorName}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-stone-700">
          {landing.body || directory?.bio_short || "Pedí tu turno desde aquí."}
        </p>
        {landing.show_donation_cta ? (
          <p className="text-sm text-stone-600">
            ¿Querés apoyar a la comunidad?{" "}
            <a
              href={donationUrl}
              className="font-medium text-stone-900 underline"
              target="_blank"
              rel="noreferrer"
            >
              Donar a Mallanet
            </a>{" "}
            (opcional, no bloquea la reserva).
          </p>
        ) : null}
      </div>

      <div>
        {canBook ? (
          <BookingIsland slug={slug} doctorName={doctorName} />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
            Las reservas online están pausadas (membresía no activa). Contactá al
            consultorio por otro canal.
          </div>
        )}
      </div>
    </article>
  );
}
