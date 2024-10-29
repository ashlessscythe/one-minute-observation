const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

const SITE_COUNT = 3;
const USERS_PER_SITE = 20;
const MAX_OBSERVATIONS_PER_SITE = 40;

const topics = [
  "Positive Reinforcement",
  "At Risk Behavior",
  "Not Following Policy",
  "Unsafe Condition",
];

async function clearDatabase() {
  await prisma.observation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.site.deleteMany();
  console.log("Database cleared.");
}

async function main() {
  console.log("Starting seed...");

  await clearDatabase();

  // Create a single "test" site if it doesn't already exist
  const testSite = await prisma.site.upsert({
    where: { code: "TEST" },
    update: {},
    create: { code: "TEST" },
  });
  console.log(`Ensured site: ${testSite.code}`);

  const sites = [testSite]; // Start with the "test" site

  // Create remaining sites up to SITE_COUNT
  for (let i = 1; i < SITE_COUNT; i++) {
    // Generate a 4-character alphanumeric string
    const randomSuffix = `${Math.floor(Math.random() * 10)}${faker.string
      .alphanumeric(3)
      .toUpperCase()}`;
    const randomCode = `SITE_${randomSuffix}`;

    const site = await prisma.site.create({
      data: {
        code: randomCode,
      },
    });
    sites.push(site);
    console.log(`Created site: ${site.code}`);
  }

  // Create users for each site
  for (const site of sites) {
    // Create 1 supervisor for every 3 users
    const SUPERVISOR_COUNT = parseInt(USERS_PER_SITE / 3, 10);
    for (let i = 0; i < SUPERVISOR_COUNT; i++) {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          isSupervisor: true,
          siteId: site.id,
        },
      });
    }

    // Create regular users
    for (let i = 0; i < USERS_PER_SITE - 1; i++) {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          isSupervisor: false,
          siteId: site.id,
        },
      });
    }
    console.log(`Created users for site: ${site.code}`);
  }

  // Create observations for each site
  for (const site of sites) {
    const siteUsers = await prisma.user.findMany({
      where: { siteId: site.id },
    });
    const supervisors = siteUsers.filter((user) => user.isSupervisor);
    const regularUsers = siteUsers.filter((user) => !user.isSupervisor);

    const minObservations = Math.floor(MAX_OBSERVATIONS_PER_SITE / 2);
    const totalObservations =
      Math.floor(
        Math.random() * (MAX_OBSERVATIONS_PER_SITE - minObservations + 1)
      ) + minObservations;

    for (let i = 0; i < totalObservations; i++) {
      const randomSupervisor =
        supervisors[Math.floor(Math.random() * supervisors.length)];
      const randomUser =
        regularUsers[Math.floor(Math.random() * regularUsers.length)];

      await prisma.observation.create({
        data: {
          date: faker.date.past({ years: 1 }),
          supervisorName: randomSupervisor.name,
          shift: faker.number.int({ min: 1, max: 3 }),
          associateName: randomUser.name,
          topic: topics[Math.floor(Math.random() * topics.length)],
          actionAddressed: faker.lorem.sentence(),
          siteId: site.id,
        },
      });
    }
    console.log(`Created observations for site: ${site.code}`);
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
