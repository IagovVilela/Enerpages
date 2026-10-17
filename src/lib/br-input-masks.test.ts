import { describe, expect, it } from "vitest";

import {
  formatBrPhoneNational,
  formatCep,
  formatCpfCnpj,
  formatInstagramHandle,
  formatWhatsAppDisplayInput,
} from "./br-input-masks";

describe("br-input-masks", () => {
  it("mascara telefone nacional", () => {
    expect(formatBrPhoneNational("12987002929")).toBe("(12) 98700-2929");
  });

  it("mascara WhatsApp com + internacional", () => {
    expect(formatWhatsAppDisplayInput("+15551540355")).toBe("+15551540355");
  });

  it("mascara CPF e CNPJ", () => {
    expect(formatCpfCnpj("12345678901")).toBe("123.456.789-01");
    expect(formatCpfCnpj("32323232323232")).toBe("32.323.232/3232-32");
  });

  it("mascara CEP e Instagram", () => {
    expect(formatCep("12245700")).toBe("12245-700");
    expect(formatInstagramHandle("sua_marca")).toBe("@sua_marca");
  });
});
