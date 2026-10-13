import type { ProfileSummary } from "@/lib/profileSummary";
import type { Priority } from "@/lib/preferenceDeck";

const SECTIONS: { priority: Priority; title: string; emoji: string; tone: string }[] = [
  { priority: "DEALBREAKER", title: "Dealbreakers", emoji: "❌", tone: "border-danger/30 bg-danger-soft text-danger" },
  { priority: "MUST_HAVE", title: "Must Have", emoji: "❤️", tone: "border-brand/30 bg-brand-soft text-brand" },
  { priority: "PREFER", title: "Prefer", emoji: "👍", tone: "border-success/30 bg-success-soft text-success" },
  { priority: "NICE", title: "Nice to Have", emoji: "👎", tone: "border-border bg-muted-bg text-muted" },
];

export function ProfileSummaryView({
  summary,
  onEditCard,
}: {
  summary: ProfileSummary;
  onEditCard?: (cardId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {SECTIONS.map((section) => {
        const lines = summary[section.priority];
        if (lines.length === 0) return null;
        return (
          <div key={section.priority}>
            <p className="mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-foreground">
              <span>{section.emoji}</span> {section.title}
            </p>
            <div className="flex flex-wrap gap-2">
              {lines.map((line) => (
                <button
                  key={line.cardId}
                  onClick={() => onEditCard?.(line.cardId)}
                  disabled={!onEditCard}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${section.tone} ${
                    onEditCard ? "cursor-pointer hover:brightness-95" : "cursor-default"
                  }`}
                >
                  {line.text}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
