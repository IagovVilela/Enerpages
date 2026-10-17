import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center px-6 py-10">
      <div className="grid w-full max-w-sm gap-10">
        <div className="grid gap-4">
          <BrandMark size="lg" />
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--studio-ink)_55%,transparent)]">
              Acesso interno
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-brand-display)] text-3xl font-medium tracking-tight">
              Studio
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color-mix(in_srgb,var(--studio-ink)_65%,transparent)]">
              Crie e publique landing pages com a identidade dos seus clientes.
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
