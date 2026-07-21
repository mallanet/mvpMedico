"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "");

    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: "doctor" },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    // DECISION: signup lands on onboarding; login goes to calendar.
    router.push(mode === "signup" ? "/onboarding" : "/calendar");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      {mode === "signup" ? (
        <label className="flex flex-col gap-1.5 text-sm text-teal-950">
          Nombre completo
          <input
            name="fullName"
            required
            className="field"
            placeholder="Dra. Ana Pérez"
          />
        </label>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm text-teal-950">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-teal-950">
        Contraseña
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="field"
        />
      </label>
      {error ? (
        <p
          className="rounded-[var(--radius-control)] bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? "Un segundo…" : mode === "login" ? "Entrar" : "Crear cuenta"}
      </button>
    </form>
  );
}
