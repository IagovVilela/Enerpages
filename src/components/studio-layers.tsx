"use client";

import type { Data } from "@puckeditor/core";
import { useStudioUi } from "@/components/studio-ui-context";
import { useStudioPuck } from "@/puck/use-studio-puck";
import { cn } from "@/lib/cn";

type BlockProps = {
  id?: string;
  locked?: boolean;
  visibility?: { desktop: boolean; tablet: boolean; mobile: boolean };
};

export function layersPlugin() {
  return {
    name: "camadas",
    label: "Camadas",
    render: () => <LayersPanel />,
  };
}

export function LayersPanel() {
  const content = useStudioPuck((state) => state.appState.data.content);
  const dispatch = useStudioPuck((state) => state.dispatch);
  const selectedItem = useStudioPuck((state) => state.selectedItem);
  const { confirm } = useStudioUi();

  function select(index: number) {
    dispatch({
      type: "setUi",
      ui: { itemSelector: { index, zone: "root:default-zone" } },
    });
  }

  function move(index: number, direction: -1 | 1) {
    const item = content[index];
    if ((item?.props as BlockProps | undefined)?.locked) return;
    const next = index + direction;
    if (next < 0 || next >= content.length) return;
    const neighbor = content[next];
    if ((neighbor?.props as BlockProps | undefined)?.locked) return;
    const copy = [...content];
    const [moved] = copy.splice(index, 1);
    copy.splice(next, 0, moved);
    dispatch({
      type: "setData",
      data: (previous) => ({ ...previous, content: copy }),
    });
  }

  function duplicate(index: number) {
    const item = content[index];
    if (!item || (item.props as BlockProps).locked) return;
    const clone = {
      ...item,
      props: {
        ...item.props,
        id: `${String(item.type).toLowerCase()}-${Date.now().toString(36)}`,
        locked: false,
      },
    } as Data["content"][number];
    const copy = [...content];
    copy.splice(index + 1, 0, clone);
    dispatch({
      type: "setData",
      data: (previous) => ({ ...previous, content: copy }),
    });
  }

  async function remove(index: number) {
    const item = content[index];
    if (!item || (item.props as BlockProps).locked) return;
    const ok = await confirm({
      title: "Remover este bloco?",
      description: `O bloco ${item.type} será removido do rascunho. Você pode desfazer em seguida se precisar.`,
      confirmLabel: "Remover",
      danger: true,
    });
    if (!ok) return;
    dispatch({
      type: "setData",
      data: (previous) => ({
        ...previous,
        content: previous.content.filter((_, i) => i !== index),
      }),
    });
  }

  function toggleLock(index: number) {
    const item = content[index];
    if (!item) return;
    const locked = Boolean((item.props as BlockProps).locked);
    dispatch({
      type: "setData",
      data: (previous) => ({
        ...previous,
        content: previous.content.map((block, i) =>
          i === index ? { ...block, props: { ...block.props, locked: !locked } } : block,
        ),
      }),
    });
  }

  function toggleVisibility(index: number, key: "desktop" | "tablet" | "mobile") {
    const item = content[index];
    if (!item) return;
    const visibility = (item.props as BlockProps).visibility;
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
          Ordem, travar, duplicar, remover e visibilidade por viewport (desk / tablet / celular).
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {content.length === 0 ? <p className="text-sm text-neutral-500">Nenhuma camada</p> : null}
        {content.map((item, index) => {
          const props = item.props as BlockProps;
          const id = String(props.id || index);
          const locked = Boolean(props.locked);
          const active = selectedItem?.props && (selectedItem.props as BlockProps).id === id;
          const visibility = props.visibility;
          const hiddenEverywhere = visibility && !visibility.desktop && !visibility.tablet && !visibility.mobile;
          return (
            <div
              key={id}
              className={cn(
                "rounded-lg border px-2 py-2",
                active ? "border-[var(--studio-accent)] bg-white" : "border-[var(--studio-line)] bg-white/70",
                locked ? "opacity-90" : null,
                hiddenEverywhere ? "opacity-60" : null,
              )}
            >
              <button type="button" className="flex w-full items-center gap-1.5 text-left text-sm font-medium" onClick={() => select(index)}>
                <span className="min-w-0 flex-1 truncate">
                  {index + 1}. {item.type}
                </span>
                {locked ? <span className="shrink-0 text-[10px] uppercase tracking-wide text-neutral-500">Travado</span> : null}
              </button>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                <button
                  type="button"
                  className="border px-1.5 py-0.5 disabled:opacity-40"
                  onClick={() => move(index, -1)}
                  disabled={locked || index === 0}
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="border px-1.5 py-0.5 disabled:opacity-40"
                  onClick={() => move(index, 1)}
                  disabled={locked || index === content.length - 1}
                  title="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={cn("border px-1.5 py-0.5", locked ? "bg-[var(--studio-ink)] text-[var(--studio-bg)]" : null)}
                  onClick={() => toggleLock(index)}
                  title={locked ? "Destravar" : "Travar"}
                >
                  {locked ? "Destravar" : "Travar"}
                </button>
                <button type="button" className="border px-1.5 py-0.5 disabled:opacity-40" onClick={() => duplicate(index)} disabled={locked}>
                  Duplicar
                </button>
                <button
                  type="button"
                  className="border px-1.5 py-0.5 text-red-700 disabled:opacity-40"
                  onClick={() => void remove(index)}
                  disabled={locked}
                >
                  Remover
                </button>
              </div>
              {visibility ? (
                <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                  {(["desktop", "tablet", "mobile"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      title={visibility[key] ? "Visível neste viewport" : "Oculto neste viewport"}
                      className={cn(
                        "border px-1.5 py-0.5 capitalize",
                        visibility[key] ? "bg-[var(--studio-ink)] text-[var(--studio-bg)]" : "opacity-50",
                      )}
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
