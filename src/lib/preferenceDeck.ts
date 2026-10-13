// The full set of swipeable preference cards (spec section 9) plus the
// 4-tier priority system (spec section 10). Cards are plain data so the
// swipe UI and the matching engine both read the same source of truth.

export type Priority = "DEALBREAKER" | "MUST_HAVE" | "PREFER" | "NICE";

export const PRIORITY_META: Record<
  Priority,
  { label: string; emoji: string; color: string }
> = {
  DEALBREAKER: { label: "Dealbreaker", emoji: "❌", color: "#ef4444" },
  MUST_HAVE: { label: "Must Have", emoji: "❤️", color: "#ec4899" },
  PREFER: { label: "Prefer", emoji: "👍", color: "#22c55e" },
  NICE: { label: "Don't Care", emoji: "👎", color: "#94a3b8" },
};

// Order these are presented as swipe actions, left-to-right on the card.
export const PRIORITY_ORDER: Priority[] = [
  "DEALBREAKER",
  "NICE",
  "PREFER",
  "MUST_HAVE",
];

export type Category = "BUDGET" | "LOCATION" | "COMMUTE" | "APARTMENT" | "LIFESTYLE";

export const CATEGORY_META: Record<Category, { label: string; blurb: string }> = {
  BUDGET: { label: "Budget", blurb: "What you're comfortable paying" },
  LOCATION: { label: "Location", blurb: "Where you actually want to live" },
  COMMUTE: { label: "Commute", blurb: "Getting to the places that matter" },
  APARTMENT: { label: "Apartment", blurb: "The home itself" },
  LIFESTYLE: { label: "Lifestyle", blurb: "How you want to live day to day" },
};

interface BaseCard {
  id: string;
  category: Category;
  label: string;
  question: string;
}

export interface PriorityCard extends BaseCard {
  kind: "priority";
  // boolean listing field, or an amenity tag living in Listing.amenities
  matchField: string;
  matchType: "boolean" | "amenity";
}

export interface ChoiceCard extends BaseCard {
  kind: "choice";
  matchField: "bedrooms" | "bathrooms" | "furnished" | "floor";
  choices: { value: string; label: string }[];
}

export interface LocationCard extends BaseCard {
  kind: "location";
  area: string;
}

export interface BudgetCard extends BaseCard {
  kind: "budget";
}

export interface CommuteCard extends BaseCard {
  kind: "commute";
  commuteKey: "work" | "family";
  mode: "max" | "preferred";
}

export type PreferenceCard =
  | PriorityCard
  | ChoiceCard
  | LocationCard
  | BudgetCard
  | CommuteCard;

// Demo scope is Bengaluru. Extending to other cities just means adding
// another entry here.
export const CITY_AREAS: Record<string, string[]> = {
  Bengaluru: [
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
  ],
  Pune: ["Baner", "Kothrud", "Hinjewadi", "Wakad", "Viman Nagar", "Aundh"],
};

export function getAreasForCity(city: string): string[] {
  return CITY_AREAS[city] ?? ["Central", "North", "South", "East", "West"];
}

export function buildPreferenceDeck(city: string): PreferenceCard[] {
  const areas = getAreasForCity(city);

  const budget: BudgetCard = {
    id: "budget",
    category: "BUDGET",
    label: "Monthly Budget",
    question: "What's the maximum monthly contribution you're comfortable paying?",
    kind: "budget",
  };

  const locations: LocationCard[] = areas.map((area) => ({
    id: `location-${area.toLowerCase().replace(/\s+/g, "-")}`,
    category: "LOCATION",
    label: area,
    question: `How do you feel about living in ${area}?`,
    kind: "location",
    area,
  }));

  const commute: CommuteCard[] = [
    {
      id: "commute-max",
      category: "COMMUTE",
      label: "Maximum Commute",
      question: "What's the longest commute to work you'd accept?",
      kind: "commute",
      commuteKey: "work",
      mode: "max",
    },
    {
      id: "commute-preferred",
      category: "COMMUTE",
      label: "Ideal Commute",
      question: "What commute to work would feel effortless?",
      kind: "commute",
      commuteKey: "work",
      mode: "preferred",
    },
  ];

  const apartment: (PriorityCard | ChoiceCard)[] = [
    {
      id: "bedrooms",
      category: "APARTMENT",
      label: "Bedrooms",
      question: "How many bedrooms do you need?",
      kind: "choice",
      matchField: "bedrooms",
      choices: [
        { value: "2", label: "2 Bedrooms" },
        { value: "3", label: "3 Bedrooms" },
        { value: "4", label: "4 Bedrooms" },
      ],
    },
    {
      id: "bathrooms",
      category: "APARTMENT",
      label: "Bathrooms",
      question: "How many bathrooms do you need?",
      kind: "choice",
      matchField: "bathrooms",
      choices: [
        { value: "1", label: "1 Bathroom" },
        { value: "2", label: "2 Bathrooms" },
        { value: "3", label: "3+ Bathrooms" },
      ],
    },
    {
      id: "lift",
      category: "APARTMENT",
      label: "Lift",
      question: "How important is a lift in the building?",
      kind: "priority",
      matchField: "hasLift",
      matchType: "boolean",
    },
    {
      id: "parking",
      category: "APARTMENT",
      label: "Parking",
      question: "How important is dedicated parking?",
      kind: "priority",
      matchField: "parking",
      matchType: "boolean",
    },
    {
      id: "balcony",
      category: "APARTMENT",
      label: "Balcony",
      question: "How important is having a balcony?",
      kind: "priority",
      matchField: "balcony",
      matchType: "boolean",
    },
    {
      id: "furnished",
      category: "APARTMENT",
      label: "Furnishing",
      question: "What level of furnishing do you want?",
      kind: "choice",
      matchField: "furnished",
      choices: [
        { value: "furnished", label: "Furnished" },
        { value: "semi", label: "Semi-furnished" },
        { value: "unfurnished", label: "Unfurnished" },
      ],
    },
    {
      id: "floor",
      category: "APARTMENT",
      label: "Floor",
      question: "Any floor preference?",
      kind: "choice",
      matchField: "floor",
      choices: [
        { value: "low", label: "Ground - 3rd floor" },
        { value: "mid", label: "4th - 7th floor" },
        { value: "high", label: "8th floor or higher" },
      ],
    },
    {
      id: "pet-friendly",
      category: "APARTMENT",
      label: "Pet Friendly",
      question: "How important is a pet-friendly building?",
      kind: "priority",
      matchField: "petFriendly",
      matchType: "boolean",
    },
    {
      id: "security",
      category: "APARTMENT",
      label: "Security",
      question: "How important is 24x7 security?",
      kind: "priority",
      matchField: "security",
      matchType: "boolean",
    },
    {
      id: "power-backup",
      category: "APARTMENT",
      label: "Power Backup",
      question: "How important is power backup?",
      kind: "priority",
      matchField: "powerBackup",
      matchType: "boolean",
    },
    {
      id: "gated-society",
      category: "APARTMENT",
      label: "Gated Society",
      question: "How important is a gated society?",
      kind: "priority",
      matchField: "gatedSociety",
      matchType: "boolean",
    },
  ];

  const familyCommute: CommuteCard = {
    id: "commute-family",
    category: "COMMUTE",
    label: "Close to Family",
    question: "What's the longest you'd want to be from family?",
    kind: "commute",
    commuteKey: "family",
    mode: "max",
  };

  const lifestyle: PriorityCard[] = [
    {
      id: "quiet-neighborhood",
      category: "LIFESTYLE",
      label: "Quiet Neighborhood",
      question: "How important is a quiet neighborhood?",
      kind: "priority",
      matchField: "quiet_neighborhood",
      matchType: "amenity",
    },
    {
      id: "guests-friendly",
      category: "LIFESTYLE",
      label: "Guest Friendly",
      question: "How important is it that the building welcomes guests easily?",
      kind: "priority",
      matchField: "guests_friendly",
      matchType: "amenity",
    },
    {
      id: "restaurants-nearby",
      category: "LIFESTYLE",
      label: "Restaurants Nearby",
      question: "How important are restaurants/cafes nearby?",
      kind: "priority",
      matchField: "restaurants_nearby",
      matchType: "amenity",
    },
    {
      id: "public-transport",
      category: "LIFESTYLE",
      label: "Public Transport",
      question: "How important is easy access to public transport?",
      kind: "priority",
      matchField: "public_transport",
      matchType: "amenity",
    },
    {
      id: "gym-nearby",
      category: "LIFESTYLE",
      label: "Gym Nearby",
      question: "How important is a gym nearby or in the building?",
      kind: "priority",
      matchField: "gym_nearby",
      matchType: "amenity",
    },
    {
      id: "green-spaces",
      category: "LIFESTYLE",
      label: "Green Spaces",
      question: "How important are parks or green spaces nearby?",
      kind: "priority",
      matchField: "green_spaces",
      matchType: "amenity",
    },
    {
      id: "natural-light",
      category: "LIFESTYLE",
      label: "Natural Light",
      question: "How important is plenty of natural light?",
      kind: "priority",
      matchField: "natural_light",
      matchType: "amenity",
    },
    {
      id: "storage",
      category: "LIFESTYLE",
      label: "Storage",
      question: "How important is having good storage space?",
      kind: "priority",
      matchField: "storage",
      matchType: "amenity",
    },
  ];

  return [budget, ...locations, ...commute, familyCommute, ...apartment, ...lifestyle];
}
