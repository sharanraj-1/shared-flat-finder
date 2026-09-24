import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGroupOr404, getLockedMembersWithPreferences, deckForGroup, getAllListings } from "@/lib/server/groupData";
import { matchListingForGroup } from "@/lib/matching/listingMatch";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; listingId: string }> }
) {
  const { groupId, listingId } = await params;
  const group = await getGroupOr404(groupId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const locked = await getLockedMembersWithPreferences(groupId);
  const deck = deckForGroup(group.city);
  const listings = await getAllListings();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const result = matchListingForGroup(listing, deck, locked);

  const swipes = await prisma.apartmentSwipe.findMany({ where: { groupId, listingId } });
  const reactions = locked.map((m) => {
    const s = swipes.find((sw) => sw.userId === m.person.userId);
    return { person: m.person, action: s?.action ?? null, reason: s?.reason ?? null };
  });

  return NextResponse.json({ result, reactions });
}
