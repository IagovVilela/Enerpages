const RESERVED = new Set([
  "www",
  "studio",
  "app",
  "api",
  "admin",
  "preview",
  "login",
  "site",
  "mail",
  "ftp",
]);

export function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export function slugError(slug: string) {
  if (!slug) return "Informe um subdomínio.";
  if (slug.length < 2) return "O subdomínio precisa de pelo menos 2 caracteres.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Use apenas letras minúsculas, números e hífen.";
  }
  if (RESERVED.has(slug)) return "Esse subdomínio é reservado.";
  return null;
}

export function isValidSlug(slug: string) {
  return slugError(slug) === null;
}
