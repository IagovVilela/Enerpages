/** Converte endereço ou URL do Google Maps em src seguro para iframe (output=embed). */

export function mapsEmbedFromAddress(address: string) {
  const q = address.trim();
  if (!q) return "";
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&hl=pt-BR&z=15&output=embed`;
}

/**
 * Aceita URL de embed, link de compartilhamento do Maps, ou rejeita páginas
 * como www.google.com (que geram ERR_BLOCKED_BY_RESPONSE no iframe).
 */
export function toMapEmbedSrc(embedUrl: string, address = "") {
  const url = embedUrl.trim();
  if (url) {
    const converted = convertMapsUrl(url);
    if (converted) return converted;
  }
  return mapsEmbedFromAddress(address);
}

function convertMapsUrl(raw: string): string {
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host.includes("openstreetmap.org")) return raw;

    const isGoogle = host === "google.com" || host.endsWith(".google.com") || host.startsWith("maps.google");
    if (!isGoogle) return "";

    if (parsed.pathname.includes("/maps/embed")) return raw;
    if (parsed.searchParams.get("output") === "embed" && parsed.pathname.includes("/maps")) return raw;

    const onMaps =
      parsed.pathname.includes("/maps") || host.startsWith("maps.google") || host === "goo.gl" || host.endsWith("goo.gl");

    if (!onMaps) {
      // www.google.com, google.com/search, etc. — não embutir
      return "";
    }

    const q = parsed.searchParams.get("q") || parsed.searchParams.get("query");
    if (q) return mapsEmbedFromAddress(q);

    const place = parsed.pathname.match(/\/maps\/place\/([^/]+)/);
    if (place?.[1]) {
      return mapsEmbedFromAddress(decodeURIComponent(place[1].replace(/\+/g, " ")));
    }

    const at = raw.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (at) return mapsEmbedFromAddress(`${at[1]},${at[2]}`);

    parsed.searchParams.set("output", "embed");
    if (!parsed.searchParams.has("hl")) parsed.searchParams.set("hl", "pt-BR");
    return parsed.toString();
  } catch {
    return "";
  }
}

/** URL de página (não mídia) — evita colar google.com no campo de imagem. */
export function isLikelyPageUrl(src: string) {
  try {
    const parsed = new URL(src);
    if (src.startsWith("data:") || src.startsWith("blob:")) return false;
    if (/\.(jpe?g|png|gif|webp|avif|svg|mp4|webm)(\?|$)/i.test(parsed.pathname)) return false;
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "google.com" || host === "google.com.br") return true;
    if ((host === "google.com" || host.endsWith(".google.com")) && !/\.(jpe?g|png|gif|webp)/i.test(parsed.pathname)) {
      if (parsed.pathname === "/" || parsed.pathname === "" || parsed.pathname.startsWith("/search")) return true;
    }
    return false;
  } catch {
    return false;
  }
}
