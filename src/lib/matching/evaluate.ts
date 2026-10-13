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

// "Matching can be a little relaxed": numeric hard ceilings (budget max,
// commute max) get a small grace window before they actually exclude a
// listing, instead of a razor's-edge cutoff. Boolean/choice/location
// dealbreakers stay hard — those are the ones the spec explicitly wants
// enforced (e.g. "no lift = dealbreaker" should still exclude).
const BUDGET_MAX_GRACE = 0.18; // 18% over max still shown, as a compromise
const COMMUTE_MAX_GRACE_MINUTES = 15; // up to 15 min over the limit still shown

export interface EvaluationContext {
  // Listing.rent is the whole apartment's rent; each person's budget cards
  // are about their own monthly contribution, so we split it by group size.
  groupSize: number;
}

export function evaluateCard(
  card: PreferenceCard,
  pref: StoredPreference,
  listing: ListingRecord,
  context: EvaluationContext = { groupSize: 1 }
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
      const share = Math.round(listing.rent / Math.max(context.groupSize, 1));
      const graceMax = value.max * (1 + BUDGET_MAX_GRACE);
      if (share > graceMax) {
        return { ...base, status: "excluded", note: `Your share ₹${share.toLocaleString("en-IN")} exceeds your max ₹${value.max.toLocaleString("en-IN")}` };
      }
      if (share > value.comfortable) {
        return {
          ...base,
          status: "partial",
          note: `₹${(share - value.comfortable).toLocaleString("en-IN")} above your comfortable budget`,
        };
      }
      return { ...base, status: "satisfied", note: "Within your comfortable budget" };
    }

    case "commute": {
      const value = pref.value as CommuteValue | null;
      if (!value) return { ...base, status: "not-applicable", note: "No commute limit set" };
      const actual = listing.commuteMinutes[card.commuteKey];
      if (actual === undefined) return { ...base, status: "not-applicable", note: "Commute unknown" };
      const dest = card.commuteKey === "family" ? "family" : "work";

      if (card.mode === "max") {
        if (actual > value.minutes + COMMUTE_MAX_GRACE_MINUTES) {
          return {
            ...base,
            status: "excluded",
            note: `${actual} min from ${dest} exceeds your ${value.minutes} min limit`,
          };
        }
        if (actual > value.minutes) {
          return {
            ...base,
            status: "partial",
            note: `${actual} min from ${dest}, ${actual - value.minutes} min over your limit`,
          };
        }
        return { ...base, status: "satisfied", note: `${actual} min from ${dest}, within your limit` };
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
