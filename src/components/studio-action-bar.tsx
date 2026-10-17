"use client";

import type { Data } from "@puckeditor/core";
import type { ReactNode } from "react";
import { useStudioUi } from "@/components/studio-ui-context";
import { cn } from "@/lib/cn";
import { useStudioPuck } from "@/puck/use-studio-puck";

type BlockProps = {
  id?: string;
  locked?: boolean;
};

function findSelectedIndex(content: Data["content"], selectedId?: string) {
  if (!selectedId) return -1;
  return content.findIndex((block) => (block.props as BlockProps).id === selectedId);
}

export function StudioActionBar({
  children,
  parentAction,
  label,
}: {
  children: ReactNode;
  parentAction: ReactNode;
  label?: string;
}) {
  const dispatch = useStudioPuck((state) => state.dispatch);
  const selectedItem = useStudioPuck((state) => state.selectedItem);
  const content = useStudioPuck((state) => state.appState.data.content);
  const { confirm } = useStudioUi();

  const selectedId = (selectedItem?.props as BlockProps | undefined)?.id;
  const index = findSelectedIndex(content, selectedId);
  const locked = Boolean((selectedItem?.props as BlockProps | undefined)?.locked);
  const canMoveUp = index > 0 && !locked;
  const canMoveDown = index >= 0 && index < content.length - 1 && !locked;

  function move(direction: -1 | 1) {
    if (index < 0 || locked) return;
    const next = index + direction;
    if (next < 0 || next >= content.length) return;
    if ((content[next]?.props as BlockProps | undefined)?.locked) return;
    const copy = [...content];
    const [moved] = copy.splice(index, 1);
    copy.splice(next, 0, moved);
    dispatch({
      type: "setData",
      data: (previous) => ({ ...previous, content: copy }),
    });
    dispatch({
      type: "setUi",
      ui: { itemSelector: { index: next, zone: "root:default-zone" } },
    });
  }

  function toggleLock() {
    if (index < 0) return;
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

  function requestDelete(event: { target: EventTarget | null; preventDefault: () => void; stopPropagation: () => void }) {
    const target = event.target as HTMLElement | null;
    const button = target?.closest("button, [role='button']") as HTMLElement | null;
    if (!button) return;
    const text = `${button.getAttribute("title") || ""} ${button.getAttribute("aria-label") || ""} ${button.textContent || ""}`;
    if (!/remover|delete/i.test(text)) return;
    event.preventDefault();
    event.stopPropagation();
    if (locked || index < 0) return;
    void (async () => {
      const ok = await confirm({
        title: "Remover este bloco?",
        description: selectedItem
          ? `O bloco ${selectedItem.type} será removido do rascunho. Você pode desfazer em seguida se precisar.`
          : "O bloco selecionado será removido do rascunho.",
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
    })();
  }

  return (
    <div
      className="studio-action-bar flex items-center gap-0.5 rounded-md border border-[var(--studio-line)] bg-white px-1 py-0.5 shadow-sm"
      onClickCapture={requestDelete}
    >
      {parentAction}
      {label ? (
        <span className="max-w-[7rem] truncate px-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          {label}
        </span>
      ) : null}
      <span className="mx-0.5 h-4 w-px bg-[var(--studio-line)]" aria-hidden />
      <ActionButton title="Subir" disabled={!canMoveUp} onClick={() => move(-1)}>
        ↑
      </ActionButton>
      <ActionButton title="Descer" disabled={!canMoveDown} onClick={() => move(1)}>
        ↓
      </ActionButton>
      <ActionButton title={locked ? "Destravar" : "Travar"} onClick={toggleLock} active={locked}>
        {locked ? "Soltar" : "Travar"}
      </ActionButton>
      <span className="mx-0.5 h-4 w-px bg-[var(--studio-line)]" aria-hidden />
      <div className={cn("flex items-center gap-0.5", locked && "pointer-events-none opacity-40")}>{children}</div>
    </div>
  );
}

function ActionButton({
  title,
  disabled,
  active,
  onClick,
  children,
}: {
  title: string;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs text-[var(--studio-ink)] disabled:opacity-35",
        active ? "bg-[var(--studio-ink)] text-[var(--studio-bg)]" : "hover:bg-black/5",
      )}
    >
      {children}
    </button>
  );
}
