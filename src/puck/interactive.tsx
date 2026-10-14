"use client";

import { LayoutGroup, motion } from "motion/react";
import { useMemo, useState, type FormEvent } from "react";
import { Media, usePage } from "@/puck/theme";
import type { PropsOf } from "@/puck/schema";
import { cn } from "@/lib/cn";

export function GalleryBoard({ variant, images }: { variant: PropsOf<"Gallery">["variant"]; images: PropsOf<"Gallery">["images"] }) {
  const [tag, setTag] = useState("Tudo");
  const tags = useMemo(() => ["Tudo", ...new Set(images.map((image) => image.tag).filter(Boolean))], [images]);
  const visible = tag === "Tudo" ? images : images.filter((image) => image.tag === tag);
  return (
    <>
      {variant === "grid" ? null : (
        <div className="mb-6 flex flex-wrap gap-2">
          {tags.map((item) => (
            <button key={item} type="button" className={cn("rounded-full border px-3 py-1 text-xs uppercase tracking-[0.14em]", item === tag ? "bg-[var(--color-foreground)] text-[var(--color-background)]" : "border-[var(--color-border)]")} onClick={() => setTag(item)}>
              {item}
            </button>
          ))}
        </div>
      )}
      <LayoutGroup>
        <div className={cn(variant === "filmstrip" ? "flex gap-4 overflow-x-auto" : variant === "feature" ? "grid gap-4 md:grid-cols-2" : "columns-2 gap-4 md:columns-3")}>
          {visible.map((image) => (
            <motion.figure layout key={image.caption + image.tag} className={cn("mb-4", variant === "filmstrip" && "min-w-64")}>
              <Media image={image.image} className={cn("min-h-40", variant === "feature" && "first:min-h-80")} />
              <figcaption className="mt-2 text-xs uppercase tracking-[0.14em]">{image.caption}</figcaption>
            </motion.figure>
          ))}
        </div>
      </LayoutGroup>
    </>
  );
}

export function FaqList({ variant, items }: { variant: PropsOf<"Faq">["variant"]; items: PropsOf<"Faq">["items"] }) {
  const [open, setOpen] = useState(0);
  const rows = items.map((item, index) => (
    <div key={item.question} className="border-b border-[var(--color-border)]">
      <button type="button" className="flex w-full items-center justify-between py-4 text-left text-lg" onClick={() => setOpen(index)}>
        {item.question}
        <span>{open === index ? "–" : "+"}</span>
      </button>
      {variant === "plain" || open === index ? <motion.p layout className="pb-4 text-sm leading-6">{item.answer}</motion.p> : null}
    </div>
  ));
  if (variant === "two-column") {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.question}>
            <h3 className="text-xl">{item.question}</h3>
            <p className="mt-2 text-sm leading-6">{item.answer}</p>
          </article>
        ))}
      </div>
    );
  }
  const list = <div>{rows}</div>;
  if (variant === "bordered") return <div className="border border-[var(--color-foreground)] p-4 md:p-8">{list}</div>;
  return list;
}

export function ContactForm({ submitLabel }: { submitLabel: string }) {
  const page = usePage();
  const [status, setStatus] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (page.editing) {
      setStatus("O envio vale na página publicada.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const token = (window as Window & { turnstile?: { getResponse: () => string } }).turnstile?.getResponse?.() || String(form.get("cf-turnstile-response") || "");
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug: page.settings.slug,
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        message: form.get("message"),
        company: form.get("company"),
        token,
      }),
    });
    setStatus(response.ok ? "Mensagem recebida." : "Não foi possível enviar agora.");
    if (response.ok) event.currentTarget.reset();
  }
  return (
    <form id="contato" className="grid gap-3" onSubmit={onSubmit}>
      <input className="border border-[var(--color-border)] bg-transparent px-3 py-3" name="name" placeholder="Nome" required />
      <input className="border border-[var(--color-border)] bg-transparent px-3 py-3" name="email" type="email" placeholder="E-mail" required />
      <input className="border border-[var(--color-border)] bg-transparent px-3 py-3" name="phone" placeholder="Telefone" />
      <textarea className="min-h-32 border border-[var(--color-border)] bg-transparent px-3 py-3" name="message" placeholder="Mensagem" required />
      <input className="hidden" name="company" tabIndex={-1} autoComplete="off" />
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} /> : null}
      <button className="bg-[var(--color-primary)] px-4 py-3 text-[var(--color-background)]" type="submit">{submitLabel}</button>
      {status ? <p className="text-sm">{status}</p> : null}
    </form>
  );
}

export function BeforeAfterBoard(props: Pick<PropsOf<"BeforeAfter">, "variant" | "before" | "after" | "beforeLabel" | "afterLabel">) {
  const [value, setValue] = useState(50);
  const pair = (
    <div className="grid gap-4 md:grid-cols-2">
      <figure><Media image={props.before} className="min-h-72" /><figcaption className="mt-2 text-xs uppercase tracking-[0.14em]">{props.beforeLabel}</figcaption></figure>
      <figure><Media image={props.after} className="min-h-72" /><figcaption className="mt-2 text-xs uppercase tracking-[0.14em]">{props.afterLabel}</figcaption></figure>
    </div>
  );
  const slider = (
    <div className="relative min-h-80 overflow-hidden">
      <Media image={props.after} className="absolute inset-0 min-h-80" />
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${value}%` }}>
        <Media image={props.before} className="min-h-80 w-screen max-w-none" />
      </div>
      <input className="absolute inset-x-6 bottom-4" type="range" min={0} max={100} value={value} onChange={(event) => setValue(Number(event.target.value))} aria-label="Comparar antes e depois" />
    </div>
  );
  if (props.variant === "slider") return slider;
  if (props.variant === "stacked") return <div className="space-y-4">{pair}</div>;
  if (props.variant === "caption") return <div><p className="mb-4 max-w-xl">{props.beforeLabel} / {props.afterLabel}</p>{pair}</div>;
  return pair;
}

export function WhatsAppAnchor({ label, phone, message }: { label: string; phone: string; message: string }) {
  const page = usePage();
  const resolvedPhone = phone || page.settings.whatsapp.phone;
  const resolvedMessage = message || page.settings.whatsapp.message;
  const href = `https://wa.me/${resolvedPhone.replace(/\D/g, "")}?text=${encodeURIComponent(resolvedMessage)}`;
  return (
    <a className="inline-flex rounded-full bg-[#143328] px-5 py-3 text-sm text-[#f4f1ea]" href={resolvedPhone ? href : "#contato"}>
      {label || "WhatsApp"}
    </a>
  );
}
