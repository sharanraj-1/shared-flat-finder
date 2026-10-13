import type { PreferenceCard, Priority } from "./preferenceDeck";
import type { BudgetValue, ChoiceValue, CommuteValue } from "./types";
import type { StoredPreferenceDTO } from "./apiClient";

export interface ProfileLine {
  cardId: string;
  text: string;
}

export type ProfileSummary = Record<Priority, ProfileLine[]>;

export function buildProfileSummary(deck: PreferenceCard[], preferences: StoredPreferenceDTO[]): ProfileSummary {
  const summary: ProfileSummary = { DEALBREAKER: [], MUST_HAVE: [], PREFER: [], NICE: [] };
  const deckById = new Map(deck.map((c) => [c.id, c]));

  for (const pref of preferences) {
    const card = deckById.get(pref.requirement);
    if (!card) continue;
    const text = describe(card, pref);
    if (text) summary[pref.priority].push({ cardId: card.id, text });
  }

  return summary;
}

function describe(card: PreferenceCard, pref: StoredPreferenceDTO): string | null {
  switch (card.kind) {
    case "priority":
      return card.label;
    case "location":
      return card.area;
    case "choice": {
      const value = pref.value as ChoiceValue | null;
      const choice = card.choices.find((c) => c.value === value?.choice);
      return choice ? choice.label : card.label;
    }
    case "budget": {
      const value = pref.value as BudgetValue | null;
      if (!value) return null;
      return `Up to ₹${value.max.toLocaleString("en-IN")}/month (comfortable ₹${value.comfortable.toLocaleString("en-IN")})`;
    }
    case "commute": {
      const value = pref.value as CommuteValue | null;
      if (!value) return null;
      const dest = card.commuteKey === "family" ? "family" : "work";
      return card.mode === "max"
        ? `Max ${value.minutes} min from ${dest}`
        : `Ideally ${value.minutes} min to ${dest}`;
    }
    default:
      return null;
  }
}
