// Procedurally generates a large (1000+) set of demo Bengaluru listings.
// A handful of unique AI-generated photos (see scripts/generateImages.mjs)
// are cycled across all listings — generating one unique photo per listing
// isn't practical at this scale, so variety instead comes from ~24 distinct
// exterior/interior shots reused in rotation. All listings are clearly
// marked as demo data (Listing.isDemo / Listing.source).

export interface DemoListingInput {
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
  commuteMinutes: { work: number; family: number };
}

// Deterministic PRNG so reseeding produces the same "random" data every time.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface AreaProfile {
  name: string;
  rent2bhk: [number, number];
  work: [number, number];
  family: [number, number];
}

const AREA_PROFILES: AreaProfile[] = [
  { name: "Koramangala", rent2bhk: [35000, 70000], work: [15, 35], family: [10, 25] },
  { name: "Indiranagar", rent2bhk: [32000, 65000], work: [18, 38], family: [8, 22] },
  { name: "HSR Layout", rent2bhk: [30000, 60000], work: [12, 30], family: [12, 28] },
  { name: "Whitefield", rent2bhk: [25000, 50000], work: [8, 25], family: [30, 55] },
  { name: "Electronic City", rent2bhk: [15000, 32000], work: [8, 22], family: [35, 60] },
  { name: "Marathahalli", rent2bhk: [22000, 45000], work: [12, 28], family: [20, 40] },
  { name: "Jayanagar", rent2bhk: [28000, 55000], work: [25, 45], family: [10, 25] },
  { name: "JP Nagar", rent2bhk: [24000, 48000], work: [22, 42], family: [12, 28] },
  { name: "Bellandur", rent2bhk: [24000, 48000], work: [10, 25], family: [28, 50] },
  { name: "Sarjapur Road", rent2bhk: [20000, 42000], work: [10, 28], family: [25, 48] },
  { name: "Hebbal", rent2bhk: [18000, 38000], work: [25, 50], family: [15, 35] },
  { name: "Yelahanka", rent2bhk: [15000, 30000], work: [30, 55], family: [15, 35] },
];

const BEDROOM_WEIGHTS: [number, number][] = [
  [1, 0.15],
  [2, 0.35],
  [3, 0.35],
  [4, 0.15],
];
const BEDROOM_MULTIPLIER: Record<number, number> = { 1: 0.65, 2: 1, 3: 1.45, 4: 1.9 };
const FURNISH_WEIGHTS: [DemoListingInput["furnished"], number][] = [
  ["furnished", 0.25],
  ["semi", 0.45],
  ["unfurnished", 0.3],
];
const TITLE_WORDS = [
  "Residency",
  "Heights",
  "Enclave",
  "Gardens",
  "Towers",
  "Court",
  "Square",
  "Homes",
  "Vista",
  "Meadows",
  "Greens",
  "Orchid",
  "Palm Residency",
  "Crest",
  "Nest",
];
const AMENITY_TAGS = [
  "gym_nearby",
  "restaurants_nearby",
  "public_transport",
  "natural_light",
  "green_spaces",
  "storage",
  "quiet_neighborhood",
  "guests_friendly",
];

function weightedPick<T>(rand: () => number, weights: [T, number][]): T {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [value, w] of weights) {
    r -= w;
    if (r <= 0) return value;
  }
  return weights[weights.length - 1][0];
}

function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function chance(rand: () => number, p: number): boolean {
  return rand() < p;
}

const IMAGE_POOL_SIZE = 24;

export function generateDemoListings(count: number, seed = 1337): DemoListingInput[] {
  const rand = mulberry32(seed);
  const listings: DemoListingInput[] = [];

  for (let i = 0; i < count; i++) {
    const area = AREA_PROFILES[i % AREA_PROFILES.length];
    const bedrooms = weightedPick(rand, BEDROOM_WEIGHTS);
    const bathrooms = Math.max(1, Math.min(bedrooms, randInt(rand, Math.max(1, bedrooms - 1), bedrooms)));
    const floor = randInt(rand, 1, 20);
    const hasLift = floor <= 3 ? chance(rand, 0.65) : chance(rand, 0.92);

    const baseRent = randInt(rand, area.rent2bhk[0], area.rent2bhk[1]);
    const rent = Math.round((baseRent * BEDROOM_MULTIPLIER[bedrooms]) / 500) * 500;

    const amenities = AMENITY_TAGS.filter(() => chance(rand, 0.45));
    if (amenities.length === 0) amenities.push(AMENITY_TAGS[randInt(rand, 0, AMENITY_TAGS.length - 1)]);

    const imageIndex = (i % IMAGE_POOL_SIZE) + 1;
    const titleWord = TITLE_WORDS[randInt(rand, 0, TITLE_WORDS.length - 1)];

    listings.push({
      title: `${area.name} ${titleWord}`,
      location: area.name,
      rent,
      bedrooms,
      bathrooms,
      floor,
      hasLift,
      parking: chance(rand, 0.75),
      balcony: chance(rand, 0.8),
      petFriendly: chance(rand, 0.55),
      furnished: weightedPick(rand, FURNISH_WEIGHTS),
      gatedSociety: chance(rand, 0.7),
      powerBackup: chance(rand, 0.65),
      waterSupply: chance(rand, 0.7) ? "24x7 supply" : "Borewell + municipal",
      security: chance(rand, 0.65),
      amenities,
      image: `/listings/gen/listing-${String(imageIndex).padStart(3, "0")}.png`,
      commuteMinutes: {
        work: randInt(rand, area.work[0], area.work[1]),
        family: randInt(rand, area.family[0], area.family[1]),
      },
    });
  }

  return listings;
}

export const DEMO_LISTINGS = generateDemoListings(1200);
