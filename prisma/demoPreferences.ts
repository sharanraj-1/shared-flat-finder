import type { Category, Priority } from "../src/lib/preferenceDeck";

export interface DemoPreferenceInput {
  requirement: string;
  category: Category;
  priority: Priority;
  value?: unknown;
}

// Bengaluru scenario, refined from the case study:
// - Riya has a firm "20-minute rule" for family (and wants a gym nearby).
// - Meera's lift requirement is a genuine dealbreaker (a knee problem, not
//   a preference) — that one stays hard even though budget/commute numbers
//   are given some slack elsewhere.
// - Kavita has a tight commute limit to her office in the Whitefield /
//   Electronic City corridor and cares about parking.
// Every card in the deck gets a value so the matching engine has a
// complete picture for each person.

function budget(comfortable: number, max: number): DemoPreferenceInput {
  return { requirement: "budget", category: "BUDGET", priority: "MUST_HAVE", value: { comfortable, max } };
}

function location(area: string, priority: Priority): DemoPreferenceInput {
  const slug = `location-${area.toLowerCase().replace(/\s+/g, "-")}`;
  return { requirement: slug, category: "LOCATION", priority };
}

function commute(id: "commute-max" | "commute-preferred" | "commute-family", minutes: number): DemoPreferenceInput {
  return { requirement: id, category: "COMMUTE", priority: "MUST_HAVE", value: { minutes } };
}

function priorityCard(requirement: string, category: Category, priority: Priority): DemoPreferenceInput {
  return { requirement, category, priority };
}

function choiceCard(requirement: string, choice: string, priority: Priority): DemoPreferenceInput {
  return { requirement, category: "APARTMENT", priority, value: { choice } };
}

const ALL_AREAS = [
  "Koramangala",
  "Indiranagar",
  "HSR Layout",
  "Whitefield",
  "Electronic City",
  "Marathahalli",
  "Jayanagar",
  "JP Nagar",
  "Bellandur",
  "Sarjapur Road",
  "Hebbal",
  "Yelahanka",
];

function locationsFor(loved: string[], liked: string[] = []): DemoPreferenceInput[] {
  return ALL_AREAS.map((area) => {
    if (loved.includes(area)) return location(area, "MUST_HAVE");
    if (liked.includes(area)) return location(area, "PREFER");
    return location(area, "NICE");
  });
}

export const RIYA_PREFERENCES: DemoPreferenceInput[] = [
  budget(35000, 42000),
  ...locationsFor(["Koramangala", "Indiranagar"], ["HSR Layout"]),
  commute("commute-max", 40),
  commute("commute-preferred", 25),
  commute("commute-family", 20), // her twenty-minute rule
  choiceCard("bedrooms", "3", "MUST_HAVE"),
  choiceCard("bathrooms", "2", "PREFER"),
  priorityCard("lift", "APARTMENT", "MUST_HAVE"),
  priorityCard("parking", "APARTMENT", "PREFER"),
  priorityCard("balcony", "APARTMENT", "PREFER"),
  choiceCard("furnished", "semi", "PREFER"),
  choiceCard("floor", "mid", "NICE"),
  priorityCard("pet-friendly", "APARTMENT", "NICE"),
  priorityCard("security", "APARTMENT", "PREFER"),
  priorityCard("power-backup", "APARTMENT", "PREFER"),
  priorityCard("gated-society", "APARTMENT", "PREFER"),
  priorityCard("quiet-neighborhood", "LIFESTYLE", "NICE"),
  priorityCard("guests-friendly", "LIFESTYLE", "NICE"),
  priorityCard("restaurants-nearby", "LIFESTYLE", "PREFER"),
  priorityCard("public-transport", "LIFESTYLE", "PREFER"),
  priorityCard("gym-nearby", "LIFESTYLE", "MUST_HAVE"),
  priorityCard("green-spaces", "LIFESTYLE", "NICE"),
  priorityCard("natural-light", "LIFESTYLE", "PREFER"),
  priorityCard("storage", "LIFESTYLE", "NICE"),
];

export const MEERA_PREFERENCES: DemoPreferenceInput[] = [
  budget(35000, 42000),
  ...locationsFor(["Koramangala", "Indiranagar"], ["HSR Layout"]),
  commute("commute-max", 45),
  commute("commute-preferred", 30),
  commute("commute-family", 30),
  choiceCard("bedrooms", "3", "MUST_HAVE"),
  choiceCard("bathrooms", "2", "MUST_HAVE"),
  priorityCard("lift", "APARTMENT", "DEALBREAKER"), // a knee problem, not a preference
  priorityCard("parking", "APARTMENT", "NICE"),
  priorityCard("balcony", "APARTMENT", "PREFER"),
  choiceCard("furnished", "semi", "PREFER"),
  choiceCard("floor", "mid", "NICE"),
  priorityCard("pet-friendly", "APARTMENT", "NICE"),
  priorityCard("security", "APARTMENT", "PREFER"),
  priorityCard("power-backup", "APARTMENT", "PREFER"),
  priorityCard("gated-society", "APARTMENT", "PREFER"),
  priorityCard("quiet-neighborhood", "LIFESTYLE", "PREFER"),
  priorityCard("guests-friendly", "LIFESTYLE", "NICE"),
  priorityCard("restaurants-nearby", "LIFESTYLE", "NICE"),
  priorityCard("public-transport", "LIFESTYLE", "NICE"),
  priorityCard("gym-nearby", "LIFESTYLE", "NICE"),
  priorityCard("green-spaces", "LIFESTYLE", "NICE"),
  priorityCard("natural-light", "LIFESTYLE", "PREFER"),
  priorityCard("storage", "LIFESTYLE", "PREFER"),
];

export const KAVITA_PREFERENCES: DemoPreferenceInput[] = [
  budget(35000, 42000),
  ...locationsFor(["Whitefield", "Electronic City"], ["Koramangala"]),
  commute("commute-max", 25), // tight limit to her office
  commute("commute-preferred", 15),
  commute("commute-family", 40),
  choiceCard("bedrooms", "3", "MUST_HAVE"),
  choiceCard("bathrooms", "2", "PREFER"),
  priorityCard("lift", "APARTMENT", "PREFER"),
  priorityCard("parking", "APARTMENT", "MUST_HAVE"),
  priorityCard("balcony", "APARTMENT", "NICE"),
  choiceCard("furnished", "semi", "NICE"),
  choiceCard("floor", "mid", "NICE"),
  priorityCard("pet-friendly", "APARTMENT", "NICE"),
  priorityCard("security", "APARTMENT", "PREFER"),
  priorityCard("power-backup", "APARTMENT", "PREFER"),
  priorityCard("gated-society", "APARTMENT", "PREFER"),
  priorityCard("quiet-neighborhood", "LIFESTYLE", "NICE"),
  priorityCard("guests-friendly", "LIFESTYLE", "NICE"),
  priorityCard("restaurants-nearby", "LIFESTYLE", "PREFER"),
  priorityCard("public-transport", "LIFESTYLE", "PREFER"),
  priorityCard("gym-nearby", "LIFESTYLE", "PREFER"),
  priorityCard("green-spaces", "LIFESTYLE", "NICE"),
  priorityCard("natural-light", "LIFESTYLE", "NICE"),
  priorityCard("storage", "LIFESTYLE", "NICE"),
];
