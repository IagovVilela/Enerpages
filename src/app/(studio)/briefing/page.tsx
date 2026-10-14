import { BriefingForm } from "@/components/briefing-form";

export default function BriefingPage() {
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em]">Novo cliente</p>
        <h1 className="text-4xl tracking-tight">Briefing</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6">A geração usa a cota gratuita. Se ela acabar, o estúdio monta as propostas com os arquétipos do segmento, sem repetir o mesmo desenho.</p>
      </div>
      <BriefingForm />
    </main>
  );
}
