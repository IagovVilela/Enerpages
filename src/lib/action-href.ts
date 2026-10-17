/** Resolve CTA / botão href: externos abrem em nova aba; vazio usa WhatsApp do tema se houver. */

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** Monta wa.me: BR nacional (10–11 dígitos) recebe DDI 55; `+` internacional mantém os dígitos. */
export function whatsappHref(phone: string, message = "") {
  const trimmed = phone.trim();
  let digits = digitsOnly(trimmed);
  if (!digits) return "";

  if (!trimmed.startsWith("+")) {
    if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith("55")) {
      digits = `55${digits}`;
    }
  }

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
