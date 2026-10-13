import type { Priority } from "./preferenceDeck";

// Convenience shapes layered on top of the raw Prisma rows: JSON columns
// (amenities, commuteMinutes, preference value) parsed into real objects.

export interface ListingRecord {
  id: string;
  title: string;
  location: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  hasLift: boolean;
  parking: boolean;
  balcony: boolean;
  petFriendly: boolean;
  furnished: "furnished" | "semi" | "unfurnished";
  gatedSociety: boolean;
  powerBackup: boolean;
  waterSupply: string;
  security: boolean;
  amenities: string[];
  image: string;
  source: string;
  availability: string;
  commuteMinutes: Record<string, number>;
  isDemo: boolean;
}

export interface StoredPreference {
  userId: string;
  category: string;
  requirement: string;
  priority: Priority;
  value: unknown;
}

export interface BudgetValue {
  comfortable: number;
  max: number;
}

export interface CommuteValue {
  minutes: number;
}

export interface ChoiceValue {
  choice: string;
}

export interface PersonSummary {
  userId: string;
  name: string;
  emoji: string;
}
