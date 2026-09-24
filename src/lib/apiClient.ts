"use client";

import type { GroupHomeDna } from "./matching/groupDna";
import type { ListingMatchResult } from "./matching/listingMatch";
import type { ListingRecord } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export interface GroupMemberInfo {
  userId: string;
  name: string;
  emoji: string;
  isCreator: boolean;
  status: "PENDING" | "COMPLETE";
}

export interface GroupInfo {
  id: string;
  name: string;
  city: string;
  moveInDate: string | null;
  inviteCode: string;
  createdById: string;
  members: GroupMemberInfo[];
}

export function createGroup(input: { name: string; city: string; moveInDate?: string; creatorName: string }) {
  return request<{ groupId: string; inviteCode: string; userId: string }>("/api/groups", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getGroup(groupId: string) {
  return request<GroupInfo>(`/api/groups/${groupId}`);
}

export function joinGroup(groupId: string, name: string) {
  return request<{ userId: string; name: string; emoji: string }>(`/api/groups/${groupId}/join`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export interface StoredPreferenceDTO {
  requirement: string;
  category: string;
  priority: "DEALBREAKER" | "MUST_HAVE" | "PREFER" | "NICE";
  value: unknown;
}

export function getPreferences(groupId: string, userId: string) {
  return request<{ deckSize: number; locked: boolean; preferences: StoredPreferenceDTO[] }>(
    `/api/groups/${groupId}/preferences?userId=${encodeURIComponent(userId)}`
  );
}

export function savePreference(
  groupId: string,
  input: { userId: string; category: string; requirement: string; priority: string; value?: unknown }
) {
  return request<{ ok: true; wasLocked: boolean }>(`/api/groups/${groupId}/preferences`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function lockPreferences(groupId: string, userId: string) {
  return request<{ ok: true }>(`/api/groups/${groupId}/lock`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function getGroupDna(groupId: string) {
  return request<{ ready: boolean; waitingOn?: string[]; dna?: GroupHomeDna; members?: unknown[] }>(
    `/api/groups/${groupId}/dna`
  );
}

export function getGroupListings(groupId: string) {
  return request<{ ready: boolean; results: ListingMatchResult[] }>(`/api/groups/${groupId}/listings`);
}

export function getMySwipes(groupId: string, userId: string) {
  return request<{ swipes: { listingId: string; action: "LIKE" | "PASS" }[] }>(
    `/api/groups/${groupId}/swipes?userId=${encodeURIComponent(userId)}`
  );
}

export function recordSwipe(groupId: string, input: { userId: string; listingId: string; action: "LIKE" | "PASS" }) {
  return request<{ ok: true }>(`/api/groups/${groupId}/swipes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface GroupMatchDTO {
  listing: ListingRecord;
  groupScore: number;
  sharedRequirementCount: number;
  compromiseCount: number;
  perUser: ListingMatchResult["perUser"];
  reactions: { person: { userId: string; name: string; emoji: string }; action: "LIKE" | "PASS" | null; reason: string | null }[];
  resolved: boolean;
  likeCount: number;
  totalMembers: number;
}

export function getGroupMatches(groupId: string) {
  return request<{ ready: boolean; matches: GroupMatchDTO[] }>(`/api/groups/${groupId}/matches`);
}

export function getTradeoffs(groupId: string, listingId: string) {
  return request<{
    result: ListingMatchResult;
    reactions: { person: { userId: string; name: string; emoji: string }; action: "LIKE" | "PASS" | null; reason: string | null }[];
  }>(`/api/groups/${groupId}/tradeoffs/${listingId}`);
}

export interface ShortlistEntryDTO {
  id: string;
  status: "SHORTLISTED" | "VISIT_SCHEDULED" | "REMOVED";
  addedAt: string;
  listing: ListingRecord;
}

export function getShortlist(groupId: string) {
  return request<{ shortlist: ShortlistEntryDTO[] }>(`/api/groups/${groupId}/shortlist`);
}

export function addToShortlist(groupId: string, listingId: string) {
  return request<{ ok: true; id: string }>(`/api/groups/${groupId}/shortlist`, {
    method: "POST",
    body: JSON.stringify({ listingId }),
  });
}

export function updateShortlistStatus(
  groupId: string,
  listingId: string,
  status: "SHORTLISTED" | "VISIT_SCHEDULED" | "REMOVED"
) {
  return request<{ ok: true }>(`/api/groups/${groupId}/shortlist`, {
    method: "PATCH",
    body: JSON.stringify({ listingId, status }),
  });
}

export interface DiscussionMessageDTO {
  id: string;
  message: string;
  tag: "CONCERN" | "ACCEPTABLE" | null;
  timestamp: string;
  person: { userId: string; name: string; emoji: string };
}

export function getDiscussion(groupId: string, listingId: string) {
  return request<{ messages: DiscussionMessageDTO[] }>(
    `/api/groups/${groupId}/discussion?listingId=${encodeURIComponent(listingId)}`
  );
}

export function postDiscussionMessage(
  groupId: string,
  input: { userId: string; listingId: string; message: string; tag?: "CONCERN" | "ACCEPTABLE" | null }
) {
  return request<DiscussionMessageDTO>(`/api/groups/${groupId}/discussion`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
