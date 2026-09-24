import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { include: { user: true }, orderBy: { joinedAt: "asc" } } },
  });

  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const locks = await prisma.preferenceLock.findMany({ where: { groupId } });
  const lockedUserIds = new Set(locks.map((l) => l.userId));

  return NextResponse.json({
    id: group.id,
    name: group.name,
    city: group.city,
    moveInDate: group.moveInDate,
    inviteCode: group.inviteCode,
    createdById: group.createdById,
    members: group.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      emoji: m.user.emoji,
      isCreator: m.isCreator,
      status: lockedUserIds.has(m.userId) ? "COMPLETE" : "PENDING",
    })),
  });
}
