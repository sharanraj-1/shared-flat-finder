import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGroupOr404, getLockedMembersWithPreferences, deckForGroup, getAllListings } from "@/lib/server/groupData";
import { matchListingsForGroup } from "@/lib/matching/listingMatch";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const group = await getGroupOr404(groupId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const locked = await getLockedMembersWithPreferences(groupId);
  if (locked.length < group.members.length) {
    return NextResponse.json({ ready: false, matches: [] });
  }

  const deck = deckForGroup(group.city);
  const listings = await getAllListings();
  const matchResults = matchListingsForGroup(listings, deck, locked).filter((r) => !r.excluded);

  const allSwipes = await prisma.apartmentSwipe.findMany({ where: { groupId } });
  const totalMembers = locked.length;

  const matches = matchResults
    .map((r) => {
      const swipesForListing = allSwipes.filter((s) => s.listingId === r.listing.id);
      const reactions = locked.map((m) => {
        const s = swipesForListing.find((sw) => sw.userId === m.person.userId);
        return { person: m.person, action: s?.action ?? null, reason: s?.reason ?? null };
      });
      const resolved = reactions.every((r2) => r2.action !== null);
      const likeCount = reactions.filter((r2) => r2.action === "LIKE").length;

      return {
        listing: r.listing,
        groupScore: r.groupScore,
        sharedRequirementCount: r.sharedRequirementCount,
        compromiseCount: r.compromiseCount,
        perUser: r.perUser,
        reactions,
        resolved,
        likeCount,
        totalMembers,
      };
    })
    .filter((m) => m.resolved)
    .sort((a, b) => b.likeCount - a.likeCount || b.groupScore - a.groupScore);

  return NextResponse.json({ ready: true, matches });
}
