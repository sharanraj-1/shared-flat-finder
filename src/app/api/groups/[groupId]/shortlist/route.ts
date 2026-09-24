import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listingRowToRecord } from "@/lib/server/groupData";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const rows = await prisma.groupShortlist.findMany({
    where: { groupId },
    include: { listing: true },
    orderBy: { addedAt: "asc" },
  });

  return NextResponse.json({
    shortlist: rows.map((r) => ({
      id: r.id,
      status: r.status,
      addedAt: r.addedAt,
      listing: listingRowToRecord(r.listing),
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { listingId } = (await req.json()) as { listingId?: string };
  if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 });

  const row = await prisma.groupShortlist.upsert({
    where: { groupId_listingId: { groupId, listingId } },
    create: { groupId, listingId, status: "SHORTLISTED" },
    update: { status: "SHORTLISTED" },
  });

  return NextResponse.json({ ok: true, id: row.id });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { listingId, status } = (await req.json()) as {
    listingId?: string;
    status?: "SHORTLISTED" | "VISIT_SCHEDULED" | "REMOVED";
  };
  if (!listingId || !status) {
    return NextResponse.json({ error: "listingId and status are required" }, { status: 400 });
  }

  await prisma.groupShortlist.update({
    where: { groupId_listingId: { groupId, listingId } },
    data: { status },
  });

  return NextResponse.json({ ok: true });
}
