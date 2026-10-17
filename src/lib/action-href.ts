/** Resolve CTA / botão href: externos abrem em nova aba; vazio usa WhatsApp do tema se houver. */

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function whatsappHref(phone: string, message = "") {
  const digits = digitsOnly(phone);
  if (!digits) return "";
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function resolveActionHref(
  href: string | undefined,
  options?: { phone?: string; message?: string },
) {
  const raw = (href || "").trim();
  if (!raw || raw === "#") {
    const wa = options?.phone ? whatsappHref(options.phone, options.message || "") : "";
    return wa || "#";
  }
  return raw;
}

export function isExternalHref(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href) || href.startsWith("//");
}
