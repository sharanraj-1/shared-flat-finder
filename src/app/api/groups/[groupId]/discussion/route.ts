import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 });

  const rows = await prisma.discussion.findMany({
    where: { groupId, listingId },
    include: { user: true },
    orderBy: { timestamp: "asc" },
  });

  return NextResponse.json({
    messages: rows.map((r) => ({
      id: r.id,
      message: r.message,
      tag: r.tag,
      timestamp: r.timestamp,
      person: { userId: r.userId, name: r.user.name, emoji: r.user.emoji },
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { userId, listingId, message, tag } = (await req.json()) as {
    userId?: string;
    listingId?: string;
    message?: string;
    tag?: "CONCERN" | "ACCEPTABLE" | null;
  };

  if (!userId || !listingId || !message?.trim()) {
    return NextResponse.json({ error: "userId, listingId, message are required" }, { status: 400 });
  }

  const row = await prisma.discussion.create({
    data: { groupId, listingId, userId, message: message.trim(), tag: tag ?? null },
    include: { user: true },
  });

  return NextResponse.json({
    id: row.id,
    message: row.message,
    tag: row.tag,
    timestamp: row.timestamp,
    person: { userId: row.userId, name: row.user.name, emoji: row.user.emoji },
  });
}
