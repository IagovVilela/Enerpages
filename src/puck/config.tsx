import type { ReactNode } from "react";
import type { Config, Data } from "@puckeditor/core";
import {
  About,
  BeforeAfter,
  Booking,
  Catalog,
  Contact,
  Cta,
  Faq,
  Footer,
  Gallery,
  Hero,
  MapBlock,
  Marquee,
  Navbar,
  Pricing,
  Process,
  Services,
  Stats,
  Team,
  Testimonials,
  Timeline,
  Video,
  WhatsApp,
} from "@/puck/blocks";
import { Badge, Band, Button, CardGrid, Clip, Divider, Panel, Picture, Spacer, Text } from "@/puck/primitives";
import { defaultPropsMap } from "@/puck/defaults";
import { ImageControl } from "@/puck/fields";
import { animationField, featureArray, linkField, visibilityField } from "@/puck/field-defs";
import { VARIANTS, type ImageField, type RootProps } from "@/puck/schema";
import { ThemeProvider } from "@/puck/theme";

function imageField(label = "Imagem ou vídeo") {
  return {
    type: "custom" as const,
    label,
    key: label,
    render: ({ value, onChange }: { value: ImageField; onChange: (value: ImageField) => void }) => (
      <ImageControl value={value} onChange={onChange} label={label} />
    ),
  };
}

const props = defaultPropsMap();
const variantField = (type: keyof typeof VARIANTS) => ({
  type: "select" as const,
  label: "Variante",
  options: VARIANTS[type].map((value) => ({ label: value, value })),
});
const alignField = {
  type: "select" as const,
  label: "Alinhamento",
  options: [
    { label: "Esquerda", value: "left" },
    { label: "Centro", value: "center" },
    { label: "Direita", value: "right" },
  ],
};
const chrome = (type: keyof typeof VARIANTS) => ({
  variant: variantField(type),
  anchor: { type: "text" as const, label: "Âncora" },
  visibility: visibilityField,
  animation: animationField,
});

export const config = {
  categories: {
    basicos: { title: "Básicos", components: ["Text", "Button", "Badge", "Divider", "Spacer"] },
    layout: { title: "Layout", components: ["Panel", "CardGrid", "Band"] },
    midia: { title: "Mídia", components: ["Picture", "Clip", "Video", "Gallery"] },
    estrutura: { title: "Estrutura", components: ["Navbar", "Footer", "WhatsApp", "Marquee"] },
    abertura: { title: "Abertura", components: ["Hero", "About"] },
    conteudo: { title: "Conteúdo", components: ["Services", "Catalog", "Process", "Team", "Timeline", "BeforeAfter"] },
    prova: { title: "Prova", components: ["Testimonials", "Stats", "Pricing", "Faq"] },
    conversao: { title: "Conversão", components: ["Cta", "Contact", "Booking", "Map"] },
  },
  root: {
    fields: {
      theme: { type: "custom", label: "Tema", render: () => <p className="text-xs">Use o painel Tema para alterar a página inteira.</p> },
      seo: {
        type: "object",
        label: "SEO",
        objectFields: {
          title: { type: "text", label: "Título" },
          description: { type: "textarea", label: "Descrição" },
          ogImage: { type: "text", label: "Imagem OG" },
        },
      },
      favicon: { type: "text", label: "Favicon" },
      locale: { type: "text", label: "Idioma" },
      whatsapp: {
        type: "object",
        label: "WhatsApp global",
        objectFields: {
          phone: { type: "text", label: "Telefone" },
          message: { type: "textarea", label: "Mensagem" },
          floating: { type: "radio", label: "Botão flutuante", options: [{ label: "Ligado", value: true }, { label: "Desligado", value: false }] },
        },
      },
      analytics: {
        type: "object",
        label: "Analytics externo",
        objectFields: {
          ga4: { type: "text", label: "GA4 (G-...)" },
          metaPixel: { type: "text", label: "Meta Pixel" },
        },
      },
    },
    render: (props: object) => {
      const incoming = props as RootProps & { puck?: { isEditing?: boolean }; children?: ReactNode };
      const settings: RootProps = {
        theme: incoming.theme,
        seo: incoming.seo,
        favicon: incoming.favicon,
        locale: incoming.locale,
        whatsapp: incoming.whatsapp,
        analytics: incoming.analytics,
        archetype: incoming.archetype,
        slug: incoming.slug,
        pageId: incoming.pageId,
      };
      return (
        <ThemeProvider settings={settings} editing={Boolean(incoming.puck?.isEditing)}>
          {incoming.children}
        </ThemeProvider>
      );
    },
  },
  components: {
    Navbar: { label: "Navegação", fields: { ...chrome("Navbar"), logo: { type: "text", label: "Logo", contentEditable: true }, links: { type: "array", label: "Links", arrayFields: { label: { type: "text" }, href: { type: "text" } }, getItemSummary: (item: { label?: string }) => item.label || "Link" }, cta: linkField("Botão") }, defaultProps: props.get("Navbar"), render: Navbar },
    Hero: { label: "Hero", fields: { image: imageField(), ...chrome("Hero"), eyebrow: { type: "text", label: "Linha", contentEditable: true }, title: { type: "textarea", label: "Título", contentEditable: true }, subtitle: { type: "textarea", label: "Subtítulo", contentEditable: true }, primaryCta: linkField("CTA principal"), secondaryCta: linkField("CTA secundário") }, defaultProps: props.get("Hero"), render: Hero },
    About: { label: "Sobre", fields: { image: imageField(), ...chrome("About"), eyebrow: { type: "text", contentEditable: true, label: "Linha" }, title: { type: "textarea", contentEditable: true, label: "Título" }, body: { type: "textarea", contentEditable: true, label: "Texto" }, points: featureArray }, defaultProps: props.get("About"), render: About },
    Services: { label: "Serviços", fields: { ...chrome("Services"), eyebrow: { type: "text", contentEditable: true, label: "Linha" }, title: { type: "textarea", contentEditable: true, label: "Título" }, items: featureArray }, defaultProps: props.get("Services"), render: Services },
    Catalog: { label: "Catálogo", fields: { ...chrome("Catalog"), eyebrow: { type: "text", label: "Linha" }, title: { type: "text", label: "Título", contentEditable: true }, items: { type: "array", label: "Produtos", arrayFields: { title: { type: "text" }, description: { type: "textarea" }, price: { type: "text" }, image: imageField("Foto") }, getItemSummary: (item: { title?: string }) => item.title || "Produto" } }, defaultProps: props.get("Catalog"), render: Catalog },
    Gallery: { label: "Galeria", fields: { ...chrome("Gallery"), title: { type: "text", label: "Título", contentEditable: true }, images: { type: "array", label: "Imagens", arrayFields: { image: imageField(), caption: { type: "text" }, tag: { type: "text", label: "Filtro" } }, getItemSummary: (item: { caption?: string }) => item.caption || "Imagem" } }, defaultProps: props.get("Gallery"), render: Gallery },
    Testimonials: { label: "Depoimentos", fields: { ...chrome("Testimonials"), title: { type: "text", label: "Título" }, items: { type: "array", label: "Depoimentos", arrayFields: { quote: { type: "textarea" }, name: { type: "text" }, role: { type: "text" }, placeholder: { type: "radio", options: [{ label: "Placeholder", value: true }, { label: "Real", value: false }] }, image: imageField() }, getItemSummary: (item: { name?: string }) => item.name || "Depoimento" } }, defaultProps: props.get("Testimonials"), render: Testimonials },
    Stats: { label: "Números", fields: { ...chrome("Stats"), title: { type: "text", label: "Título" }, items: { type: "array", label: "Números", arrayFields: { value: { type: "text" }, label: { type: "text" } }, getItemSummary: (item: { label?: string }) => item.label || "Número" } }, defaultProps: props.get("Stats"), render: Stats },
    Process: { label: "Processo", fields: { ...chrome("Process"), title: { type: "text", label: "Título", contentEditable: true }, items: featureArray }, defaultProps: props.get("Process"), render: Process },
    Pricing: { label: "Planos", fields: { ...chrome("Pricing"), title: { type: "text", label: "Título" }, plans: { type: "array", label: "Planos", arrayFields: { name: { type: "text" }, price: { type: "text" }, description: { type: "textarea" }, features: { type: "textarea", label: "Itens, um por linha" }, cta: linkField("Botão"), featured: { type: "radio", options: [{ label: "Destaque", value: true }, { label: "Normal", value: false }] } }, getItemSummary: (item: { name?: string }) => item.name || "Plano" } }, defaultProps: props.get("Pricing"), render: Pricing },
    Faq: { label: "FAQ", fields: { ...chrome("Faq"), title: { type: "text", label: "Título" }, items: { type: "array", label: "Perguntas", arrayFields: { question: { type: "text", contentEditable: true }, answer: { type: "textarea", contentEditable: true } }, getItemSummary: (item: { question?: string }) => item.question || "Pergunta" } }, defaultProps: props.get("Faq"), render: Faq },
    Team: { label: "Equipe", fields: { ...chrome("Team"), title: { type: "text", label: "Título" }, people: { type: "array", label: "Pessoas", arrayFields: { title: { type: "text", label: "Nome" }, role: { type: "text" }, description: { type: "textarea" }, image: imageField() }, getItemSummary: (item: { title?: string }) => item.title || "Pessoa" } }, defaultProps: props.get("Team"), render: Team },
    Timeline: { label: "Linha do tempo", fields: { ...chrome("Timeline"), title: { type: "text", label: "Título" }, events: { type: "array", label: "Eventos", arrayFields: { year: { type: "text" }, title: { type: "text" }, description: { type: "textarea" } }, getItemSummary: (item: { title?: string }) => item.title || "Evento" } }, defaultProps: props.get("Timeline"), render: Timeline },
    Map: { label: "Mapa", fields: { ...chrome("Map"), title: { type: "text", label: "Título" }, address: { type: "textarea", label: "Endereço" }, embedUrl: { type: "text", label: "URL do mapa" }, note: { type: "textarea", label: "Nota" } }, defaultProps: props.get("Map"), render: MapBlock },
    Contact: { label: "Contato", fields: { ...chrome("Contact"), title: { type: "text", label: "Título", contentEditable: true }, subtitle: { type: "textarea", label: "Texto", contentEditable: true }, submitLabel: { type: "text", label: "Botão" } }, defaultProps: props.get("Contact"), render: Contact },
    Cta: { label: "Chamada final", fields: { ...chrome("Cta"), eyebrow: { type: "text", contentEditable: true, label: "Linha" }, title: { type: "textarea", contentEditable: true, label: "Título" }, subtitle: { type: "textarea", label: "Texto" }, cta: linkField("Botão") }, defaultProps: props.get("Cta"), render: Cta },
    Footer: { label: "Rodapé", fields: { ...chrome("Footer"), logo: { type: "text", contentEditable: true, label: "Logo" }, note: { type: "textarea", label: "Nota" }, links: { type: "array", label: "Links", arrayFields: { label: { type: "text" }, href: { type: "text" } }, getItemSummary: (item: { label?: string }) => item.label || "Link" }, legal: { type: "text", label: "Legal" } }, defaultProps: props.get("Footer"), render: Footer },
    Marquee: { label: "Letreiro", fields: { ...chrome("Marquee"), items: { type: "array", label: "Itens", arrayFields: { label: { type: "text", contentEditable: true } }, getItemSummary: (item: { label?: string }) => item.label || "Item" } }, defaultProps: props.get("Marquee"), render: Marquee },
    Video: { label: "Vídeo", fields: { file: imageField("Arquivo de vídeo"), ...chrome("Video"), title: { type: "text", label: "Título" }, url: { type: "text", label: "Ou cole um link do YouTube ou Vimeo" }, caption: { type: "textarea", label: "Legenda" } }, defaultProps: props.get("Video"), render: Video },
    BeforeAfter: { label: "Antes e depois", fields: { ...chrome("BeforeAfter"), title: { type: "text", label: "Título" }, before: imageField("Antes"), after: imageField("Depois"), beforeLabel: { type: "text", label: "Rótulo antes" }, afterLabel: { type: "text", label: "Rótulo depois" } }, defaultProps: props.get("BeforeAfter"), render: BeforeAfter },
    Booking: { label: "Agendamento", fields: { ...chrome("Booking"), title: { type: "text", contentEditable: true, label: "Título" }, subtitle: { type: "textarea", label: "Texto" }, href: { type: "text", label: "Link" }, label: { type: "text", label: "Botão" } }, defaultProps: props.get("Booking"), render: Booking },
    WhatsApp: { label: "WhatsApp", fields: { ...chrome("WhatsApp"), label: { type: "text", label: "Rótulo" }, phone: { type: "text", label: "Telefone" }, message: { type: "textarea", label: "Mensagem" } }, defaultProps: props.get("WhatsApp"), render: WhatsApp },
    Text: { label: "Texto", fields: { ...chrome("Text"), text: { type: "textarea", label: "Texto", contentEditable: true }, align: alignField, fontSize: { type: "number", label: "Tamanho", min: 12, max: 120 } }, defaultProps: props.get("Text"), render: Text },
    Button: { label: "Botão", fields: { ...chrome("Button"), label: { type: "text", label: "Rótulo", contentEditable: true }, href: { type: "text", label: "Link" }, align: alignField }, defaultProps: props.get("Button"), render: Button },
    Badge: { label: "Selo", fields: { ...chrome("Badge"), text: { type: "text", label: "Texto", contentEditable: true }, align: alignField }, defaultProps: props.get("Badge"), render: Badge },
    Divider: { label: "Divisor", fields: { ...chrome("Divider") }, defaultProps: props.get("Divider"), render: Divider },
    Spacer: { label: "Espaço", fields: { ...chrome("Spacer") }, defaultProps: props.get("Spacer"), render: Spacer },
    Panel: { label: "Painel", fields: { ...chrome("Panel"), title: { type: "text", label: "Título", contentEditable: true }, body: { type: "textarea", label: "Texto", contentEditable: true } }, defaultProps: props.get("Panel"), render: Panel },
    CardGrid: { label: "Grade", fields: { ...chrome("CardGrid"), title: { type: "text", label: "Título" }, cards: { type: "array", label: "Cartões", arrayFields: { emoji: { type: "text", label: "Ícone" }, title: { type: "text", label: "Título" }, description: { type: "textarea", label: "Texto" } }, getItemSummary: (item: { title?: string }) => item.title || "Cartão" } }, defaultProps: props.get("CardGrid"), render: CardGrid },
    Band: { label: "Faixa", fields: { ...chrome("Band"), text: { type: "textarea", label: "Texto", contentEditable: true }, label: { type: "text", label: "Rótulo do link" }, href: { type: "text", label: "Link" } }, defaultProps: props.get("Band"), render: Band },
    Picture: { label: "Imagem", fields: { image: imageField("Imagem"), ...chrome("Picture"), zoom: { type: "number", label: "Zoom", min: 1, max: 3, step: 0.1 }, posX: { type: "number", label: "Enquadramento horizontal", min: 0, max: 100 }, posY: { type: "number", label: "Enquadramento vertical", min: 0, max: 100 }, caption: { type: "text", label: "Legenda" } }, defaultProps: props.get("Picture"), render: Picture },
    Clip: { label: "Mídia", fields: { file: imageField("Imagem ou vídeo"), ...chrome("Clip"), zoom: { type: "number", label: "Zoom", min: 1, max: 3, step: 0.1 }, posX: { type: "number", label: "Enquadramento horizontal", min: 0, max: 100 }, posY: { type: "number", label: "Enquadramento vertical", min: 0, max: 100 }, caption: { type: "text", label: "Legenda" } }, defaultProps: props.get("Clip"), render: Clip },
  },
} as unknown as Config;

export const puckDictionary = {
  "header-publish": "Publicar",
  "header-undo": "Desfazer",
  "header-redo": "Refazer",
  "header-toggle-leftsidebar": "Biblioteca",
  "header-toggle-rightsidebar": "Propriedades",
  "action-duplicate": "Duplicar",
  "action-delete": "Remover",
  "label-page": "Página",
  "label-component": "Bloco",
  "outline-empty": "Nenhuma camada",
  "outline-header-title": "Camadas",
  "plugin-blocks": "Blocos",
  "plugin-outline": "Camadas",
  "plugin-fields": "Propriedades",
  "loader-loading": "Carregando",
};

export type { Data };
