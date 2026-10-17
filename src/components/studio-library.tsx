"use client";

import { useState } from "react";
import {
  LIBRARY_ITEM_GROUPS,
  READY_PRESETS,
  SECTION_PRESETS,
  insertBlocks,
  makeFreshBlock,
  makeSectionBlocks,
  type LibraryTab,
} from "@/puck/section-presets";
import { useStudioPuck } from "@/puck/use-studio-puck";
import { cn } from "@/lib/cn";

export function libraryPlugin() {
  return {
    name: "biblioteca",
    label: "Biblioteca",
    render: () => <LibraryPanel />,
  };
}

export function LibraryPanel() {
  const dispatch = useStudioPuck((state) => state.dispatch);
  const [tab, setTab] = useState<LibraryTab>("elements");

  function addOne(type: Parameters<typeof makeFreshBlock>[0], variant?: string) {
    const block = makeFreshBlock(type, variant);
    dispatch({
      type: "setData",
      data: (previous) => ({
        ...previous,
        content: insertBlocks(previous.content, [block]),
      }),
    });
  }

  function addSection(id: string) {
    const preset = SECTION_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    const blocks = makeSectionBlocks(preset);
    dispatch({
      type: "setData",
      data: (previous) => ({
        ...previous,
        content: insertBlocks(previous.content, blocks),
      }),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Biblioteca</p>
        <p className="mt-1 text-[11px] text-neutral-500">
          Todos os componentes, seções pré-montadas e presets estilizados.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-[var(--studio-line)] bg-white p-0.5">
        {(
          [
            ["elements", "Itens"],
            ["sections", "Seções"],
            ["ready", "Prontos"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 rounded-md px-1.5 py-1 text-[10px] font-semibold",
              tab === id
                ? "bg-[var(--studio-ink)] text-[var(--studio-bg)]"
                : "text-neutral-600 hover:bg-[var(--studio-bg)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {tab === "elements"
          ? LIBRARY_ITEM_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{group.title}</p>
                <div className="grid gap-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      title={item.hint}
                      className="rounded-lg border border-[var(--studio-line)] bg-white px-3 py-2 text-left hover:border-[var(--studio-accent)]/50"
                      onClick={() => addOne(item.type, item.variant)}
                    >
                      <span className="block text-sm">{item.label}</span>
                      <span className="block text-[10px] text-neutral-500">{item.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          : null}

        {tab === "sections" ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Seções pré-montadas</p>
            <p className="text-[11px] text-neutral-500">Insere vários blocos de uma vez, antes do rodapé.</p>
            <div className="grid gap-1">
              {SECTION_PRESETS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  title={section.hint}
                  className="rounded-lg border border-[var(--studio-accent)]/25 bg-white px-3 py-2 text-left hover:border-[var(--studio-accent)]/60"
                  onClick={() => addSection(section.id)}
                >
                  <span className="block text-sm">{section.label}</span>
                  <span className="block text-[10px] text-neutral-500">{section.hint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "ready"
          ? READY_PRESETS.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{group.title}</p>
                <div className="grid gap-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      title={item.hint}
                      className="rounded-lg border border-[var(--studio-line)] bg-white px-3 py-2 text-left hover:border-[var(--studio-accent)]/50"
                      onClick={() => addOne(item.type, item.variant)}
                    >
                      <span className="block text-sm">{item.label}</span>
                      <span className="block text-[10px] text-neutral-500">{item.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
