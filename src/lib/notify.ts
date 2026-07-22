/**
 * Minimal appointment email notifications.
 * Uses Resend HTTP API when RESEND_API_KEY is set; otherwise no-op (logs in dev).
 */
type NotifyInput = {
  to?: string | null;
  subject: string;
  text: string;
};

export async function notifyEmail(input: NotifyInput): Promise<void> {
  const to = input.to?.trim();
  if (!to || !to.includes("@")) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "Waira <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[notify]", input.subject, "→", to);
    }
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        text: input.text,
      }),
    });
  } catch (err) {
    console.error("[notify] failed", err instanceof Error ? err.message : err);
  }
}
