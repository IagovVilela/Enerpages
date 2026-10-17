/**
 * Máscaras progressivas pt-BR para inputs (sem lib externa).
 * Referência de comportamento: Ze do Corte (somente leitura).
 */

import {
  brPhoneDigits,
  formatBrPhoneNational,
  normalizeBrProfilePhone,
} from "@/lib/br-phone-format";

export { brPhoneDigits, formatBrPhoneNational, normalizeBrProfilePhone };

/** Só dígitos, opcionalmente limitados. */
export function onlyDigits(value: string, maxLen?: number): string {
  const d = value.replace(/\D/g, "");
  return maxLen != null ? d.slice(0, maxLen) : d;
}

/**
 * Campo WhatsApp / telefone com DDI:
 * - começa com `+` → internacional (`+15551540355`)
 * - senão → máscara BR `(DD) …`
 */
export function formatWhatsAppDisplayInput(value: string): string {
  const raw = value.trimStart();
  if (raw.startsWith("+")) {
    const digits = raw.replace(/\D/g, "").slice(0, 15);
    return digits.length > 0 ? `+${digits}` : "+";
  }
  return formatBrPhoneNational(value);
}

/** CPF `000.000.000-00` ou CNPJ `00.000.000/0000-00` conforme o tamanho. */
export function formatCpfCnpj(value: string): string {
  const d = onlyDigits(value, 14);
  if (d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) {
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    }
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function cpfCnpjDigits(value: string): string {
  return onlyDigits(value, 14);
}

/** CEP `00000-000`. */
export function formatCep(value: string): string {
  const d = onlyDigits(value, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Handle Instagram: garante `@` e remove espaços. */
export function formatInstagramHandle(value: string): string {
  const raw = value.trim().replace(/\s+/g, "");
  if (!raw) return "";
  const withoutAt = raw.replace(/^@+/, "");
  if (!withoutAt) return "@";
  return `@${withoutAt.slice(0, 30)}`;
}
