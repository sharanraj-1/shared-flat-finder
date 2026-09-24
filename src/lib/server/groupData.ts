import { prisma } from "../prisma";
import { buildPreferenceDeck, type Priority } from "../preferenceDeck";
import type { ListingRecord, PersonSummary, StoredPreference } from "../types";
import type { MemberPreferences } from "../matching/listingMatch";

export async function getGroupOr404(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { include: { user: true }, orderBy: { joinedAt: "asc" } } },
  });
  return group;
}

export function deckForGroup(city: string) {
  return buildPreferenceDeck(city);
}

export function toPersonSummary(member: { user: { id: string; name: string; emoji: string } }): PersonSummary {
  return { userId: member.user.id, name: member.user.name, emoji: member.user.emoji };
}

export async function getMemberPreferences(groupId: string, userId: string): Promise<StoredPreference[]> {
  const rows = await prisma.preference.findMany({ where: { groupId, userId } });
  return rows.map((r) => ({
    userId: r.userId,
    category: r.category,
    requirement: r.requirement,
    priority: r.priority as Priority,
    value: r.value ? JSON.parse(r.value) : null,
  }));
}

export async function getLockedMembersWithPreferences(groupId: string): Promise<MemberPreferences[]> {
  const group = await getGroupOr404(groupId);
  if (!group) return [];

  const locks = await prisma.preferenceLock.findMany({ where: { groupId } });
  const lockedUserIds = new Set(locks.map((l) => l.userId));

  const lockedMembers = group.members.filter((m) => lockedUserIds.has(m.userId));

  const result: MemberPreferences[] = [];
  for (const member of lockedMembers) {
    const preferences = await getMemberPreferences(groupId, member.userId);
    result.push({ person: toPersonSummary(member), preferences });
  }
  return result;
}

export function listingRowToRecord(listing: {
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
  furnished: string;
  gatedSociety: boolean;
  powerBackup: boolean;
  waterSupply: string;
  security: boolean;
  amenities: string;
  image: string;
  source: string;
  availability: string;
  commuteMinutes: string;
  isDemo: boolean;
}): ListingRecord {
  return {
    ...listing,
    furnished: listing.furnished as ListingRecord["furnished"],
    amenities: JSON.parse(listing.amenities),
    commuteMinutes: JSON.parse(listing.commuteMinutes),
  };
}

export async function getAllListings(): Promise<ListingRecord[]> {
  const rows = await prisma.listing.findMany();
  return rows.map(listingRowToRecord);
}
