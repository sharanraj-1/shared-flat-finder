import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMOJIS = ["🌸", "🌿", "🌻", "🦊", "🐨", "🐼", "🦁", "🐙"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { name } = (await req.json()) as { name?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const user = await prisma.user.create({
    data: { name: name.trim(), emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)] },
  });

  await prisma.groupMember.create({
    data: { groupId, userId: user.id, isCreator: false, status: "PENDING" },
  });

  return NextResponse.json({ userId: user.id, name: user.name, emoji: user.emoji });
}
