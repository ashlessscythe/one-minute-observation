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
    process.exit(1);
  }

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        users.push({
          name: row.name,
          isSupervisor: row.isSupervisor.toLowerCase() === "true",
        });
      })
      .on("end", resolve)
      .on("error", reject);
  });

  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }

  console.log("Users created successfully");

  const dbUsers = await prisma.user.findMany();
  const supervisors = dbUsers.filter((user) => user.isSupervisor);
  const nonSupervisors = dbUsers.filter((user) => !user.isSupervisor);

  for (const supervisor of supervisors) {
    const associate =
      nonSupervisors[Math.floor(Math.random() * nonSupervisors.length)];

    await prisma.observation.create({
      data: {
        date: getRandomDate(new Date(2023, 0, 1), new Date()),
        supervisorName: supervisor.name,
        shift: getRandomInt(1, 3),
        associateName: associate.name,
        topic: topics[Math.floor(Math.random() * topics.length)],
        actionAddressed: `Sample action addressed by ${supervisor.name}`,
      },
    });
  }

  console.log("Sample observations created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
