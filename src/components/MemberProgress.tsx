import type { GroupMemberInfo } from "@/lib/apiClient";

export function MemberProgress({ members }: { members: GroupMemberInfo[] }) {
  return (
    <div className="flex flex-col gap-2">
      {members.map((m) => (
        <div
          key={m.userId}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
        >
          <span className="text-2xl">{m.emoji}</span>
          <span className="flex-1 font-semibold">
            {m.name}
            {m.isCreator && <span className="ml-2 text-xs font-medium text-muted">Creator</span>}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              m.status === "COMPLETE" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
            }`}
          >
            {m.status === "COMPLETE" ? "✓ Complete" : "Waiting"}
          </span>
        </div>
      ))}
    </div>
  );
}
