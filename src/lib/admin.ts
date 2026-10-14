import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function requireAdmin() {
  await connection();
  const session = await auth();
  if (!session?.user?.id || !session.sessionToken) redirect("/login");
  const row = await prisma.session.findUnique({ where: { sessionToken: session.sessionToken } });
  if (!row || row.expires < new Date() || row.userId !== session.user.id) redirect("/login");
  return prisma.adminUser.findUniqueOrThrow({ where: { id: session.user.id } });
}
