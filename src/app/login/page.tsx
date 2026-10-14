import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="grid w-full max-w-sm gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.22em]">Acesso interno</p>
          <h1 className="mt-2 text-4xl tracking-tight">Studio de Landing Pages</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
