"use client";

import { useState } from "react";

export function SyncGoogleButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSync() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/google/sync", { method: "POST" });
    const data = (await res.json()) as {
      ok: boolean;
      imported?: number;
      error?: string;
    };
    setLoading(false);
    if (!data.ok) {
      setMessage(data.error ?? "Error al sincronizar");
      return;
    }
    setMessage(`Importados ${data.imported ?? 0} bloqueos.`);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onSync}
        disabled={loading}
        className="rounded-lg border border-teal-900/15 px-4 py-2 text-sm hover:bg-teal-50 disabled:opacity-60"
      >
        {loading ? "Sincronizando…" : "Sincronizar busy ahora"}
      </button>
      {message ? <p className="text-sm text-teal-900/80">{message}</p> : null}
    </div>
  );
}
