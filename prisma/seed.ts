import { PrismaClient } from "@prisma/client";
import { DEMO_LISTINGS } from "./demoListings";
import { RIYA_PREFERENCES, MEERA_PREFERENCES, KAVITA_PREFERENCES } from "./demoPreferences";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  await prisma.discussion.deleteMany();
  await prisma.groupShortlist.deleteMany();
  await prisma.apartmentSwipe.deleteMany();
  await prisma.preferenceLock.deleteMany();
  await prisma.preference.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const { count: listingCount } = await prisma.listing.createMany({
    data: DEMO_LISTINGS.map((l) => ({
      title: l.title,
      location: l.location,
      rent: l.rent,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      floor: l.floor,
      hasLift: l.hasLift,
      parking: l.parking,
      balcony: l.balcony,
      petFriendly: l.petFriendly,
      furnished: l.furnished,
      gatedSociety: l.gatedSociety,
      powerBackup: l.powerBackup,
      waterSupply: l.waterSupply,
      security: l.security,
      amenities: JSON.stringify(l.amenities),
      image: l.image,
      source: "Demo data",
      availability: "Available now",
      commuteMinutes: JSON.stringify(l.commuteMinutes),
      isDemo: true,
    })),
  });
  console.log(`Created ${listingCount} demo listings.`);

  const riya = await prisma.user.create({ data: { name: "Riya", emoji: "🌸" } });
  const meera = await prisma.user.create({ data: { name: "Meera", emoji: "🌿" } });
  const kavita = await prisma.user.create({ data: { name: "Kavita", emoji: "🌻" } });

  const group = await prisma.group.create({
    data: {
      name: "Riya • Meera • Kavita",
      city: "Bengaluru",
      moveInDate: "October 2026",
      createdById: riya.id,
    },
  });

  await prisma.groupMember.createMany({
    data: [
      { groupId: group.id, userId: riya.id, isCreator: true, status: "COMPLETE" },
      { groupId: group.id, userId: meera.id, isCreator: false, status: "COMPLETE" },
      { groupId: group.id, userId: kavita.id, isCreator: false, status: "COMPLETE" },
    ],
  });

  const people = [
    { user: riya, prefs: RIYA_PREFERENCES },
    { user: meera, prefs: MEERA_PREFERENCES },
    { user: kavita, prefs: KAVITA_PREFERENCES },
  ];

  for (const { user, prefs } of people) {
    await prisma.preference.createMany({
      data: prefs.map((p) => ({
        userId: user.id,
        groupId: group.id,
        category: p.category,
        requirement: p.requirement,
        priority: p.priority,
        value: p.value !== undefined ? JSON.stringify(p.value) : null,
      })),
    });
    await prisma.preferenceLock.create({ data: { userId: user.id, groupId: group.id } });
  }

  console.log(`Demo group ready: ${group.id}`);
  console.log(`Riya=${riya.id} Meera=${meera.id} Kavita=${kavita.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
