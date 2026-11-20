import { getSegmentCopy } from "@/lib/ai/segment-copy";
import { TEMPLATE_SEGMENT } from "@/lib/ai/segment-roster";
import { PAGE_TEMPLATE_META } from "@/puck/page-templates";
import type { Block } from "@/puck/schema";
import type { PageTemplateId } from "@/puck/page-templates-ids";

type Link = { label: string; href: string };
type Feature = { title: string; description: string };
type CatalogItem = Feature & { price: string; group?: string; place?: string; kind?: string; band?: string };
type Stat = { value: string; label: string };

type ModelSeed = {
  nav?: { links: Link[]; cta: Link };
  hero?: { eyebrow: string; title: string; subtitle: string };
  about?: { eyebrow: string; title: string; body: string; points?: Feature[] };
  footer?: { note: string };
  services?: { eyebrow: string; title: string; items: Feature[] };
  catalog?: { eyebrow: string; title: string; items: CatalogItem[] };
  stats?: { title: string; items: Stat[] };
  process?: { title: string; items: Feature[] };
  contact?: { title: string; subtitle: string };
  cta?: { eyebrow: string; title: string; subtitle: string };
  booking?: { title: string; subtitle: string; label: string };
  pricing?: { title: string; plans: Array<{ name: string; price: string; description: string; features: string }> };
  gallery?: { title: string };
  team?: { title: string };
  timeline?: { title: string };
  map?: { title: string };
  beforeAfter?: { title: string; beforeLabel: string; afterLabel: string };
};

function fill(value: string, name: string) {
  return value.replaceAll("{nome}", name).replaceAll("{name}", name);
}

/** Seed leve para qualquer modelo do catálogo que ainda não tem ficha artesanal. */
function seedFromCatalog(templateId: PageTemplateId): ModelSeed {
  const meta = PAGE_TEMPLATE_META.find((item) => item.id === templateId);
  const segment = TEMPLATE_SEGMENT[templateId] ?? "local";
  const bank = getSegmentCopy(segment);
  const process = bank.processRecipes[0] ?? [
    { title: "Conversa", description: "Entender o pedido." },
    { title: "Proposta", description: "Escopo por escrito." },
    { title: "Entrega", description: "O combinado." },
  ];
  return {
    nav: {
      links: [
        { label: "Sobre", href: "#about" },
        { label: "Serviços", href: "#services" },
        { label: "Contato", href: "#contato" },
      ],
      cta: { label: bank.ctaTitles[0] ?? "Falar conosco", href: "#contato" },
    },
    hero: {
      eyebrow: bank.eyebrows[0] ?? meta?.vibe ?? "Apresentação",
      title: bank.headlines[0] ?? "{nome}",
      subtitle: meta?.tagline ?? bank.taglines[0] ?? bank.aboutBodies[0] ?? "",
    },
    about: {
      eyebrow: "Sobre",
      title: meta?.label ? `${meta.label} · {nome}` : "O jeito {nome}",
      body: bank.aboutBodies[0] ?? meta?.tagline ?? "",
      points: bank.differentials.slice(0, 3).map((title, index) => ({
        title,
        description: bank.serviceBlurbs[index] ?? bank.taglines[0] ?? "",
      })),
    },
    services: {
      eyebrow: "Serviços",
      title: "O que oferecemos",
      items: (bank.serviceBlurbs.length ? bank.serviceBlurbs : ["Serviço um", "Serviço dois", "Serviço três"]).map(
        (description, index) => ({
          title: `Oferta ${index + 1}`,
          description,
        }),
      ),
    },
    process: {
      title: "Como acontece",
      items: process.map((step) => ({ title: step.title, description: step.description })),
    },
    contact: {
      title: "Contato",
      subtitle: bank.taglines[1] ?? bank.taglines[0] ?? meta?.tagline ?? "",
    },
    cta: {
      eyebrow: "{nome}",
      title: bank.ctaTitles[0] ?? "Vamos conversar",
      subtitle: bank.differentials.slice(0, 2).join(" · ") || meta?.tagline || "",
    },
    booking: {
      title: "Agenda",
      subtitle: "Abra o link de agendamento que você já usa.",
      label: bank.ctaTitles[1] ?? bank.ctaTitles[0] ?? "Agendar",
    },
    gallery: { title: "Referências" },
    team: { title: "Pessoas" },
    map: { title: "Onde estamos" },
    footer: { note: meta?.tagline ?? bank.taglines[0] ?? "" },
  };
}

const SEEDS: Partial<Record<PageTemplateId, ModelSeed>> = {
  vertice: {
    nav: {
      links: [
        { label: "Imóveis", href: "#catalog" },
        { label: "A casa", href: "#about" },
        { label: "Bairros", href: "#services" },
        { label: "Contato", href: "#contato" },
      ],
      cta: { label: "Falar com a gente", href: "#contato" },
    },
    hero: {
      eyebrow: "Seleção própria",
      title: "Lugares escolhidos\n*um a um.*",
      subtitle: "Casas e apartamentos apresentados com calma, para quem quer decidir sem pressa e sem vitrine genérica.",
    },
    stats: {
      title: "Como atendemos",
      items: [
        { value: "01", label: "Um especialista do primeiro contato à escritura" },
        { value: "02", label: "Visitas combinadas, inclusive fora do horário" },
        { value: "03", label: "Sigilo em conversas que ainda não são anúncio" },
      ],
    },
    catalog: {
      eyebrow: "Seleção",
      title: "Imóveis em destaque",
      items: [
        { title: "Casa com jardim", description: "5 suítes · substitua a metragem", price: "Sob consulta", group: "Comprar", place: "Jardins", kind: "Casa", band: "Acima de 6 mi" },
        { title: "Apartamento alto", description: "3 suítes · vista a confirmar", price: "Sob consulta", group: "Comprar", place: "Itaim", kind: "Apartamento", band: "3 a 6 mi" },
        { title: "Cobertura", description: "4 suítes · vagas a publicar", price: "Sob consulta", group: "Comprar", place: "Moema", kind: "Cobertura", band: "Acima de 6 mi" },
        { title: "Apartamento para locação", description: "2 suítes · contrato a redigir", price: "Sob consulta", group: "Alugar", place: "Pinheiros", kind: "Apartamento", band: "Até 3 mi" },
        { title: "Casa em condomínio", description: "4 suítes · lazer no terreno", price: "Sob consulta", group: "Alugar", place: "Alphaville", kind: "Casa", band: "3 a 6 mi" },
        { title: "Lançamento na planta", description: "Entrega a confirmar com a incorporadora", price: "Sob consulta", group: "Lançamentos", place: "Itaim", kind: "Apartamento", band: "3 a 6 mi" },
      ],
    },
    about: {
      eyebrow: "{nome}",
      title: "Curadoria, não um mural de anúncios.",
      body: "Cada endereço entra na seleção depois de uma visita. Mostramos poucas opções, e as que combinam com o que você descreveu.",
      points: [
        { title: "Um especialista", description: "A mesma pessoa do primeiro contato à escritura." },
        { title: "Visita combinada", description: "Inclusive fora do horário comercial, quando fizer sentido." },
        { title: "Conversa reservada", description: "Endereços que ainda não estão em anúncio ficam entre nós." },
      ],
    },
    footer: { note: "Seleção de endereços, com ficha real no lugar de cada exemplo." },
    services: {
      eyebrow: "Onde atuamos",
      title: "Bairros que conhecemos de perto",
      items: [
        { title: "Centro e arredores", description: "Ruas, prédios e o que muda de uma quadra para outra." },
        { title: "Zona residencial", description: "Casas, condomínios e a rotina de quem mora ali." },
        { title: "Novos endereços", description: "Lançamentos só quando a documentação está clara." },
      ],
    },
    contact: {
      title: "Vamos achar o próximo endereço.",
      subtitle: "Conte o que você procura ou o imóvel que quer apresentar. Retornamos no horário comercial.",
    },
  },
  ferraz: {
    nav: {
      links: [
        { label: "Atuação", href: "#services" },
        { label: "O escritório", href: "#about" },
        { label: "Equipe", href: "#team" },
        { label: "Contato", href: "#contato" },
      ],
      cta: { label: "Falar com o escritório", href: "#contato" },
    },
    hero: {
      eyebrow: "Advocacia",
      title: "Clareza jurídica,\n*sem atalho.*",
      subtitle: "Apresentação sóbria das áreas de atuação. O conteúdo é informativo e não promete desfecho.",
    },
    services: {
      eyebrow: "Atuação",
      title: "Áreas em que o escritório trabalha",
      items: [
        { title: "Consultivo", description: "Leitura de contratos e orientação antes de uma decisão." },
        { title: "Contencioso", description: "Acompanhamento de casos, com linguagem acessível." },
        { title: "Família e patrimônio", description: "Atendimento reservado, no ritmo de cada família." },
      ],
    },
    about: {
      eyebrow: "O escritório",
      title: "Três pilares: estudo, ética e proximidade.",
      body: "{nome} apresenta o time, o modo de trabalhar e o limite do que uma página jurídica pode afirmar.",
    },
    process: {
      title: "Como conduzimos um caso",
      items: [
        { title: "Escuta", description: "Entendemos o contexto antes de sugerir um caminho." },
        { title: "Estratégia", description: "Explicamos opções, prazos e o que depende de terceiros." },
        { title: "Acompanhamento", description: "Você sabe em que etapa o assunto está." },
      ],
    },
    team: { title: "Quem está ao lado" },
    timeline: { title: "Notas e artigos" },
    contact: {
      title: "Uma conversa reservada é o primeiro passo.",
      subtitle: "Escreva o assunto em linhas gerais. O retorno é do escritório, não de um formulário automático.",
    },
  },
  essenza: {
    nav: {
      links: [
        { label: "Tratamentos", href: "#services" },
        { label: "A clínica", href: "#about" },
        { label: "Equipe", href: "#team" },
        { label: "Agenda", href: "#booking" },
      ],
      cta: { label: "Agendar", href: "#booking" },
    },
    hero: {
      eyebrow: "Clínica",
      title: "Tempo de escuta\n*para cuidar.*",
      subtitle: "Informação de serviço, horários e especialidades. Sem promessa de resultado clínico.",
    },
    stats: {
      title: "Na recepção",
      items: [
        { value: "Agenda", label: "Horários publicados e confirmação humana" },
        { value: "Equipe", label: "Especialidades apresentadas com nome real" },
        { value: "Local", label: "Endereço, convênios e como chegar" },
      ],
    },
    services: {
      eyebrow: "Cuidado",
      title: "Especialidades em um só endereço",
      items: [
        { title: "Avaliação", description: "Primeira conversa para entender o que você precisa." },
        { title: "Acompanhamento", description: "Retornos combinados com a equipe responsável." },
        { title: "Orientação", description: "Explicação clara do que o procedimento envolve." },
      ],
    },
    about: {
      eyebrow: "O espaço",
      title: "Um lugar para você se sentir à vontade.",
      body: "{nome} reúne especialidades no mesmo endereço, com horário visível e um canal direto para a recepção.",
    },
    team: { title: "Quem cuida de você" },
    booking: {
      title: "Sua consulta em poucos cliques",
      subtitle: "O botão abre a agenda que a clínica já usa. Este site não marca o horário sozinho.",
      label: "Ver horários",
    },
    contact: {
      title: "Estamos esperando por você.",
      subtitle: "Se preferir, deixe nome e telefone. A recepção retorna no horário de atendimento.",
    },
  },
  lenha: {
    nav: {
      links: [
        { label: "Carta", href: "#catalog" },
        { label: "Casa", href: "#gallery" },
        { label: "Reserva", href: "#booking" },
        { label: "Endereço", href: "#map" },
      ],
      cta: { label: "Reservar mesa", href: "#booking" },
    },
    hero: {
      eyebrow: "Cozinha de fogo",
      title: "Brasa, mesa\ne *uma noite longa.*",
      subtitle: "Carta curta, sala pequena e reserva para quem quer sentar sem fila na porta.",
    },
    catalog: {
      eyebrow: "Carta",
      title: "Da brasa para a mesa",
      items: [
        { title: "Entrada de fogo", description: "Substitua pelo prato e pelo preço reais", price: "Sob consulta", group: "Jantar", place: "Sala", kind: "Entrada", band: "Até 80" },
        { title: "Corte do dia", description: "Ponto e acompanhamento a publicar", price: "Sob consulta", group: "Jantar", place: "Sala", kind: "Principal", band: "80 a 160" },
        { title: "Doce de encerrar", description: "Sobremesa da casa", price: "Sob consulta", group: "Jantar", place: "Sala", kind: "Doce", band: "Até 80" },
        { title: "Almoço de brasa", description: "Servido até o meio da tarde", price: "Sob consulta", group: "Almoço", place: "Varanda", kind: "Principal", band: "80 a 160" },
        { title: "Salada do meio-dia", description: "Entrada leve para o almoço", price: "Sob consulta", group: "Almoço", place: "Varanda", kind: "Entrada", band: "Até 80" },
        { title: "Mesa fechada", description: "Menu combinado para o grupo", price: "Sob consulta", group: "Evento", place: "Sala reservada", kind: "Principal", band: "Acima de 160" },
      ],
    },
    gallery: { title: "A sala" },
    booking: {
      title: "Guarde o seu lugar à mesa",
      subtitle: "Diga o dia, o horário e quantas pessoas. Confirmamos por mensagem.",
      label: "Pedir reserva",
    },
    map: { title: "Onde acendemos o fogo" },
    contact: {
      title: "Veio de última hora?",
      subtitle: "Escreva mesmo assim. Se a casa estiver cheia, sugerimos outro horário.",
    },
  },
  linea: {
    nav: {
      links: [
        { label: "Estúdio", href: "#about" },
        { label: "Obras", href: "#gallery" },
        { label: "Método", href: "#process" },
        { label: "Contato", href: "#contato" },
      ],
      cta: { label: "Começar um projeto", href: "#contato" },
    },
    hero: {
      eyebrow: "Arquitetura",
      title: "Do risco no papel\n*à chave na mão.*",
      subtitle: "Projeto, obra e o que fica no meio. O comparador mostra intenção e entrega, lado a lado.",
    },
    about: {
      eyebrow: "Estúdio",
      title: "Uma equipe só, do terreno à entrega.",
      body: "{nome} desenha, acompanha a obra e entrega o espaço como foi combinado — sem sumir no meio do caminho.",
    },
    gallery: { title: "Obras" },
    beforeAfter: { title: "O que foi desenhado e o que foi entregue", beforeLabel: "Projeto", afterLabel: "Obra" },
    services: {
      eyebrow: "Escopo",
      title: "Do estudo à chave",
      items: [
        { title: "Estudo", description: "Leitura do terreno, do uso e do orçamento possível." },
        { title: "Projeto", description: "Plantas, materiais e a decisão que fica registrada." },
        { title: "Obra", description: "Acompanhamento até a entrega do espaço." },
      ],
    },
    process: {
      title: "Cinco passos, sem improviso escondido",
      items: [
        { title: "Visita", description: "O lugar manda mais do que o moodboard." },
        { title: "Partido", description: "Uma ideia central, explicada em poucas linhas." },
        { title: "Detalhe", description: "Material, luz e o que a mão vai tocar." },
        { title: "Obra", description: "Presença no canteiro, não só no grupo de mensagens." },
        { title: "Entrega", description: "O espaço como foi desenhado, com manual de uso." },
      ],
    },
    contact: {
      title: "Vamos desenhar o próximo espaço?",
      subtitle: "Conte o terreno, o uso e o prazo. Respondemos com o que cabe e o que não cabe.",
    },
  },
  alisio: {
    nav: {
      links: [
        { label: "Suítes", href: "#catalog" },
        { label: "A casa", href: "#about" },
        { label: "Fotos", href: "#gallery" },
        { label: "Como chegar", href: "#map" },
      ],
      cta: { label: "Ver datas", href: "#catalog" },
    },
    hero: {
      eyebrow: "Pousada",
      title: "Dias inteiros\n*fora do relógio.*",
      subtitle: "Poucas suítes, café longo e um mapa para quem chega de carro.",
    },
    about: {
      eyebrow: "A casa",
      title: "Um refúgio com nome e dono.",
      body: "{nome} recebe poucos hóspedes de cada vez. A estadia é combinada por mensagem, com as datas que ainda estão livres.",
    },
    catalog: {
      eyebrow: "Suítes",
      title: "Escolha o quarto",
      items: [
        { title: "Suíte jardim", description: "Cama, varanda e silêncio. Foto a enviar.", price: "Diária sob consulta", group: "Suíte", place: "Térreo", kind: "Jardim", band: "2 hóspedes" },
        { title: "Suíte do alto", description: "Vista e banheira. Lotação a confirmar.", price: "Diária sob consulta", group: "Suíte", place: "Superior", kind: "Vista", band: "2 hóspedes" },
        { title: "Cabana", description: "Para quem quer ficar mais recolhido.", price: "Diária sob consulta", group: "Cabana", place: "Fundo", kind: "Jardim", band: "4 hóspedes" },
        { title: "Quarto casal", description: "Cama de casal e janela para o pátio.", price: "Diária sob consulta", group: "Suíte", place: "Térreo", kind: "Casal", band: "2 hóspedes" },
      ],
    },
    gallery: { title: "Um pouco da casa" },
    map: { title: "Longe de tudo, perto do caminho" },
    contact: {
      title: "Diga as datas.",
      subtitle: "Chegada, saída e quantos hóspedes. Respondemos se a casa comporta.",
    },
  },
  navalha: {
    nav: {
      links: [
        { label: "Serviços", href: "#services" },
        { label: "A casa", href: "#about" },
        { label: "Barbeiros", href: "#team" },
        { label: "Agenda", href: "#booking" },
      ],
      cta: { label: "Reservar cadeira", href: "#booking" },
    },
    hero: {
      eyebrow: "Barbearia",
      title: "Cadeira marcada.\n*Barba no ponto.*",
      subtitle: "Corte, barba e um clube para quem volta toda semana. O valor real entra no lugar de “sob consulta”.",
    },
    services: {
      eyebrow: "Serviços",
      title: "O que acontece na cadeira",
      items: [
        { title: "Corte", description: "Sob consulta — publique o valor praticado." },
        { title: "Barba", description: "Toalha quente e navalha. Valor a publicar." },
        { title: "Combo", description: "Corte e barba no mesmo horário." },
      ],
    },
    about: {
      eyebrow: "A casa",
      title: "Mais que um corte, um ritual.",
      body: "{nome} marca horário por barbeiro. Você chega, senta e sai sem pegar senha na porta.",
    },
    team: { title: "Quem segura a navalha" },
    booking: {
      title: "Reserve a sua cadeira",
      subtitle: "Escolha o barbeiro e o horário na ferramenta que a casa já usa.",
      label: "Ver agenda",
    },
    pricing: {
      title: "Clube da casa",
      plans: [
        { name: "Avulso", price: "Sob consulta", description: "Quando der vontade.", features: "Corte\nBarba\nSem fidelidade" },
        { name: "Mensal", price: "Sob consulta", description: "Para quem volta no mesmo ritmo.", features: "Horário preferencial\nUm corte no mês\nBarba inclusa" },
        { name: "Casa", price: "Sob consulta", description: "O plano mais frequente.", features: "Dois cortes\nBarba\nProduto de uso na cadeira" },
      ],
    },
    gallery: { title: "A cadeira" },
  },
  pulso: {
    nav: {
      links: [
        { label: "Modalidades", href: "#services" },
        { label: "Semana", href: "#process" },
        { label: "Planos", href: "#pricing" },
        { label: "Aula experimental", href: "#cta" },
      ],
      cta: { label: "Primeira aula", href: "#cta" },
    },
    hero: {
      eyebrow: "Estúdio de treino",
      title: "A semana de treino\n*começa aqui.*",
      subtitle: "Modalidades, grade e planos. A primeira aula é um convite, não uma promessa de resultado.",
    },
    services: {
      eyebrow: "Modalidades",
      title: "Formas de treinar na mesma sala",
      items: [
        { title: "Força", description: "Treino guiado, com progressão explicada." },
        { title: "Condicionamento", description: "Aulas curtas, em grupo pequeno." },
        { title: "Mobilidade", description: "Para quem quer chegar inteiro no treino seguinte." },
      ],
    },
    process: {
      title: "Monte a semana",
      items: [
        { title: "Segunda", description: "Força. Substitua pelo horário real." },
        { title: "Quarta", description: "Condicionamento." },
        { title: "Sexta", description: "Mobilidade ou o treino que a casa preferir." },
      ],
    },
    stats: {
      title: "A sala",
      items: [
        { value: "Grupo", label: "Turmas pequenas, com nome na chamada" },
        { value: "Grade", label: "Horários publicados, sem surpresa na porta" },
        { value: "Plano", label: "Você escolhe o ritmo, não um pacote opaco" },
      ],
    },
    team: { title: "Quem treina com você" },
    pricing: {
      title: "Escolha o ritmo",
      plans: [
        { name: "Experimental", price: "Convite", description: "Uma aula para conhecer a sala.", features: "Aula guiada\nSem anuidade\nSem letra miúda" },
        { name: "Recorrente", price: "Sob consulta", description: "Para quem já sabe o horário.", features: "Grade da semana\nAcompanhamento\nPlano mensal" },
        { name: "Livre", price: "Sob consulta", description: "Mais dias na casa.", features: "Todas as modalidades\nHorários extras\nA combinar" },
      ],
    },
    cta: {
      eyebrow: "{nome}",
      title: "A primeira aula é por nossa conta.",
      subtitle: "Venha treinar um dia. Se fizer sentido, a gente fala de plano depois.",
    },
  },
  maison: {
    nav: {
      links: [
        { label: "Vitrine", href: "#catalog" },
        { label: "Encomenda", href: "#process" },
        { label: "A cozinha", href: "#about" },
        { label: "Pedido", href: "#cta" },
      ],
      cta: { label: "Fazer um pedido", href: "#cta" },
    },
    hero: {
      eyebrow: "Confeitaria",
      title: "Camadas, cobertura\ne *a fatia certa.*",
      subtitle: "Vitrine para levar hoje e encomenda para a mesa de domingo. O bolo montado é um roteiro, não um carrinho.",
    },
    catalog: {
      eyebrow: "Vitrine",
      title: "O que sai do forno",
      items: [
        { title: "Fatia do dia", description: "Sabor a publicar com a foto real", price: "Sob consulta" },
        { title: "Bolo inteiro", description: "Encomenda com antecedência", price: "Sob consulta" },
        { title: "Mesa de doces", description: "Para festa, com cardápio fechado", price: "Sob consulta" },
      ],
    },
    process: {
      title: "Do seu jeito, camada por camada",
      items: [
        { title: "Massa", description: "Escolha a base. A casa confirma o que está no forno na semana." },
        { title: "Recheio", description: "Um sabor principal, sem montar um pedido infinito." },
        { title: "Cobertura", description: "O acabamento que a cozinha sabe repetir." },
      ],
    },
    about: {
      eyebrow: "A cozinha",
      title: "Forno pequeno, receita com dono.",
      body: "{nome} assa por encomenda e deixa uma vitrine curta para quem passa na porta. A foto do bolo entra no lugar do espaço vazio.",
    },
    gallery: { title: "Da mesa" },
    cta: {
      eyebrow: "Encomenda",
      title: "Diga a data e o tamanho da mesa.",
      subtitle: "Respondemos com o que dá para assar até lá.",
    },
  },
};

export function applyModelSeed(content: Block[], templateId: string, clientName: string): Block[] {
  const id = templateId as PageTemplateId;
  const seed = SEEDS[id] ?? seedFromCatalog(id);
  const name = clientName.trim() || "Sua marca";
  return content.map((block) => {
    if (block.type === "Navbar" && seed.nav) {
      return { ...block, props: { ...block.props, links: seed.nav.links, cta: seed.nav.cta } };
    }
    if (block.type === "Hero" && seed.hero) {
      return {
        ...block,
        props: {
          ...block.props,
          eyebrow: fill(seed.hero.eyebrow, name),
          title: fill(seed.hero.title, name),
          subtitle: fill(seed.hero.subtitle, name),
        },
      };
    }
    if (block.type === "About" && seed.about) {
      return {
        ...block,
        props: {
          ...block.props,
          eyebrow: fill(seed.about.eyebrow, name),
          title: fill(seed.about.title, name),
          body: fill(seed.about.body, name),
          points: seed.about.points
            ? seed.about.points.map((item) => ({
                title: fill(item.title, name),
                description: fill(item.description, name),
              }))
            : [],
        },
      };
    }
    if (block.type === "Services" && seed.services) {
      return {
        ...block,
        props: {
          ...block.props,
          eyebrow: fill(seed.services.eyebrow, name),
          title: fill(seed.services.title, name),
          items: seed.services.items.map((item) => ({
            title: fill(item.title, name),
            description: fill(item.description, name),
          })),
        },
      };
    }
    if (block.type === "Catalog" && seed.catalog) {
      return {
        ...block,
        props: {
          ...block.props,
          eyebrow: fill(seed.catalog.eyebrow, name),
          title: fill(seed.catalog.title, name),
          items: seed.catalog.items.map((item, index) => ({
            title: fill(item.title, name),
            description: fill(item.description, name),
            price: fill(item.price, name),
            group: item.group ?? "",
            place: item.place ?? "",
            kind: item.kind ?? "",
            band: item.band ?? "",
            image: block.props.items[index]?.image ?? { src: "", alt: "", placeholder: true },
          })),
        },
      };
    }
    if (block.type === "Stats" && seed.stats) {
      return {
        ...block,
        props: {
          ...block.props,
          title: fill(seed.stats.title, name),
          items: seed.stats.items,
        },
      };
    }
    if (block.type === "Process" && seed.process) {
      return {
        ...block,
        props: {
          ...block.props,
          title: fill(seed.process.title, name),
          items: seed.process.items.map((item) => ({
            title: fill(item.title, name),
            description: fill(item.description, name),
          })),
        },
      };
    }
    if (block.type === "Contact" && seed.contact) {
      return {
        ...block,
        props: {
          ...block.props,
          title: fill(seed.contact.title, name),
          subtitle: fill(seed.contact.subtitle, name),
        },
      };
    }
    if (block.type === "Cta" && seed.cta) {
      return {
        ...block,
        props: {
          ...block.props,
          eyebrow: fill(seed.cta.eyebrow, name),
          title: fill(seed.cta.title, name),
          subtitle: fill(seed.cta.subtitle, name),
        },
      };
    }
    if (block.type === "Booking" && seed.booking) {
      return {
        ...block,
        props: {
          ...block.props,
          title: fill(seed.booking.title, name),
          subtitle: fill(seed.booking.subtitle, name),
          label: fill(seed.booking.label, name),
        },
      };
    }
    if (block.type === "Pricing" && seed.pricing) {
      return {
        ...block,
        props: {
          ...block.props,
          title: fill(seed.pricing.title, name),
          plans: seed.pricing.plans.map((plan, index) => ({
            name: plan.name,
            price: plan.price,
            description: plan.description,
            features: plan.features,
            cta: block.props.plans[index]?.cta ?? block.props.plans[0]?.cta ?? { label: "Falar", href: "#contato" },
            featured: index === 1,
          })),
        },
      };
    }
    if (block.type === "Gallery" && seed.gallery) {
      return { ...block, props: { ...block.props, title: fill(seed.gallery.title, name) } };
    }
    if (block.type === "Team" && seed.team) {
      return { ...block, props: { ...block.props, title: fill(seed.team.title, name) } };
    }
    if (block.type === "Timeline" && seed.timeline) {
      return { ...block, props: { ...block.props, title: fill(seed.timeline.title, name) } };
    }
    if (block.type === "Map" && seed.map) {
      return { ...block, props: { ...block.props, title: fill(seed.map.title, name) } };
    }
    if (block.type === "Footer") {
      const note = seed.footer?.note ?? seed.hero?.subtitle ?? block.props.note;
      return { ...block, props: { ...block.props, note: fill(note, name) } };
    }
    if (block.type === "BeforeAfter" && seed.beforeAfter) {
      return {
        ...block,
        props: {
          ...block.props,
          title: fill(seed.beforeAfter.title, name),
          beforeLabel: seed.beforeAfter.beforeLabel,
          afterLabel: seed.beforeAfter.afterLabel,
        },
      };
    }
    return block;
  });
}
