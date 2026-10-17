"use client";

import { BG_ART_OPTIONS, bgArtStyle } from "@/puck/bg-art";
import { FONT_BY_PERSONALITY, STYLE_BY_PERSONALITY } from "@/lib/ai/archetypes";
import { TYPOGRAPHY_PRESETS } from "@/puck/section-presets";
import { BODY_FONTS, DISPLAY_FONTS, PERSONALITIES, type Theme } from "@/puck/schema";
import { useStudioPuck } from "@/puck/use-studio-puck";
import { cn } from "@/lib/cn";

export const themePlugin = {
  name: "tema",
  label: "Tema",
  render: () => <ThemePanel />,
};

export function ThemePanel() {
  const theme = useStudioPuck((state) => (state.appState.data.root.props as { theme?: Theme } | undefined)?.theme);
  const dispatch = useStudioPuck((state) => state.dispatch);
  if (!theme) return <p className="p-3 text-sm">Tema indisponível.</p>;
  function update(next: Theme) {
    dispatch({
      type: "setData",
      data: (previous) => ({
        content: previous.content,
        zones: previous.zones,
        root: { ...previous.root, props: { ...previous.root.props, theme: next } },
      }),
    });
  }
  const colorLabels: Record<keyof Theme["colors"], string> = {
    primary: "Principal",
    accent: "Secundária / acento",
    background: "Fundo",
    muted: "Superfície",
    foreground: "Texto",
    border: "Borda",
  };
  return (
    <div className="grid gap-4 p-3 text-sm">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Cores do sistema</p>
        <p className="text-[11px] text-neutral-500">Controla a página inteira: fundo, textos, painéis e botões.</p>
        {(Object.keys(theme.colors) as Array<keyof Theme["colors"]>).map((key) => (
          <div key={key} className="flex items-center justify-between gap-2 text-xs">
            <span>{colorLabels[key]}</span>
            <input
              type="color"
              value={toColor(theme.colors[key])}
              onChange={(event) => update({ ...theme, colors: { ...theme.colors, [key]: event.target.value } })}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Arte de fundo</p>
        <div className="grid grid-cols-2 gap-1.5">
          {BG_ART_OPTIONS.map((opt) => {
            const active = (theme.bgArt ?? "none") === opt.id;
            const preview = bgArtStyle({
              bgArt: opt.id,
              bgArtColor: theme.bgArtColor || theme.colors.foreground,
              bgArtStrength: Math.max(theme.bgArtStrength ?? 45, 65),
              colors: theme.colors,
            });
            return (
              <button
                key={opt.id}
                type="button"
                title={opt.label}
                onClick={() => update({ ...theme, bgArt: opt.id })}
                className={cn(
                  "overflow-hidden rounded-lg border text-left",
                  active ? "border-[var(--studio-accent)] ring-1 ring-[var(--studio-accent)]/40" : "border-[var(--studio-line)]",
                )}
              >
                <div className="h-10 w-full" style={{ backgroundColor: theme.colors.background, ...preview }} />
                <span className="block px-1.5 py-1 text-[10px] font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
        {(theme.bgArt ?? "none") !== "none" ? (
          <div className="space-y-2 rounded-lg border border-[var(--studio-line)] p-2">
            <label className="flex items-center justify-between gap-2 text-xs">
              Cor das linhas
              <input
                type="color"
                value={toColor(theme.bgArtColor || theme.colors.foreground)}
                onChange={(event) => update({ ...theme, bgArtColor: event.target.value })}
              />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="flex justify-between">
                Intensidade
                <span className="text-neutral-500">{theme.bgArtStrength ?? 45}%</span>
              </span>
              <input
                type="range"
                min={8}
                max={90}
                value={theme.bgArtStrength ?? 45}
                onChange={(event) => update({ ...theme, bgArtStrength: Number(event.target.value) })}
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Tipografia</p>
        <div className="grid gap-1">
          {TYPOGRAPHY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.hint}
              onClick={() =>
                update({
                  ...theme,
                  personality: preset.personality,
                  fonts: FONT_BY_PERSONALITY[preset.personality],
                  ...STYLE_BY_PERSONALITY[preset.personality],
                })
              }
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-left",
                theme.personality === preset.personality
                  ? "border-[var(--studio-accent)] bg-white"
                  : "border-[var(--studio-line)] bg-white/70",
              )}
            >
              <span className="block text-xs font-medium">{preset.label}</span>
              <span className="block text-[10px] text-neutral-500">{preset.hint}</span>
            </button>
          ))}
        </div>
        <label className="grid gap-1 text-xs">
          Fonte de título
          <select
            className="border px-2 py-1.5 text-sm"
            value={theme.fonts.display}
            onChange={(event) => update({ ...theme, fonts: { ...theme.fonts, display: event.target.value as Theme["fonts"]["display"] } })}
          >
            {DISPLAY_FONTS.map((font) => (
              <option key={font}>{font}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          Fonte de texto
          <select
            className="border px-2 py-1.5 text-sm"
            value={theme.fonts.body}
            onChange={(event) => update({ ...theme, fonts: { ...theme.fonts, body: event.target.value as Theme["fonts"]["body"] } })}
          >
            {BODY_FONTS.map((font) => (
              <option key={font}>{font}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Forma e ritmo</p>
        {(
          [
            ["radius", "Cantos", ["none", "sm", "md", "lg"]],
            ["shadow", "Sombra", ["none", "soft", "hard"]],
            ["button", "Botão", ["solid", "outline", "pill", "underline"]],
            ["image", "Imagem", ["sharp", "rounded", "framed", "bleed"]],
            ["spacing", "Espaçamento", ["compact", "comfortable", "airy"]],
            ["cursor", "Cursor", ["default", "dot"]],
          ] as const
        ).map(([key, label, options]) => (
          <label key={key} className="grid gap-1 text-xs">
            {label}
            <select
              className="border px-2 py-1.5 text-sm"
              value={theme[key]}
              onChange={(event) => update({ ...theme, [key]: event.target.value })}
            >
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="grid gap-1 text-xs">
          Personalidade
          <select
            className="border px-2 py-1.5 text-sm"
            value={theme.personality}
            onChange={(event) => update({ ...theme, personality: event.target.value as Theme["personality"] })}
          >
            {PERSONALITIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function toColor(value: string) {
  return /^#(?:[0-9a-fA-F]{6})$/.test(value) ? value : "#000000";
}
