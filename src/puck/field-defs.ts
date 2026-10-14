import { PRESETS } from "@/puck/schema";

const presetLabels: Record<(typeof PRESETS)[number], string> = {
  none: "Nenhuma",
  fade: "Fade",
  "slide-up": "Subir",
  "slide-left": "Deslizar",
  "mask-reveal": "Máscara",
  "split-words": "Palavras",
  "split-chars": "Letras",
  stagger: "Escalonado",
  "blur-in": "Desfoque",
  scale: "Escala",
};

export const animationField = {
  type: "object" as const,
  label: "Animação",
  objectFields: {
    preset: { type: "select" as const, label: "Preset", options: PRESETS.map((value) => ({ label: presetLabels[value], value })) },
    duration: { type: "number" as const, label: "Duração", min: 0, max: 2, step: 0.1 },
    delay: { type: "number" as const, label: "Atraso", min: 0, max: 2, step: 0.05 },
    easing: {
      type: "select" as const,
      label: "Easing",
      options: [
        { label: "Saída", value: "easeOut" },
        { label: "Entrada e saída", value: "easeInOut" },
        { label: "Mola", value: "spring" },
        { label: "Linear", value: "linear" },
      ],
    },
    trigger: {
      type: "select" as const,
      label: "Gatilho",
      options: [
        { label: "Ao aparecer", value: "view" },
        { label: "Ao carregar", value: "load" },
        { label: "No hover", value: "hover" },
        { label: "No scroll", value: "scroll" },
      ],
    },
  },
};

const yesNo = [
  { label: "Mostrar", value: true },
  { label: "Ocultar", value: false },
];

export const visibilityField = {
  type: "object" as const,
  label: "Visibilidade",
  objectFields: {
    desktop: { type: "radio" as const, label: "Desktop", options: yesNo },
    tablet: { type: "radio" as const, label: "Tablet", options: yesNo },
    mobile: { type: "radio" as const, label: "Celular", options: yesNo },
  },
};

export const linkField = (label: string) => ({
  type: "object" as const,
  label,
  objectFields: {
    label: { type: "text" as const, label: "Texto", contentEditable: true },
    href: { type: "text" as const, label: "Link" },
  },
});

export const featureArray = {
  type: "array" as const,
  label: "Itens",
  arrayFields: {
    title: { type: "text" as const, label: "Título", contentEditable: true },
    description: { type: "textarea" as const, label: "Texto", contentEditable: true },
  },
  getItemSummary: (item: { title?: string }) => item.title || "Item",
};
