import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPreferenceDeck } from "@/lib/preferenceDeck";

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const [rows, lock] = await Promise.all([
    prisma.preference.findMany({ where: { groupId, userId } }),
    prisma.preferenceLock.findUnique({ where: { userId_groupId: { userId, groupId } } }),
  ]);

  const deck = buildPreferenceDeck(group.city);

  return NextResponse.json({
    deckSize: deck.length,
    locked: Boolean(lock),
    preferences: rows.map((r) => ({
      requirement: r.requirement,
      category: r.category,
      priority: r.priority,
      value: r.value ? JSON.parse(r.value) : null,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const body = await req.json();
  const { userId, category, requirement, priority, value } = body as {
    userId?: string;
    category?: string;
    requirement?: string;
    priority?: string;
    value?: unknown;
  };

  if (!userId || !category || !requirement || !priority) {
    return NextResponse.json({ error: "userId, category, requirement, priority are required" }, { status: 400 });
  }

  const wasLocked = Boolean(
    await prisma.preferenceLock.findUnique({ where: { userId_groupId: { userId, groupId } } })
  );

  await prisma.preference.upsert({
    where: { userId_groupId_category_requirement: { userId, groupId, category, requirement } },
    create: {
      userId,
      groupId,
      category,
      requirement,
      priority,
      value: value !== undefined && value !== null ? JSON.stringify(value) : null,
    },
    update: {
      priority,
      value: value !== undefined && value !== null ? JSON.stringify(value) : null,
    },
  });

  return NextResponse.json({ ok: true, wasLocked });
}
