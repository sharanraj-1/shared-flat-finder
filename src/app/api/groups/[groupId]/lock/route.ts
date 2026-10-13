import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPreferenceDeck } from "@/lib/preferenceDeck";

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { userId } = (await req.json()) as { userId?: string };
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const deck = buildPreferenceDeck(group.city);
  const answered = await prisma.preference.count({ where: { groupId, userId } });

  if (answered < deck.length) {
    return NextResponse.json(
      { error: `Answer all ${deck.length} cards before locking (answered ${answered}).` },
      { status: 400 }
    );
  }

  await prisma.preferenceLock.upsert({
    where: { userId_groupId: { userId, groupId } },
    create: { userId, groupId },
    update: {},
  });

  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { status: "COMPLETE" },
  });

  return NextResponse.json({ ok: true });
}
