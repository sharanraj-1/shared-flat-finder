import type { Category, Priority } from "../src/lib/preferenceDeck";

export interface DemoPreferenceInput {
  requirement: string;
  category: Category;
  priority: Priority;
  value?: unknown;
}

// Matches the exact scenario in master prompt section 33. Every card in the
// deck gets a value so the matching engine has a complete picture for each
// person — the ones the spec calls out explicitly use the stated priority;
// everything else gets a plausible default for a young professional in Pune.

function budget(comfortable: number, max: number): DemoPreferenceInput {
  return { requirement: "budget", category: "BUDGET", priority: "MUST_HAVE", value: { comfortable, max } };
}

function location(area: string, priority: Priority): DemoPreferenceInput {
  const slug = `location-${area.toLowerCase().replace(/\s+/g, "-")}`;
  return { requirement: slug, category: "LOCATION", priority };
}

function commute(id: "commute-max" | "commute-preferred", minutes: number): DemoPreferenceInput {
  return { requirement: id, category: "COMMUTE", priority: "MUST_HAVE", value: { minutes } };
}

function priorityCard(requirement: string, category: Category, priority: Priority): DemoPreferenceInput {
  return { requirement, category, priority };
}

function choiceCard(requirement: string, choice: string, priority: Priority): DemoPreferenceInput {
  return { requirement, category: "APARTMENT", priority, value: { choice } };
}

export const RIYA_PREFERENCES: DemoPreferenceInput[] = [
  budget(22000, 25000),
  location("Baner", "MUST_HAVE"),
  location("Kothrud", "MUST_HAVE"),
  location("Hinjewadi", "NICE"),
  location("Wakad", "NICE"),
  location("Viman Nagar", "NICE"),
  location("Aundh", "NICE"),
  commute("commute-max", 40),
  commute("commute-preferred", 25),
  priorityCard("commute-family", "COMMUTE", "MUST_HAVE"),
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
  budget(22000, 25000),
  location("Baner", "MUST_HAVE"),
  location("Kothrud", "MUST_HAVE"),
  location("Hinjewadi", "NICE"),
  location("Wakad", "NICE"),
  location("Viman Nagar", "NICE"),
  location("Aundh", "NICE"),
  commute("commute-max", 45),
  commute("commute-preferred", 30),
  priorityCard("commute-family", "COMMUTE", "NICE"),
  choiceCard("bedrooms", "3", "MUST_HAVE"),
  choiceCard("bathrooms", "2", "MUST_HAVE"),
  priorityCard("lift", "APARTMENT", "DEALBREAKER"),
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
  budget(22000, 25000),
  location("Hinjewadi", "MUST_HAVE"),
  location("Wakad", "MUST_HAVE"),
  location("Baner", "PREFER"),
  location("Kothrud", "NICE"),
  location("Viman Nagar", "NICE"),
  location("Aundh", "NICE"),
  commute("commute-max", 25),
  commute("commute-preferred", 15),
  priorityCard("commute-family", "COMMUTE", "NICE"),
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
