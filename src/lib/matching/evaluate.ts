import type { PreferenceCard } from "../preferenceDeck";
import type {
  BudgetValue,
  ChoiceValue,
  CommuteValue,
  ListingRecord,
  StoredPreference,
} from "../types";

export type EvaluationStatus =
  | "excluded" // hard dealbreaker violated — listing should not be shown at all
  | "satisfied" // fully meets the requirement
  | "partial" // meets it with some compromise
  | "unsatisfied" // does not meet a non-dealbreaker requirement
  | "not-applicable"; // this card doesn't apply to this listing (e.g. a different area)

export interface EvaluationResult {
  cardId: string;
  label: string;
  status: EvaluationStatus;
  note: string;
}

function bucketFloor(floor: number): "low" | "mid" | "high" {
  if (floor <= 3) return "low";
  if (floor <= 7) return "mid";
  return "high";
}

function bathroomMatches(choice: string, actual: number): boolean {
  if (choice === "3") return actual >= 3;
  return actual === Number(choice);
}

export function evaluateCard(
  card: PreferenceCard,
  pref: StoredPreference,
  listing: ListingRecord
): EvaluationResult {
  const base = { cardId: card.id, label: card.label };

  switch (card.kind) {
    case "priority": {
      const has =
        card.matchType === "boolean"
          ? Boolean((listing as unknown as Record<string, unknown>)[card.matchField])
          : listing.amenities.includes(card.matchField);

      if (has) {
        return { ...base, status: "satisfied", note: `${card.label} available` };
      }
      if (pref.priority === "DEALBREAKER") {
        return { ...base, status: "excluded", note: `Missing ${card.label.toLowerCase()}` };
      }
      return { ...base, status: "unsatisfied", note: `No ${card.label.toLowerCase()}` };
    }

    case "choice": {
      const value = pref.value as ChoiceValue | null;
      if (!value) return { ...base, status: "not-applicable", note: "No preference set" };

      let actualMatches: boolean;
      let actualLabel: string;
      if (card.matchField === "bedrooms") {
        actualMatches = String(listing.bedrooms) === value.choice;
        actualLabel = `${listing.bedrooms} bedrooms`;
      } else if (card.matchField === "bathrooms") {
        actualMatches = bathroomMatches(value.choice, listing.bathrooms);
        actualLabel = `${listing.bathrooms} bathrooms`;
      } else if (card.matchField === "furnished") {
        actualMatches = listing.furnished === value.choice;
        actualLabel = listing.furnished;
      } else {
        const bucket = bucketFloor(listing.floor);
        actualMatches = bucket === value.choice;
        actualLabel = `floor ${listing.floor}`;
      }

      if (actualMatches) {
        return { ...base, status: "satisfied", note: `Matches (${actualLabel})` };
      }
      if (pref.priority === "DEALBREAKER") {
        return { ...base, status: "excluded", note: `${card.label} doesn't match (${actualLabel})` };
      }
      return { ...base, status: "unsatisfied", note: `${card.label} is ${actualLabel}, not what you wanted` };
    }

    case "location": {
      if (listing.location !== card.area) {
        return { ...base, status: "not-applicable", note: "Different area" };
      }
      if (pref.priority === "DEALBREAKER") {
        return { ...base, status: "excluded", note: `${card.area} is a dealbreaker area for you` };
      }
      return { ...base, status: "satisfied", note: `In ${card.area}, an area you liked` };
    }

    case "budget": {
      const value = pref.value as BudgetValue | null;
      if (!value) return { ...base, status: "not-applicable", note: "No budget set" };
      if (listing.rent > value.max) {
        return { ...base, status: "excluded", note: `Rent ₹${listing.rent.toLocaleString("en-IN")} exceeds your max ₹${value.max.toLocaleString("en-IN")}` };
      }
      if (listing.rent > value.comfortable) {
        return {
          ...base,
          status: "partial",
          note: `₹${(listing.rent - value.comfortable).toLocaleString("en-IN")} above your comfortable budget`,
        };
      }
      return { ...base, status: "satisfied", note: "Within your comfortable budget" };
    }

    case "commute": {
      const value = pref.value as CommuteValue | null;
      if (!value) return { ...base, status: "not-applicable", note: "No commute limit set" };
      const actual = listing.commuteMinutes[card.commuteKey];
      if (actual === undefined) return { ...base, status: "not-applicable", note: "Commute unknown" };

      if (card.mode === "max") {
        if (actual > value.minutes) {
          return {
            ...base,
            status: "excluded",
            note: `Commute exceeds your ${value.minutes} min limit (${actual} min)`,
          };
        }
        return { ...base, status: "satisfied", note: `${actual} min commute, within your limit` };
      }

      // preferred commute
      if (actual <= value.minutes) {
        return { ...base, status: "satisfied", note: `${actual} min commute, matches your ideal` };
      }
      return {
        ...base,
        status: "partial",
        note: `${actual} min commute, ${actual - value.minutes} min more than ideal`,
      };
    }

    default:
      return { ...base, status: "not-applicable", note: "" };
  }
}
