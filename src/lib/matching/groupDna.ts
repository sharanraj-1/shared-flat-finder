import type { PreferenceCard, Priority } from "../preferenceDeck";
import type { BudgetValue, PersonSummary, StoredPreference } from "../types";
import type { MemberPreferences } from "./listingMatch";

export interface DnaBar {
  cardId: string;
  label: string;
  category: string;
  agreeCount: number;
  total: number;
  bucket: "shared" | "flexible" | "conflict";
}

export interface LocationConflict {
  hasConflict: boolean;
  perPerson: { person: PersonSummary; topArea: string | null }[];
}

export interface BudgetDna {
  groupComfortable: number;
  groupMax: number;
  perPerson: { person: PersonSummary; comfortable: number; max: number }[];
}

export interface GroupHomeDna {
  bars: DnaBar[];
  shared: DnaBar[];
  flexible: DnaBar[];
  conflicts: DnaBar[];
  locationConflict: LocationConflict;
  budget: BudgetDna | null;
}

const STRONG_WANT: Priority[] = ["DEALBREAKER", "MUST_HAVE"];

export function buildGroupHomeDna(deck: PreferenceCard[], members: MemberPreferences[]): GroupHomeDna {
  const total = members.length;
  const bars: DnaBar[] = [];

  for (const card of deck) {
    if (card.kind === "budget" || card.kind === "commute") continue;

    let agreeCount = 0;
    for (const member of members) {
      const pref = member.preferences.find((p) => p.requirement === card.id);
      if (pref && STRONG_WANT.includes(pref.priority)) agreeCount += 1;
    }

    if (agreeCount === 0) continue; // nobody cares strongly — not part of the group's DNA

    let bucket: DnaBar["bucket"];
    if (agreeCount === total) bucket = "shared";
    else if (agreeCount >= Math.ceil(total / 2)) bucket = "flexible";
    else bucket = "conflict";

    bars.push({ cardId: card.id, label: card.label, category: card.category, agreeCount, total, bucket });
  }

  // Location conflict: does everyone's top-loved area overlap?
  const locationCards = deck.filter((c) => c.kind === "location");
  const perPerson = members.map((member) => {
    let topArea: string | null = null;
    let topPriorityRank = -1;
    const rank: Record<Priority, number> = { MUST_HAVE: 3, PREFER: 2, NICE: 1, DEALBREAKER: -1 };
    for (const card of locationCards) {
      if (card.kind !== "location") continue;
      const pref = member.preferences.find((p) => p.requirement === card.id);
      if (!pref) continue;
      const r = rank[pref.priority];
      if (r > topPriorityRank) {
        topPriorityRank = r;
        topArea = card.area;
      }
    }
    return { person: member.person, topArea };
  });
  const distinctTopAreas = new Set(perPerson.map((p) => p.topArea).filter(Boolean));
  const locationConflict: LocationConflict = {
    hasConflict: distinctTopAreas.size > 1,
    perPerson,
  };

  // Budget DNA: the group's feasible ceiling is the tightest member's ceiling.
  let budget: BudgetDna | null = null;
  const budgetEntries = members
    .map((member) => {
      const pref = member.preferences.find((p) => p.requirement === "budget");
      const value = pref?.value as BudgetValue | undefined;
      return value ? { person: member.person, comfortable: value.comfortable, max: value.max } : null;
    })
    .filter((v): v is { person: PersonSummary; comfortable: number; max: number } => v !== null);

  if (budgetEntries.length > 0) {
    budget = {
      groupComfortable: Math.min(...budgetEntries.map((b) => b.comfortable)),
      groupMax: Math.min(...budgetEntries.map((b) => b.max)),
      perPerson: budgetEntries,
    };
  }

  return {
    bars,
    shared: bars.filter((b) => b.bucket === "shared"),
    flexible: bars.filter((b) => b.bucket === "flexible"),
    conflicts: bars.filter((b) => b.bucket === "conflict"),
    locationConflict,
    budget,
  };
}

export function isEveryonePreferenceLocked(
  lockedUserIds: Set<string>,
  members: PersonSummary[]
): boolean {
  return members.length > 0 && members.every((m) => lockedUserIds.has(m.userId));
}

export { type StoredPreference };
