const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

const SITE_COUNT = 3;
const USERS_PER_SITE = 10;
const OBSERVATIONS_PER_SITE = 20;

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

  // Create sites
  const sites = [];
  for (let i = 0; i < SITE_COUNT; i++) {
    const site = await prisma.site.create({
      data: {
        code:
          faker.location.countryCode() +
          faker.number.int({ min: 100, max: 999 }),
      },
    });
    sites.push(site);
    console.log(`Created site: ${site.code}`);
  }

  // Create users for each site
  for (const site of sites) {
    // Create one supervisor
    await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        isSupervisor: true,
        siteId: site.id,
      },
    });

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

    for (let i = 0; i < OBSERVATIONS_PER_SITE; i++) {
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
