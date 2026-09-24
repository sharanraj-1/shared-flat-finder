import type { Priority, PreferenceCard } from "../preferenceDeck";
import type { ListingRecord, PersonSummary, StoredPreference } from "../types";
import { evaluateCard, type EvaluationResult } from "./evaluate";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  DEALBREAKER: 0, // never reaches scoring — it already excludes the listing
  MUST_HAVE: 3,
  PREFER: 2,
  NICE: 1,
};

const STATUS_FRACTION: Record<string, number> = {
  satisfied: 1,
  partial: 0.5,
  unsatisfied: 0,
};

export interface UserListingEvaluation {
  person: PersonSummary;
  score: number; // 0-100 compatibility for this person
  results: EvaluationResult[];
  gets: EvaluationResult[];
  compromises: EvaluationResult[];
}

export interface ExclusionReason {
  person: PersonSummary;
  note: string;
}

export interface ListingMatchResult {
  listing: ListingRecord;
  excluded: boolean;
  exclusionReasons: ExclusionReason[];
  perUser: UserListingEvaluation[];
  groupScore: number;
  sharedRequirementCount: number;
  compromiseCount: number;
}

export interface MemberPreferences {
  person: PersonSummary;
  preferences: StoredPreference[];
}

function evaluateAllCards(
  deck: PreferenceCard[],
  preferences: StoredPreference[],
  listing: ListingRecord
): EvaluationResult[] {
  const byCardId = new Map(preferences.map((p) => [p.requirement === undefined ? "" : cardIdFor(p), p]));
  const results: EvaluationResult[] = [];
  for (const card of deck) {
    const pref = byCardId.get(card.id);
    if (!pref) continue;
    results.push(evaluateCard(card, pref, listing));
  }
  return results;
}

// Preferences are stored keyed by (category, requirement); card.id doubles as
// the requirement string for every card kind used in this deck.
function cardIdFor(pref: StoredPreference): string {
  return pref.requirement;
}

export function matchListingForGroup(
  listing: ListingRecord,
  deck: PreferenceCard[],
  members: MemberPreferences[]
): ListingMatchResult {
  const exclusionReasons: ExclusionReason[] = [];
  const perMemberResults: { person: PersonSummary; results: EvaluationResult[] }[] = [];

  for (const member of members) {
    const results = evaluateAllCards(deck, member.preferences, listing);
    perMemberResults.push({ person: member.person, results });
    for (const r of results) {
      if (r.status === "excluded") {
        exclusionReasons.push({ person: member.person, note: r.note });
      }
    }
  }

  const excluded = exclusionReasons.length > 0;

  const perUser: UserListingEvaluation[] = perMemberResults.map(({ person, results }) => {
    const prefByCard = new Map(
      members.find((m) => m.person.userId === person.userId)!.preferences.map((p) => [p.requirement, p])
    );

    let weightSum = 0;
    let scoreSum = 0;
    const gets: EvaluationResult[] = [];
    const compromises: EvaluationResult[] = [];

    for (const r of results) {
      if (r.status === "not-applicable" || r.status === "excluded") continue;
      const pref = prefByCard.get(r.cardId);
      const weight = pref ? PRIORITY_WEIGHT[pref.priority] || 1 : 1;
      const fraction = STATUS_FRACTION[r.status] ?? 0;
      weightSum += weight;
      scoreSum += weight * fraction;

      if (r.status === "satisfied" && pref && pref.priority !== "NICE") {
        gets.push(r);
      }
      if (
        r.status === "partial" ||
        (r.status === "unsatisfied" && pref && pref.priority !== "NICE")
      ) {
        compromises.push(r);
      }
    }

    const score = weightSum === 0 ? 100 : Math.round((scoreSum / weightSum) * 100);
    return { person, score, results, gets, compromises };
  });

  const groupScore = excluded
    ? 0
    : Math.round(perUser.reduce((sum, u) => sum + u.score, 0) / Math.max(perUser.length, 1));

  const cardIds = new Set(deck.map((c) => c.id));
  let sharedRequirementCount = 0;
  for (const cardId of cardIds) {
    const allSatisfied =
      perMemberResults.length > 0 &&
      perMemberResults.every((m) => {
        const r = m.results.find((res) => res.cardId === cardId);
        return r ? r.status === "satisfied" : false;
      });
    if (allSatisfied) sharedRequirementCount += 1;
  }

  const compromiseCount = perUser.reduce((sum, u) => sum + u.compromises.length, 0);

  return {
    listing,
    excluded,
    exclusionReasons,
    perUser,
    groupScore,
    sharedRequirementCount,
    compromiseCount,
  };
}

export function matchListingsForGroup(
  listings: ListingRecord[],
  deck: PreferenceCard[],
  members: MemberPreferences[]
): ListingMatchResult[] {
  return listings
    .map((listing) => matchListingForGroup(listing, deck, members))
    .sort((a, b) => {
      if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
      return b.groupScore - a.groupScore;
    });
}
