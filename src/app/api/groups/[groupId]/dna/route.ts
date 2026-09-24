import { NextRequest, NextResponse } from "next/server";
import { getGroupOr404, getLockedMembersWithPreferences, deckForGroup } from "@/lib/server/groupData";
import { buildGroupHomeDna } from "@/lib/matching/groupDna";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const group = await getGroupOr404(groupId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const totalMembers = group.members.length;
  const locked = await getLockedMembersWithPreferences(groupId);

  if (locked.length < totalMembers) {
    return NextResponse.json({
      ready: false,
      waitingOn: group.members
        .filter((m) => !locked.some((l) => l.person.userId === m.userId))
        .map((m) => m.user.name),
    });
  }

  const deck = deckForGroup(group.city);
  const dna = buildGroupHomeDna(deck, locked);

  return NextResponse.json({ ready: true, dna, members: locked.map((l) => l.person) });
}
