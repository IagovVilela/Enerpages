"use client";

import { useState } from "react";
import { beginTotp, confirmTotp, disableTotp } from "@/actions/account";
import { logout } from "@/actions/auth";

export function AccountPanel({ enabled }: { enabled: boolean }) {
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="grid max-w-lg gap-6">
      <p className="text-sm">{enabled ? "A autenticação em duas etapas está ativa." : "A autenticação em duas etapas está desligada."}</p>
      {!enabled ? (
        <button
          className="border px-3 py-2 text-sm"
          type="button"
          onClick={async () => {
            const result = await beginTotp();
            setQr(result.qr);
            setSecret(result.secret);
          }}
        >
          Gerar chave 2FA
        </button>
      ) : null}
      {qr ? (
        <div className="grid gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR Code do autenticador" className="h-40 w-40" />
          <p className="break-all text-xs">{secret}</p>
          <form
            className="flex gap-2"
            action={async (formData) => {
              const result = await confirmTotp(String(formData.get("code") || ""));
              setMessage(result.ok ? "2FA ativo." : result.error);
            }}
          >
            <input className="border px-3 py-2" name="code" placeholder="Código" required />
            <button className="border px-3 py-2 text-sm" type="submit">Confirmar</button>
          </form>
        </div>
      ) : null}
      {enabled ? (
        <form
          className="grid gap-2"
          action={async (formData) => {
            const result = await disableTotp(String(formData.get("password") || ""), String(formData.get("code") || ""));
            setMessage(result.ok ? "2FA desligado." : result.error);
          }}
        >
          <input className="border px-3 py-2" name="password" type="password" placeholder="Senha" required />
          <input className="border px-3 py-2" name="code" placeholder="Código atual" required />
          <button className="border px-3 py-2 text-sm" type="submit">Desligar 2FA</button>
        </form>
      ) : null}
      {message ? <p className="text-sm">{message}</p> : null}
      <form action={logout}><button className="text-sm underline" type="submit">Sair de todas as sessões</button></form>
    </div>
  );
}
