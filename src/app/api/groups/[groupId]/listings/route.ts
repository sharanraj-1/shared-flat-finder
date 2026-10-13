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
  // Never surface a listing that violates someone's dealbreaker (spec section 16) —
  // this feed drives Apartment Tinder, so excluded listings must not be swipeable.
  // With a 1000+ listing corpus, cap the swipeable feed to the strongest matches
  // (already sorted by groupScore desc) rather than handing back everything.
  const FEED_LIMIT = 60;
  const results = matchListingsForGroup(listings, deck, locked)
    .filter((r) => !r.excluded)
    .slice(0, FEED_LIMIT);

  return NextResponse.json({ ready: true, results, totalCandidates: listings.length });
}
