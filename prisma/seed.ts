import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { SEED_CARDS, EXPECTED_COUNTS } from "./data/cards.js";

function assertSeedDataShape() {
  if (SEED_CARDS.length !== EXPECTED_COUNTS.total) {
    throw new Error(
      `Expected ${EXPECTED_COUNTS.total} cards, got ${SEED_CARDS.length}`,
    );
  }

  const byLevel: Record<string, number> = {};
  const byPack: Record<string, number> = {};
  const slugs = new Set<string>();
  for (const card of SEED_CARDS) {
    byLevel[card.level] = (byLevel[card.level] ?? 0) + 1;
    byPack[card.pack] = (byPack[card.pack] ?? 0) + 1;
    if (slugs.has(card.slug)) {
      throw new Error(`Duplicate card slug: ${card.slug}`);
    }
    slugs.add(card.slug);
  }

  for (const [level, expected] of Object.entries(EXPECTED_COUNTS.byLevel)) {
    if (byLevel[level] !== expected) {
      throw new Error(
        `Expected ${expected} ${level} cards, got ${byLevel[level] ?? 0}`,
      );
    }
  }

  if (byPack.MAIN !== EXPECTED_COUNTS.main) {
    throw new Error(`Expected ${EXPECTED_COUNTS.main} MAIN cards, got ${byPack.MAIN ?? 0}`);
  }
  if (byPack.EXPANSION !== EXPECTED_COUNTS.expansion) {
    throw new Error(
      `Expected ${EXPECTED_COUNTS.expansion} EXPANSION cards, got ${byPack.EXPANSION ?? 0}`,
    );
  }
  if (byPack.CURVEBALL !== EXPECTED_COUNTS.curveball) {
    throw new Error(
      `Expected ${EXPECTED_COUNTS.curveball} CURVEBALL cards, got ${byPack.CURVEBALL ?? 0}`,
    );
  }
}

async function main() {
  assertSeedDataShape();

  for (const card of SEED_CARDS) {
    await prisma.card.upsert({
      where: { slug: card.slug },
      update: {
        theme: card.theme,
        level: card.level,
        pack: card.pack,
        text: card.text,
        curveballNo: card.curveballNo,
      },
      create: {
        slug: card.slug,
        theme: card.theme,
        level: card.level,
        pack: card.pack,
        text: card.text,
        curveballNo: card.curveballNo,
      },
    });
  }

  console.log(`Seeded ${SEED_CARDS.length} cards.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
