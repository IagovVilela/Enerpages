import { expect, test } from "@playwright/test";

const email = process.env.ADMIN_EMAIL || "";
const password = process.env.ADMIN_PASSWORD || "";

test("admin entra, edita e a landing pública abre no subdomínio", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
  await page.getByRole("link", { name: "Editar" }).first().click();
  await expect(page.getByText("Publicar").first()).toBeVisible();

  const site = await page.request.get("http://atelier-luna.localhost:3000");
  expect(site.ok()).toBeTruthy();
  const html = await site.text();
  expect(html).toContain("Atelier Luna");
});
