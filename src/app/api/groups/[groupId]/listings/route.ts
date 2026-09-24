import { NextRequest, NextResponse } from "next/server";
import { getGroupOr404, getLockedMembersWithPreferences, deckForGroup, getAllListings } from "@/lib/server/groupData";
import { matchListingsForGroup } from "@/lib/matching/listingMatch";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const group = await getGroupOr404(groupId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const locked = await getLockedMembersWithPreferences(groupId);
  if (locked.length < group.members.length) {
    return NextResponse.json({ ready: false, results: [] });
  }

  const deck = deckForGroup(group.city);
  const listings = await getAllListings();
  const results = matchListingsForGroup(listings, deck, locked);

  return NextResponse.json({ ready: true, results });
}
