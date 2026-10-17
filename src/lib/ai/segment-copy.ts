import type { SEGMENTS } from "@/puck/schema";

type Segment = (typeof SEGMENTS)[number];

export type SegmentCopyBank = {
  /** Frases de diferencial quando o briefing vem vazio. */
  differentials: string[];
  /** Referências de clima visual / mood (não são depoimentos). */
  references: string[];
  /** Títulos de hero; `{name}` = nome do cliente. */
  headlines: string[];
  taglines: string[];
  aboutBodies: string[];
  eyebrows: string[];
  serviceBlurbs: string[];
  processRecipes: Array<Array<{ title: string; description: string }>>;
  faqRecipes: Array<Array<{ question: string; answer: string }>>;
  ctaTitles: string[];
  marqueeExtras: string[];
  galleryTags: string[];
  catalogNotes: string[];
};

const BANKS: Record<Segment, SegmentCopyBank> = {
  moda: {
    differentials: [
      "corte e caimento pensados para o corpo real",
      "cápsula enxuta, sem excesso de estoque",
      "matéria-prima escolhida com critério tátil",
      "produção sob medida e ajustes no ateliê",
      "visual de vitrine com linguagem de revista",
      "peças que atravessam estações sem parecer uniformes",
      "curadoria sazonal com poucas unidades",
      "atendimento de prova sem pressa de loja de shopping",
    ],
    references: [
      "editorial de moda com tipografia serifada e fundo papel",
      "lookbook em grade assimétrica, luz natural",
      "vitrine monócroma com um acento metálico",
      "campanha street com contraste alto e letreiros",
      "catálogo quiet luxury: pouco texto, muito espaço",
    ],
    headlines: [
      "{name}: peças com presença",
      "Vista o que parece feito para você",
      "{name} · corte, matéria e clima",
      "Uma cápsula, várias leituras",
    ],
    taglines: [
      "Roupa com assinatura — da prova ao ajuste final.",
      "Menos volume, mais intenção em cada peça.",
      "Do tecido ao caimento: o detalhe que se sente.",
    ],
    aboutBodies: [
      "{name} trabalha a moda como curadoria: poucas peças, muito critério de caimento e textura.",
      "O ateliê existe para quem quer vestir com intenção — sem o barulho de coleções infinitas.",
      "Cada temporada chega enxuta. O resto é prova, ajuste e conversa sobre o que realmente serve.",
    ],
    eyebrows: ["Cápsula", "Ateliê", "Lookbook", "Nova temporada"],
    serviceBlurbs: [
      "Peça pensada para o seu ritmo, com prova e ajuste.",
      "Seleção curta — o que está em estoque agora.",
      "Conversa de estilo sem pressão de venda rápida.",
    ],
    processRecipes: [
      [
        { title: "Prova", description: "Medidas, preferências e ocasião de uso." },
        { title: "Ajuste", description: "Caimento fino no ateliê ou na loja." },
        { title: "Entrega", description: "Peça pronta, com orientação de cuidado." },
      ],
      [
        { title: "Briefing", description: "Referências e restrições de estilo." },
        { title: "Seleção", description: "Opções reais do estoque ou sob medida." },
        { title: "Finalização", description: "Ajuste e retirada." },
      ],
    ],
    faqRecipes: [
      [
        { question: "Vocês fazem ajuste?", answer: "Sim — o ajuste faz parte do atendimento quando a peça pede." },
        { question: "Tem troca?", answer: "Trocas seguem a política publicada na loja; confirme no atendimento." },
        { question: "Como reservo uma peça?", answer: "Pelo contato do site ou presencialmente, conforme disponibilidade." },
      ],
    ],
    ctaTitles: ["Agende uma prova", "Ver a cápsula", "Falar com o ateliê"],
    marqueeExtras: ["corte", "caimento", "tecido", "temporada", "prova"],
    galleryTags: ["Vitrine", "Detalhe", "Look", "Tecido"],
    catalogNotes: ["Sob consulta", "Sob medida", "Últimas unidades"],
  },
  portfolio: {
    differentials: [
      "direção visual com método, não só estética",
      "processo transparente do briefing à entrega",
      "portfólio selecionado — qualidade acima de volume",
      "linguagem própria sem copiar tendência da semana",
      "acolhimento de marcas e profissionais em crescimento",
      "entrega com arquivos organizados e critérios claros",
      "colaboração próxima, poucas contas por vez",
      "foco em sistemas visuais que duram além da campanha",
    ],
    references: [
      "site de estúdio com tipografia display e grid quebrado",
      "portfólio em scroll editorial, pouco UI chrome",
      "capa de revista com foto full-bleed e crédito fino",
      "case study em duas colunas: problema / solução",
      "moodboard monocromático com um acento de cor",
    ],
    headlines: [
      "{name} · direção e identidade",
      "Trabalho visual com método",
      "Projetos que carregam assinatura",
      "{name}: do conceito à forma",
    ],
    taglines: [
      "Design e direção para quem precisa de uma voz visual própria.",
      "Menos peças genéricas. Mais sistemas que conversam entre si.",
      "Briefing claro, execução cuidadosa, entrega organizada.",
    ],
    aboutBodies: [
      "{name} desenvolve identidades e peças editoriais com processo legível — do diagnóstico à entrega.",
      "O estúdio prioriza poucas frentes por vez, para manter consistência e atenção ao detalhe.",
      "Cada projeto começa com restrições reais: público, tom e onde a marca precisa aparecer.",
    ],
    eyebrows: ["Estúdio", "Direção", "Identidade", "Cases"],
    serviceBlurbs: [
      "Sistema visual completo ou peça pontual, com escopo definido.",
      "Direção de arte para campanhas e peças digitais.",
      "Editorial e tipografia com hierarquia pensada para leitura.",
    ],
    processRecipes: [
      [
        { title: "Diagnóstico", description: "Contexto, restrições e referências." },
        { title: "Direção", description: "Conceito, tipografia e linguagem." },
        { title: "Entrega", description: "Arquivos, usos e guia rápido." },
      ],
      [
        { title: "Brief", description: "Objetivos e limites do projeto." },
        { title: "Exploração", description: "Caminhos visuais para validar." },
        { title: "Produção", description: "Aplicações e finalização." },
      ],
    ],
    faqRecipes: [
      [
        { question: "Como começamos?", answer: "Por uma conversa de briefing e alinhamento de escopo." },
        { question: "Vocês trabalham remotamente?", answer: "Sim, com reuniões e entregas digitais." },
        { question: "O portfólio é só estúdio?", answer: "Não — inclui projetos reais do cliente; imagens de pessoas são placeholders até você substituir." },
      ],
    ],
    ctaTitles: ["Conversar sobre o projeto", "Ver o método", "Pedir orçamento"],
    marqueeExtras: ["identidade", "editorial", "tipo", "direção", "sistema"],
    galleryTags: ["Identidade", "Editorial", "Digital", "Impresso"],
    catalogNotes: ["Projeto sob consulta", "Pacote sob medida", "Retainer"],
  },
  advocacia: {
    differentials: [
      "linguagem clara, sem jargão desnecessário",
      "atendimento inicial com escuta e triagem responsável",
      "atuação em áreas definidas — sem prometer o impossível",
      "documentação e prazos comunicados com transparência",
      "ética publicitária: informação, não garantia de resultado",
      "canais de contato organizados para o cliente",
      "orientação sobre próximos passos sem pressão indevida",
      "escritório com postura institucional e acolhedora",
    ],
    references: [
      "site jurídico sóbrio: tipografia clássica, muito espaço em branco",
      "layout institucional com azul-petróleo e dourado discreto",
      "páginas de área de atuação em lista limpa, sem sensationalismo",
      "formulário de contato com texto ético e Tom profissional",
      "hero com foto de ambiente (não de 'vitória') e copy sóbria",
    ],
    headlines: [
      "{name}: orientação jurídica com clareza",
      "Informação e acompanhamento responsável",
      "Escritório {name}",
      "Atendimento jurídico com linguagem acessível",
    ],
    taglines: [
      "Esclarecemos dúvidas e próximos passos — sem promessa de resultado.",
      "Atuação ética, com transparência sobre o que o escritório pode oferecer.",
      "Conversa inicial para entender o caso e indicar o caminho adequado.",
    ],
    aboutBodies: [
      "{name} presta orientação jurídica com foco em clareza e responsabilidade profissional.",
      "O escritório comunica áreas de atuação e o fluxo de atendimento, sem garantir desfecho.",
      "Cada caso é analisado individualmente; resultados dependem de fatos, provas e decisões de terceiros.",
    ],
    eyebrows: ["Escritório", "Atendimento", "Áreas", "Contato"],
    serviceBlurbs: [
      "Análise inicial e orientação sobre possíveis caminhos.",
      "Elaboração e revisão de documentos, conforme escopo combinado.",
      "Acompanhamento com atualizações no canal acordado.",
    ],
    processRecipes: [
      [
        { title: "Contato", description: "Você descreve o contexto com documentos disponíveis." },
        { title: "Triagem", description: "Avaliamos se há encaixe e quais informações faltam." },
        { title: "Próximos passos", description: "Combinamos o que é possível fazer — sem promessa de resultado." },
      ],
    ],
    faqRecipes: [
      [
        { question: "Vocês garantem resultado?", answer: "Não. Orientamos com responsabilidade; o desfecho depende de fatores externos ao escritório." },
        { question: "Como é a primeira conversa?", answer: "Uma escuta inicial para entender o caso e indicar se podemos ajudar." },
        { question: "Quais áreas vocês atendem?", answer: "As áreas publicadas nesta página. Se não houver encaixe, indicamos o encaminhamento adequado." },
      ],
    ],
    ctaTitles: ["Solicitar contato", "Agendar conversa inicial", "Enviar mensagem"],
    marqueeExtras: ["ética", "clareza", "orientação", "sigilo", "responsabilidade"],
    galleryTags: ["Escritório", "Atendimento", "Documentos"],
    catalogNotes: ["Honorários sob consulta", "Escopo sob medida"],
  },
  psicologia: {
    differentials: [
      "acolhimento sem promessa de cura ou prazo mágico",
      "escuta ética e sigilo profissional",
      "abordagem clara sobre o que a terapia pode e não pode oferecer",
      "espaço seguro para processos singulares",
      "comunicação transparente sobre frequência e formato",
      "respeito ao ritmo de cada pessoa",
      "linguagem humana, sem sensationalismo de 'transformação garantida'",
      "agenda organizada com confirmação prévia",
    ],
    references: [
      "site clínico acolhedor: tons terrosos, tipografia suave",
      "layout com muito respiro e fotos de ambiente (não rostos inventados)",
      "seção de abordagem com texto ético e sem claims de resultado",
      "CTA de agenda discreto, sem urgência artificial",
      "FAQ sobre primeira sessão e sigilo",
    ],
    headlines: [
      "{name}: espaço de escuta",
      "Acolhimento profissional",
      "Psicoterapia com ética e clareza",
      "Um lugar para conversar com cuidado",
    ],
    taglines: [
      "Cada processo é singular — sem promessa de prazo ou resultado.",
      "Atendimento ético, com informação clara sobre o trabalho clínico.",
      "Primeiro contato para entender se há encaixe terapêutico.",
    ],
    aboutBodies: [
      "{name} oferece psicoterapia com foco em acolhimento e ética profissional.",
      "O trabalho clínico respeita a singularidade de cada pessoa e não promete desfechos.",
      "Informamos formato, frequência e limites do atendimento com transparência.",
    ],
    eyebrows: ["Clínica", "Acolhimento", "Processo", "Agenda"],
    serviceBlurbs: [
      "Sessões individuais, com combinação de frequência.",
      "Primeiro contato para alinhamento de expectativas.",
      "Orientação sobre encaminhamentos quando necessário.",
    ],
    processRecipes: [
      [
        { title: "Contato", description: "Você conta, em linhas gerais, o que busca." },
        { title: "Alinhamento", description: "Conversamos sobre formato, ética e disponibilidade." },
        { title: "Sessões", description: "O acompanhamento segue o ritmo combinado — sem garantia de resultado." },
      ],
    ],
    faqRecipes: [
      [
        { question: "A terapia garante melhora?", answer: "Não. A psicoterapia é um processo; cada pessoa responde de forma diferente." },
        { question: "Como funciona a primeira sessão?", answer: "É um espaço para se conhecer, alinhar expectativas e avaliar o encaixe." },
        { question: "Há sigilo?", answer: "Sim, dentro das normas éticas da profissão e da legislação aplicável." },
      ],
    ],
    ctaTitles: ["Agendar conversa", "Entrar em contato", "Ver disponibilidade"],
    marqueeExtras: ["escuta", "ética", "sigilo", "cuidado", "presença"],
    galleryTags: ["Ambiente", "Sala", "Detalhe"],
    catalogNotes: ["Sob consulta", "Plano sob combinação"],
  },
  clinica: {
    differentials: [
      "informação clara sobre serviços — sem promessa de cura",
      "equipe identificada com funções reais",
      "agendamento organizado e confirmação prévia",
      "ambiente e fluxos pensados para acolhimento",
      "comunicação sobre exames e retornos sem alarme",
      "transparência de horários e canais de contato",
      "orientação ao paciente com linguagem acessível",
      "foco em acompanhamento responsável",
    ],
    references: [
      "site de clínica clean: azul-esverdeado, tipografia legível",
      "cards de serviços com ícones simples e texto curto",
      "mapa e endereço em destaque no rodapé",
      "equipe com placeholders até fotos oficiais",
      "FAQ sobre agendamento e documentos",
    ],
    headlines: [
      "{name}: cuidado com informação clara",
      "Clínica {name}",
      "Atendimento organizado e acolhedor",
      "Serviços de saúde com comunicação responsável",
    ],
    taglines: [
      "Informamos o que oferecemos — sem prometer cura ou resultado.",
      "Agende com clareza de horários e canais oficiais.",
      "Acompanhamento com equipe e fluxos definidos.",
    ],
    aboutBodies: [
      "{name} presta serviços de saúde com comunicação institucional e ética.",
      "Priorizamos informação útil ao paciente: o que fazemos, como agendar e o que levar.",
      "Resultados clínicos dependem de avaliação individual — não há garantia genérica.",
    ],
    eyebrows: ["Clínica", "Serviços", "Equipe", "Agenda"],
    serviceBlurbs: [
      "Avaliação e orientação conforme especialidade.",
      "Acompanhamento com retorno combinado.",
      "Informações sobre preparação e documentos necessários.",
    ],
    processRecipes: [
      [
        { title: "Agendar", description: "Escolha o canal oficial e o horário disponível." },
        { title: "Preparar", description: "Documentos e orientações prévias, se houver." },
        { title: "Atendimento", description: "Consulta ou procedimento conforme a especialidade." },
      ],
    ],
    faqRecipes: [
      [
        { question: "Vocês garantem cura?", answer: "Não. Informamos serviços e orientações; cada caso é individual." },
        { question: "Como agendar?", answer: "Pelos canais publicados nesta página ou pelo telefone da clínica." },
        { question: "O que levar?", answer: "Documento e pedidos anteriores, se existirem. Confirme no agendamento." },
      ],
    ],
    ctaTitles: ["Agendar atendimento", "Falar com a recepção", "Ver localização"],
    marqueeExtras: ["cuidado", "agenda", "orientação", "equipe", "acolhimento"],
    galleryTags: ["Recepção", "Sala", "Equipe"],
    catalogNotes: ["Sob consulta", "Convênios: confirmar"],
  },
  restaurante: {
    differentials: [
      "cozinha com identidade — não cardápio genérico",
      "ingredientes de temporada quando possível",
      "sala com clima próprio e serviço atento",
      "reservas com confirmação clara",
      "carta enxuta, bem executada",
      "experiência de jantar sem pressa artificial",
      "ambiente pensado para presença, não só delivery",
      "harmonização e sugestões do dia",
    ],
    references: [
      "site gastronômico escuro com tipografia display",
      "hero com foto de prato (placeholder até mídia real)",
      "menu em lista editorial, poucas fotos",
      "mapa e WhatsApp para reserva",
      "marquee com ingredientes e clima da casa",
    ],
    headlines: [
      "{name}: mesa com intenção",
      "Coma onde a casa tem voz",
      "Cozinha {name}",
      "Reserva, sala e prato com presença",
    ],
    taglines: [
      "Cardápio enxuto, execução cuidadosa, sala com clima.",
      "Do almoço ao jantar — com a assinatura da casa.",
      "Reserve com antecedência nos dias de pico.",
    ],
    aboutBodies: [
      "{name} é uma casa de comida com identidade própria: menos pratos, mais cuidado.",
      "A sala e a cozinha trabalham juntas para uma experiência coerente — do serviço ao prato.",
      "Temporada e disponibilidade influenciam a carta; o que importa é a execução.",
    ],
    eyebrows: ["Casa", "Carta", "Sala", "Reserva"],
    serviceBlurbs: [
      "Almoço e jantar com a linguagem da casa.",
      "Reservas pelo canal oficial.",
      "Sugestões do dia conforme temporada.",
    ],
    processRecipes: [
      [
        { title: "Reservar", description: "Data, horário e número de pessoas." },
        { title: "Chegar", description: "Confirmação e acomodação na sala." },
        { title: "Mesa", description: "Carta, sugestões e ritmo do serviço." },
      ],
    ],
    faqRecipes: [
      [
        { question: "Preciso reservar?", answer: "Recomendamos, especialmente à noite e fins de semana." },
        { question: "Tem estacionamento?", answer: "Informe-se no contato — a disponibilidade varia por localização." },
        { question: "Aceitam eventos?", answer: "Sob consulta, conforme capacidade da sala." },
      ],
    ],
    ctaTitles: ["Reservar mesa", "Ver a carta", "Falar no WhatsApp"],
    marqueeExtras: ["temporada", "sala", "prato", "reserva", "noite"],
    galleryTags: ["Prato", "Sala", "Detalhe", "Bar"],
    catalogNotes: ["Consulte a carta", "Sujeito a temporada", "Sob consulta"],
  },
  barbearia: {
    differentials: [
      "corte com método e acabamento limpo",
      "agenda online sem espera no balcão",
      "ambiente com presença — não só 'mais um salão'",
      "barbeiros com estilo reconhecível",
      "pacotes claros: corte, barba, combinação",
      "antes/depois reais quando o cliente autorizar",
      "horários noturnos e sábados sob disponibilidade",
      "produto e finalização alinhados ao corte",
    ],
    references: [
      "site de barbearia dark com dourado ou vermelho sangue",
      "galeria before/after com placeholders até fotos reais",
      "pricing em cards simples + WhatsApp",
      "mapa da unidade e botão de agendar",
      "hero full-bleed com tipografia display forte",
    ],
    headlines: [
      "{name}: corte com presença",
      "Barba, corte e acabamento",
      "Sua cadeira está marcada",
      "{name} · estilo sem enrolação",
    ],
    taglines: [
      "Agenda rápida, execução limpa, visual que se sustenta.",
      "Do fade ao clássico — com acabamento que aparece.",
      "Reserve o horário e chegue no tempo certo.",
    ],
    aboutBodies: [
      "{name} é barbearia com método: corte, barba e finalização sem pressa mal feita.",
      "A agenda existe para você não esperar. O resto é cadeira, conversa e execução.",
      "Trabalhamos o visual que combina com você — não um pacote genérico de catálogo.",
    ],
    eyebrows: ["Barbearia", "Agenda", "Serviços", "Unidade"],
    serviceBlurbs: [
      "Corte com acabamento e orientação de manutenção.",
      "Barba alinhada ao formato do rosto.",
      "Combo corte + barba no tempo combinado.",
    ],
    processRecipes: [
      [
        { title: "Agendar", description: "Escolha horário e profissional, se houver." },
        { title: "Chegar", description: "Confirmação e preparação da cadeira." },
        { title: "Sair", description: "Acabamento e próxima manutenção sugerida." },
      ],
    ],
    faqRecipes: [
      [
        { question: "Como agendar?", answer: "Pelo botão de agenda ou WhatsApp publicados nesta página." },
        { question: "Posso remarcar?", answer: "Sim, com antecedência mínima indicada no atendimento." },
        { question: "Tem estacionamento?", answer: "Depende da unidade — confirme no contato." },
      ],
    ],
    ctaTitles: ["Agendar horário", "Falar no WhatsApp", "Ver serviços"],
    marqueeExtras: ["corte", "barba", "fade", "agenda", "acabamento"],
    galleryTags: ["Corte", "Barba", "Ambiente", "Detalhe"],
    catalogNotes: ["Preço sob consulta", "Combo", "Avulso"],
  },
  infoproduto: {
    differentials: [
      "conteúdo com método — sem promessa de enriquecer",
      "aulas e materiais com escopo claro",
      "comunidade ou suporte com limites definidos",
      "linguagem direta, sem hype tóxico",
      "atualizações comunicadas quando existirem",
      "acesso organizado (plataforma / arquivos)",
      "foco em prática e critérios, não em milagre",
      "transparência sobre o que o produto inclui",
    ],
    references: [
      "landing de curso com tipografia forte e contraste",
      "seção de currículo em passos numerados",
      "pricing com 2–3 planos sem falsa escassez",
      "FAQ honesto sobre suporte e acesso",
      "hero com claim educacional, não de renda",
    ],
    headlines: [
      "{name}: método com clareza",
      "Aprenda com estrutura",
      "Do zero ao próximo passo — com critério",
      "{name} · conteúdo útil, sem hype",
    ],
    taglines: [
      "Material educacional. Resultados dependem da sua dedicação.",
      "Escopo claro: o que entra, o que não entra, como acessar.",
      "Menos promessa. Mais estrutura para estudar e praticar.",
    ],
    aboutBodies: [
      "{name} organiza conteúdo educacional com escopo definido e linguagem direta.",
      "Não prometemos renda ou resultado financeiro — oferecemos método e materiais.",
      "Você sabe o que compra: módulos, suporte (se houver) e formato de acesso.",
    ],
    eyebrows: ["Método", "Conteúdo", "Acesso", "Suporte"],
    serviceBlurbs: [
      "Módulos com objetivos de aprendizagem claros.",
      "Material de apoio para consulta.",
      "Canal de dúvidas dentro do que o produto inclui.",
    ],
    processRecipes: [
      [
        { title: "Inscrição", description: "Escolha o formato e confirme o acesso." },
        { title: "Estudo", description: "Siga a ordem sugerida dos módulos." },
        { title: "Prática", description: "Aplique e use o suporte previsto no plano." },
      ],
    ],
    faqRecipes: [
      [
        { question: "Garante renda?", answer: "Não. Este é um produto educacional; resultados variam com dedicação e contexto." },
        { question: "Por quanto tempo tenho acesso?", answer: "Conforme o plano escolhido — a informação fica no checkout e no e-mail de confirmação." },
        { question: "Tem suporte?", answer: "Se o plano incluir, o canal e o prazo estarão descritos na oferta." },
      ],
    ],
    ctaTitles: ["Ver o conteúdo", "Quero saber mais", "Começar agora"],
    marqueeExtras: ["método", "prática", "módulos", "clareza", "acesso"],
    galleryTags: ["Aula", "Material", "Comunidade"],
    catalogNotes: ["Sob consulta", "Plano anual", "Acesso vitalício: confirmar"],
  },
  local: {
    differentials: [
      "atendimento próximo, no bairro ou na região",
      "orçamento claro antes de começar",
      "pontualidade e comunicação pelo WhatsApp",
      "serviço com cara de quem conhece o cliente",
      "deslocamento sob combinação",
      "portfólio de trabalhos reais (quando autorizado)",
      "preço e prazo combinados por escrito",
      "suporte pós-serviço conforme o acordo",
    ],
    references: [
      "site de negócio local limpo: verde ou âmbar, tipografia amigável",
      "hero com CTA de WhatsApp e mapa",
      "lista de serviços em cards simples",
      "prova social só com depoimentos reais (placeholder até ter)",
      "stats honestos com traços até haver dados",
    ],
    headlines: [
      "{name}: perto de você",
      "Serviço local com conversa direta",
      "Do orçamento à entrega",
      "{name} · atendimento sem enrolação",
    ],
    taglines: [
      "Orçamento claro, prazo combinado, contato fácil.",
      "Para quem quer resolver com alguém da região.",
      "WhatsApp e visita sob combinação.",
    ],
    aboutBodies: [
      "{name} atende a região com foco em clareza de escopo, prazo e preço.",
      "Preferimos conversar antes: entender a necessidade e só então propor o serviço.",
      "Trabalho local, comunicação direta e acompanhamento até a entrega combinada.",
    ],
    eyebrows: ["Local", "Serviços", "Região", "Contato"],
    serviceBlurbs: [
      "Avaliação e orçamento sem compromisso oculto.",
      "Execução no prazo combinado.",
      "Ajustes finais conforme o acordo.",
    ],
    processRecipes: [
      [
        { title: "Contato", description: "Descreva o que precisa pelo formulário ou WhatsApp." },
        { title: "Orçamento", description: "Retorno com escopo, prazo e valor." },
        { title: "Entrega", description: "Execução e confirmação do combinado." },
      ],
      [
        { title: "Visita", description: "Quando o serviço pedir avaliação presencial." },
        { title: "Proposta", description: "Itens, materiais e condições." },
        { title: "Serviço", description: "Realização e pós-atendimento." },
      ],
    ],
    faqRecipes: [
      [
        { question: "Atendem minha região?", answer: "Informe o bairro no contato — confirmamos disponibilidade." },
        { question: "Como é o orçamento?", answer: "Enviamos escopo e valor antes de iniciar, sempre que possível." },
        { question: "Formas de pagamento?", answer: "Combinadas no orçamento; confirme no atendimento." },
      ],
    ],
    ctaTitles: ["Pedir orçamento", "Chamar no WhatsApp", "Falar conosco"],
    marqueeExtras: ["orçamento", "prazo", "região", "confiança", "entrega"],
    galleryTags: ["Serviço", "Antes", "Depois", "Equipe"],
    catalogNotes: ["Sob orçamento", "Visita técnica", "Avulso"],
  },
};

export function getSegmentCopy(segment: string): SegmentCopyBank {
  return BANKS[segment as Segment] ?? BANKS.local;
}

export function fillName(template: string, name: string) {
  return template.replaceAll("{name}", name);
}

export function pickFrom<T>(items: readonly T[], seed: number): T {
  return items[Math.abs(seed) % items.length]!;
}

export function pickMany<T>(items: readonly T[], seed: number, count: number): T[] {
  if (!items.length) return [];
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(items[Math.abs(seed + i * 17) % items.length]!);
  }
  return out;
}

/** Mistura briefing do usuário com banco local (sem inventar depoimento). */
export function resolveDifferentials(briefingDiff: string, segment: string, seed: number): string[] {
  const fromBrief = briefingDiff
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (fromBrief.length >= 2) return fromBrief.slice(0, 6);
  const bank = getSegmentCopy(segment).differentials;
  const picked = pickMany(bank, seed, 4);
  return fromBrief.length ? [...fromBrief, ...picked].slice(0, 6) : picked;
}

export function resolveReferences(briefingRefs: string, segment: string, seed: number): string[] {
  const fromBrief = briefingRefs
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (fromBrief.length) return fromBrief.slice(0, 5);
  return pickMany(getSegmentCopy(segment).references, seed, 3);
}
