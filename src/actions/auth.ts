"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function authenticate(_state: { error: string }, formData: FormData) {
  try {
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      code: formData.get("code") || "",
      redirect: false,
    });
    if (result && typeof result === "object" && "error" in result && result.error) {
      const code = "code" in result ? String(result.code) : "";
      return { error: code === "totp_required" ? "Informe o código do autenticador." : "E-mail ou senha inválidos." };
    }
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { error: error.code === "totp_required" ? "Informe o código do autenticador." : "E-mail ou senha inválidos." };
    }
    if (error instanceof AuthError) return { error: "E-mail ou senha inválidos." };
    throw error;
  }
  redirect("/");
}

export async function logout() {
  const user = await requireAdmin();
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await signOut({ redirectTo: "/login" });
}
