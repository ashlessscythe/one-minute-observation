const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const topics = [
  'Positive Reinforcement',
  'At Risk Behavior',
  'Not Following Policy',
  'Unsafe Condition'
];

const names = [
  'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Williams', 'Charlie Brown',
  'Diana Davis', 'Ethan Edwards', 'Fiona Ford', 'George Gray', 'Hannah Hill'
];

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  // Seed Users
  for (const name of names) {
    await prisma.user.create({
      data: {
        name,
        isSupervisor: Math.random() > 0.7 // 30% chance of being a supervisor
      }
    });
  }

  console.log('Users seeded successfully');

  // Get all users
  const users = await prisma.user.findMany();
  const supervisors = users.filter(user => user.isSupervisor);

  // Seed Observations
  for (let i = 0; i < 50; i++) {
    const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
    const associate = users[Math.floor(Math.random() * users.length)];

    await prisma.observation.create({
      data: {
        date: getRandomDate(new Date(2023, 0, 1), new Date()),
        supervisorName: supervisor.name,
        shift: getRandomInt(1, 3),
        associateName: associate.name,
        topic: topics[Math.floor(Math.random() * topics.length)],
        actionAddressed: `Action addressed for observation ${i + 1}`
      }
    });
  }

  console.log('Observations seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });