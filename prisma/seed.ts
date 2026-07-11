// Optional local seed: creates the "main" tournament row and 10 placeholder teams split
// into two tables of 5, so you can exercise the standings + playoffs immediately.
// Rename teams in the admin UI. Run with:  npx prisma db seed
// (the Prisma CLI loads .env for you)

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

const TABLE_A = [
  { name: 'Smash Sisters', player1: 'Player A1', player2: 'Player A2' },
  { name: 'Net Ninjas', player1: 'Player B1', player2: 'Player B2' },
  { name: 'Shuttle Stars', player1: 'Player C1', player2: 'Player C2' },
  { name: 'Rally Queens', player1: 'Player D1', player2: 'Player D2' },
  { name: 'Drop Shot Divas', player1: 'Player E1', player2: 'Player E2' },
];
const TABLE_B = [
  { name: 'Feather Force', player1: 'Player F1', player2: 'Player F2' },
  { name: 'Court Crushers', player1: 'Player G1', player2: 'Player G2' },
  { name: 'Baseline Blazers', player1: 'Player H1', player2: 'Player H2' },
  { name: 'Ace Angels', player1: 'Player I1', player2: 'Player I2' },
  { name: 'Volley Vipers', player1: 'Player J1', player2: 'Player J2' },
];

async function main() {
  await prisma.team.deleteMany({});
  const create = async (t: { name: string; player1: string; player2: string }) =>
    (await prisma.team.create({ data: t })).id;

  const tableA: string[] = [];
  for (const t of TABLE_A) tableA.push(await create(t));
  const tableB: string[] = [];
  for (const t of TABLE_B) tableB.push(await create(t));

  const state = { tableA, tableB, results: {}, scores: {} };
  await prisma.tournament.upsert({
    where: { id: 'main' },
    update: { state: state as unknown as object },
    create: { id: 'main', state: state as unknown as object },
  });

  console.log(`Seeded ${tableA.length + tableB.length} teams across 2 tables.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
