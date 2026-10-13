import { clsx } from "clsx";
import type { DnaBar } from "@/lib/matching/groupDna";

const BUCKET_TONE: Record<DnaBar["bucket"], string> = {
  shared: "bg-success",
  flexible: "bg-warning",
  conflict: "bg-danger",
};

export function DnaBarRow({ bar }: { bar: DnaBar }) {
  const pct = (bar.agreeCount / bar.total) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-sm font-semibold">{bar.label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted-bg">
        <div className={clsx("h-full rounded-full", BUCKET_TONE[bar.bucket])} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-bold text-muted">
        {bar.agreeCount}/{bar.total}
      </span>
    </div>
  );
}
