import type { LabelDTO } from "@/lib/data/types";

export function LabelChips({
  ids,
  labelById,
}: {
  ids?: string[];
  labelById: Map<string, LabelDTO>;
}) {
  if (!ids || ids.length === 0) return null;
  const chips = ids
    .map((id) => labelById.get(id))
    .filter((l): l is LabelDTO => Boolean(l));
  if (chips.length === 0) return null;

  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {chips.map((l) => (
        <span
          key={l.id}
          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
          style={{ backgroundColor: l.color }}
        >
          {l.name}
        </span>
      ))}
    </span>
  );
}
