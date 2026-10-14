import { prisma } from "../src/lib/db";
import { generateDeterministic } from "../src/lib/ai/fallback";
import { hashPassword } from "../src/lib/password";
import { pageDataSchema, type Briefing } from "../src/puck/schema";

const samples: Briefing[] = [
  {
    clientName: "Atelier Luna",
    segment: "moda",
    audience: "quem procura peça com corte e tecido",
    tone: "editorial",
    differentials: "modelagem próxima e tecido escolhido à mão",
    services: "Alfaiataria, Vestidos, Ajustes",
    colors: "#8f3d2b",
    references: "",
    goal: "vender",
    slug: "atelier-luna",
  },
  {
    clientName: "Marina Coelho",
    segment: "advocacia",
    audience: "pessoas e empresas que precisam de orientação",
    tone: "claro e sóbrio",
    differentials: "explicação direta, sem juridiquês",
    services: "Consultoria jurídica, Contratos, Atendimento inicial",
    colors: "",
    references: "",
    goal: "captar",
    slug: "marina-coelho",
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 10) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD com pelo menos 10 caracteres.");
  }

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, name: "Admin", passwordHash: await hashPassword(password) },
  });

  for (const briefing of samples) {
    const data = pageDataSchema.parse(generateDeterministic(briefing, 0));
    await prisma.page.upsert({
      where: { slug: briefing.slug },
      update: {},
      create: {
        slug: briefing.slug,
        clientName: briefing.clientName,
        segment: briefing.segment,
        status: "PUBLISHED",
        draftData: data,
        publishedData: data,
        publishedAt: new Date(),
        seoTitle: data.root.props.seo.title,
        seoDescription: data.root.props.seo.description,
        archetype: briefing.segment,
        versions: { create: { version: 1, data, source: "MANUAL", label: "Página inicial" } },
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
