import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getGroupOr404,
  deckForGroup,
  getAllListings,
  getMemberPreferences,
  toPersonSummary,
} from "@/lib/server/groupData";
import { matchListingForGroup } from "@/lib/matching/listingMatch";

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const swipes = await prisma.apartmentSwipe.findMany({ where: { groupId, userId } });
  return NextResponse.json({ swipes: swipes.map((s) => ({ listingId: s.listingId, action: s.action })) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { userId, listingId, action } = (await req.json()) as {
    userId?: string;
    listingId?: string;
    action?: "LIKE" | "PASS";
  };

  if (!userId || !listingId || !action) {
    return NextResponse.json({ error: "userId, listingId, action are required" }, { status: 400 });
  }

  let reason: string | null = null;

  if (action === "PASS") {
    const group = await getGroupOr404(groupId);
    const member = group?.members.find((m) => m.userId === userId);
    const listings = await getAllListings();
    const listing = listings.find((l) => l.id === listingId);
    if (group && member && listing) {
      const deck = deckForGroup(group.city);
      const preferences = await getMemberPreferences(groupId, userId);
      const evaluation = matchListingForGroup(
        listing,
        deck,
        [{ person: toPersonSummary(member), preferences }],
        group.members.length
      );
      reason = evaluation.exclusionReasons[0]?.note ?? evaluation.perUser[0]?.compromises[0]?.note ?? null;
    }
  }

  await prisma.apartmentSwipe.upsert({
    where: { userId_groupId_listingId: { userId, groupId, listingId } },
    create: { userId, groupId, listingId, action, reason },
    update: { action, reason },
  });

  return NextResponse.json({ ok: true });
}
