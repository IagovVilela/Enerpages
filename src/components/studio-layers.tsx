"use client";

import type { Data } from "@puckeditor/core";
import { useStudioPuck } from "@/puck/use-studio-puck";
import { cn } from "@/lib/cn";

export function layersPlugin() {
  return {
    name: "camadas",
    label: "Camadas",
    render: () => <LayersPanel />,
  };
}

function LayersPanel() {
  const content = useStudioPuck((state) => state.appState.data.content);
  const dispatch = useStudioPuck((state) => state.dispatch);
  const selectedItem = useStudioPuck((state) => state.selectedItem);

  function select(index: number) {
    dispatch({
      type: "setUi",
      ui: { itemSelector: { index, zone: "root:default-zone" } },
    });
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= content.length) return;
    const copy = [...content];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    dispatch({
      type: "setData",
      data: (previous) => ({ ...previous, content: copy }),
    });
  }

  function duplicate(index: number) {
    const item = content[index];
    if (!item) return;
    const clone = {
      ...item,
      props: {
        ...item.props,
        id: `${String(item.type).toLowerCase()}-${Date.now().toString(36)}`,
      },
    } as Data["content"][number];
    const copy = [...content];
    copy.splice(index + 1, 0, clone);
    dispatch({
      type: "setData",
      data: (previous) => ({ ...previous, content: copy }),
    });
  }

  function remove(index: number) {
    dispatch({
      type: "setData",
      data: (previous) => ({
        ...previous,
        content: previous.content.filter((_, i) => i !== index),
      }),
    });
  }

  function toggleVisibility(index: number, key: "desktop" | "tablet" | "mobile") {
    const item = content[index];
    if (!item) return;
    const visibility = (item.props as { visibility?: { desktop: boolean; tablet: boolean; mobile: boolean } }).visibility;
    if (!visibility) return;
    const next = { ...visibility, [key]: !visibility[key] };
    dispatch({
      type: "setData",
      data: (previous) => ({
        ...previous,
        content: previous.content.map((block, i) =>
          i === index ? { ...block, props: { ...block.props, visibility: next } } : block,
        ),
      }),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Camadas</p>
        <p className="mt-1 text-[11px] text-neutral-500">
          Ordem, duplicar, remover e visibilidade por viewport (desk / tablet / celular).
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {content.length === 0 ? <p className="text-sm text-neutral-500">Nenhuma camada</p> : null}
        {content.map((item, index) => {
          const id = String((item.props as { id?: string }).id || index);
          const active = selectedItem?.props && (selectedItem.props as { id?: string }).id === id;
          const visibility = (item.props as { visibility?: { desktop: boolean; tablet: boolean; mobile: boolean } }).visibility;
          return (
            <div
              key={id}
              className={cn(
                "rounded-lg border px-2 py-2",
                active ? "border-[var(--studio-accent)] bg-white" : "border-[var(--studio-line)] bg-white/70",
              )}
            >
              <button type="button" className="w-full text-left text-sm font-medium" onClick={() => select(index)}>
                {index + 1}. {item.type}
              </button>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                <button type="button" className="border px-1.5 py-0.5" onClick={() => move(index, -1)} disabled={index === 0}>
                  ↑
                </button>
                <button type="button" className="border px-1.5 py-0.5" onClick={() => move(index, 1)} disabled={index === content.length - 1}>
                  ↓
                </button>
                <button type="button" className="border px-1.5 py-0.5" onClick={() => duplicate(index)}>
                  Duplicar
                </button>
                <button type="button" className="border px-1.5 py-0.5 text-red-700" onClick={() => remove(index)}>
                  Remover
                </button>
              </div>
              {visibility ? (
                <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                  {(["desktop", "tablet", "mobile"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={cn("border px-1.5 py-0.5 capitalize", visibility[key] ? "bg-[var(--studio-ink)] text-[var(--studio-bg)]" : "opacity-50")}
                      onClick={() => toggleVisibility(index, key)}
                    >
                      {key === "desktop" ? "Desk" : key === "tablet" ? "Tab" : "Cel"}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
