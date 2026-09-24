import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMOJIS = ["🌸", "🌿", "🌻", "🦊", "🐨", "🐼", "🦁", "🐙"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, city, moveInDate, creatorName } = body as {
    name?: string;
    city?: string;
    moveInDate?: string;
    creatorName?: string;
  };

  if (!name?.trim() || !city?.trim() || !creatorName?.trim()) {
    return NextResponse.json({ error: "name, city, and creatorName are required" }, { status: 400 });
  }

  const creator = await prisma.user.create({
    data: { name: creatorName.trim(), emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)] },
  });

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      city: city.trim(),
      moveInDate: moveInDate?.trim() || null,
      createdById: creator.id,
      members: {
        create: { userId: creator.id, isCreator: true, status: "PENDING" },
      },
    },
  });

  return NextResponse.json({ groupId: group.id, inviteCode: group.inviteCode, userId: creator.id });
}
