import { clsx } from "clsx";
import { PRIORITY_ORDER, type Priority } from "@/lib/preferenceDeck";

const LOCATION_LABELS: Record<Priority, { emoji: string; label: string }> = {
  DEALBREAKER: { emoji: "❌", label: "Never" },
  NICE: { emoji: "👎", label: "Not preferred" },
  PREFER: { emoji: "👍", label: "Would consider" },
  MUST_HAVE: { emoji: "❤️", label: "Love" },
};

const GENERIC_LABELS: Record<Priority, { emoji: string; label: string }> = {
  DEALBREAKER: { emoji: "❌", label: "Dealbreaker" },
  NICE: { emoji: "👎", label: "Don't Care" },
  PREFER: { emoji: "👍", label: "Prefer" },
  MUST_HAVE: { emoji: "❤️", label: "Must Have" },
};

export function PriorityChips({
  variant,
  onPick,
}: {
  variant: "generic" | "location";
  onPick: (priority: Priority) => void;
}) {
  const labels = variant === "location" ? LOCATION_LABELS : GENERIC_LABELS;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {PRIORITY_ORDER.map((p) => (
        <button
          key={p}
          onClick={() => onPick(p)}
          className={clsx(
            "flex flex-col items-center gap-1 rounded-2xl border-2 px-3 py-3.5 transition active:scale-95",
            p === "DEALBREAKER" && "border-danger/30 bg-danger-soft text-danger hover:border-danger",
            p === "NICE" && "border-border bg-muted-bg text-muted hover:border-muted",
            p === "PREFER" && "border-success/30 bg-success-soft text-success hover:border-success",
            p === "MUST_HAVE" && "border-brand/30 bg-brand-soft text-brand hover:border-brand"
          )}
        >
          <span className="text-2xl">{labels[p].emoji}</span>
          <span className="text-xs font-bold">{labels[p].label}</span>
        </button>
      ))}
    </div>
  );
}
