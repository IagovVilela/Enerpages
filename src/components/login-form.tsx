"use client";

import { useActionState } from "react";
import { authenticate } from "@/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(authenticate, { error: "" });
  return (
    <form action={action} className="grid w-full max-w-sm gap-3">
      <label className="grid gap-1 text-sm">E-mail
        <input
          className="border border-[var(--studio-line)] bg-white px-3 py-2"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue="admin@enerpages.local"
          required
        />
      </label>
      <label className="grid gap-1 text-sm">Senha
        <input
          className="border border-[var(--studio-line)] bg-white px-3 py-2"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <label className="grid gap-1 text-sm">Código 2FA, se estiver ativo
        <input
          className="border border-[var(--studio-line)] bg-white px-3 py-2"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
        />
      </label>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button className="bg-[var(--studio-ink)] px-4 py-3 text-sm text-[var(--studio-bg)]" disabled={pending} type="submit">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
