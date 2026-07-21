"use client";

import { useState, useTransition } from "react";
import { disconnectGoogle } from "@/lib/appointments";

type Props = {
  connected: boolean;
  configured: boolean;
  membershipActive: boolean;
};

export function GoogleConnectButton({
  connected,
  configured,
  membershipActive,
}: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDisconnect() {
    startTransition(async () => {
      const result = await disconnectGoogle();
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Google desconectado.");
      window.location.reload();
    });
  }

  if (!configured) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        Configurá Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
        `GOOGLE_REDIRECT_URI`).
      </p>
    );
  }

  if (!membershipActive) {
    return (
      <p className="text-sm text-amber-900">
        La sync de Google requiere membresía Waira activa.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href="/api/google/oauth"
        className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
      >
        {connected ? "Reconectar Google Calendar" : "Conectar Google Calendar"}
      </a>
      {connected ? (
        <button
          type="button"
          disabled={pending}
          onClick={onDisconnect}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {pending ? "Desconectando…" : "Desconectar"}
        </button>
      ) : null}
      {message ? <p className="w-full text-sm text-teal-900/80">{message}</p> : null}
    </div>
  );
}
