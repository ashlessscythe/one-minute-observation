const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const readline = require("readline");

const prisma = new PrismaClient();

const topics = [
  "Positive Reinforcement",
  "At Risk Behavior",
  "Not Following Policy",
  "Unsafe Condition",
];

function getRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function clearDatabase() {
  await prisma.observation.deleteMany();
  await prisma.user.deleteMany();
  console.log("Database cleared.");
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let shouldClear = false;

  if (args.includes("--clear")) {
    shouldClear = true;
  }

  if (shouldClear) {
    await clearDatabase();
  }

  const users = [];
  const csvPath = path.join(__dirname, "users.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(
      "users.csv file not found. Please create the file and try again."
    );
    process.exit(0);
  }

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.name && row.isSupervisor !== undefined && row.site) {
          users.push({
            name: row.name.trim(),
            isSupervisor: row.isSupervisor.toLowerCase() === "true",
            site: row.site.trim(),
          });
        } else {
          console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`Parsed ${users.length} users from CSV`);

  for (const user of users) {
    if (!user.name) {
      console.warn(`Skipping user with empty name: ${JSON.stringify(user)}`);
      continue;
    }

    try {
      // First, ensure the site exists
      const site = await prisma.site.upsert({
        where: { code: user.site },
        update: {},
        create: { code: user.site },
      });

      // Then, upsert the user with the site relationship
      await prisma.user.upsert({
        where: { name: user.name },
        update: {
          isSupervisor: user.isSupervisor,
          site: { connect: { id: site.id } },
        },
        create: {
          name: user.name,
          isSupervisor: user.isSupervisor,
          site: { connect: { id: site.id } },
        },
      });
    } catch (error) {
      console.error(`Error upserting user ${user.name}:`, error);
    }
  }

  console.log("Users created or updated successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
