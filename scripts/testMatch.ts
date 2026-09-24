import { prisma } from "../src/lib/prisma";
import { buildPreferenceDeck } from "../src/lib/preferenceDeck";
import { matchListingsForGroup } from "../src/lib/matching/listingMatch";
import { listingRowToRecord } from "../src/lib/server/groupData";
import type { Priority } from "../src/lib/preferenceDeck";

async function main() {
  const group = await prisma.group.findFirst({ include: { members: { include: { user: true } } } });
  if (!group) throw new Error("no group");
  const listingsRaw = await prisma.listing.findMany();
  const listings = listingsRaw.map(listingRowToRecord);

  const deck = buildPreferenceDeck(group.city);
  const members = [];
  for (const m of group.members) {
    const prefsRaw = await prisma.preference.findMany({ where: { groupId: group.id, userId: m.userId } });
    const preferences = prefsRaw.map((p) => ({
      userId: p.userId,
      category: p.category,
      requirement: p.requirement,
      priority: p.priority as Priority,
      value: p.value ? JSON.parse(p.value) : null,
    }));
    members.push({ person: { userId: m.userId, name: m.user.name, emoji: m.user.emoji }, preferences });
  }

  const results = matchListingsForGroup(listings, deck, members);
  for (const r of results) {
    console.log(
      (r.excluded ? "EXCLUDED" : "score=" + r.groupScore).padEnd(14),
      r.listing.title.padEnd(28),
      "rent=" + r.listing.rent,
      r.excluded ? r.exclusionReasons.map((e) => `${e.person.name}: ${e.note}`).join(" | ") : ""
    );
    if (!r.excluded) {
      for (const u of r.perUser) {
        console.log(
          `   ${u.person.name}: ${u.score}  gets=${u.gets.length} compromises=${u.compromises
            .map((c) => c.note)
            .join(", ")}`
        );
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
