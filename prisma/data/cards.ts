// Transcribed from the "Under One Roof — Full Card Deck" source document.
// 85 cards total: 57 main-deck themed + 15 Curveball + 13 Expansion-pack themed.

export type SeedCardLevel = "WARMUP" | "REAL_TALK" | "GO_DEEP" | "CURVEBALL";
export type SeedCardPack = "MAIN" | "EXPANSION" | "CURVEBALL";

export interface SeedCard {
  slug: string;
  theme: string | null;
  level: SeedCardLevel;
  pack: SeedCardPack;
  text: string;
  curveballNo: number | null;
}

interface ThemeDefinition {
  slug: string;
  theme: string;
  pack: SeedCardPack;
  warmup: string[];
  realTalk: string[];
  goDeep: string[];
}

const THEMES: ThemeDefinition[] = [
  {
    slug: "apt-search-moving",
    theme: "Apt. Search & Moving",
    pack: "MAIN",
    warmup: [
      "Rank your top 3 neighborhoods or areas you'd want to live in. Why those?",
      "What's your dream move-in date timeline — fast and scrappy, or slow and deliberate?",
      "What are your must-haves for the apartment search — the things you're not willing to compromise on?",
    ],
    realTalk: [
      "Apartment or house? High-rise or walk-up? What's the non-negotiable on home type?",
      "Hiring movers or doing it ourselves (with pizza and friends)? Make the case.",
    ],
    goDeep: [
      "What's a deal-breaker location or building feature that would make you say no to an otherwise perfect place?",
      "If we disagreed on the apartment and couldn't both get our way, how should we decide?",
    ],
  },
  {
    slug: "budgeting",
    theme: "Budgeting",
    pack: "MAIN",
    warmup: [
      "What's your gut-check ideal rent number, before we even look at listings?",
      "Splitting bills evenly, by income, or some other formula? Pitch your method.",
    ],
    realTalk: [
      "Whose name goes on the lease, and how do we handle a guarantor or co-signer if needed?",
      "What shared subscriptions are we keeping (streaming, memberships) and who's the account holder?",
    ],
    goDeep: [
      "What's your honest comfort level with debt, savings, and financial risk — and how does that show up day to day?",
      "If one of us lost income for a few months, what would our plan be?",
    ],
  },
  {
    slug: "good-bad-habits",
    theme: "Good & Bad Habits",
    pack: "MAIN",
    warmup: [
      "What's a habit of yours you're actually proud of that I'll benefit from living with?",
      "Confess one small bad habit I haven't fully clocked yet.",
    ],
    realTalk: [
      "How do you actually want to be called out on a bad habit — directly, jokingly, or with a heads-up first?",
      "What's a habit of mine (be honest) that you're quietly hoping will improve once we live together?",
    ],
    goDeep: [
      "What's a habit you've struggled to break, and what kind of support (not pressure) would actually help?",
      "Is there a habit of yours that you're worried could become a real source of conflict over time?",
    ],
  },
  {
    slug: "chores-errands",
    theme: "Chores & Errands",
    pack: "MAIN",
    warmup: [
      "Laundry: separate or together? Folded immediately or living in the basket?",
      "Who's the better cook, and how do we want to split cooking duty realistically?",
    ],
    realTalk: [
      "Build our chore split: cleaning, groceries, dishes, trash, bills — who owns what by default?",
      "What's an average weekday living together look like to you? What about a weekend?",
    ],
    goDeep: [
      "What happens when one of us is pulling more weight on chores for a stretch — how do we name that without resentment building?",
      "What's your actual pet peeve when it comes to co-habitating chores — the thing that quietly drives you nuts?",
      "Be honest: whose standard of 'clean' wins when they're different, and how do we keep that from feeling like one person is always right?",
    ],
  },
  {
    slug: "personalities-moods",
    theme: "Personalities & Moods",
    pack: "MAIN",
    warmup: [
      "How do you recharge after a long day — alone time, talking it out, or something else?",
      "What's your go-to sign that you're stressed, even if you don't say it out loud?",
    ],
    realTalk: [
      "When you're in a bad mood, what do you need from me — space, comfort, distraction, or just to be left alone?",
      "What's something about my personality that took you a while to understand, but now makes total sense?",
    ],
    goDeep: [
      "What's a mood or emotional pattern of yours that you think will be the hardest for a live-in partner to navigate?",
      "How do you want us to handle it when we're both in a bad mood at the same time?",
    ],
  },
  {
    slug: "decor-design",
    theme: "Interior Decorating & Design",
    pack: "MAIN",
    warmup: [
      "Describe our shared aesthetic in five words or less.",
      "What's something your partner owns that you don't want to see in our shared space?",
    ],
    realTalk: [
      "Whose furniture/decor wins in a tie-breaker, and how should we decide that going forward?",
      "What's a home goods splurge you think is worth it, and one you think is a waste?",
    ],
    goDeep: [
      "Is there a piece of decor or a 'shrine' to a hobby/interest that's actually a non-negotiable for you to keep visible?",
      "How much say do you want each other to have over shared spaces vs. your own personal corner?",
    ],
  },
  {
    slug: "social",
    theme: "Social",
    pack: "MAIN",
    warmup: [
      "Are you a host-people-over-often type or a keep-it-low-key type?",
      "How much notice do you want before I invite people over?",
    ],
    realTalk: [
      "What does a great dinner party or game night at our place look like to you?",
      "How do you feel about friends crashing on the couch, and for how long is too long?",
    ],
    goDeep: [
      "What's your honest read on how our social lives — friend groups, going out, hosting — will blend or clash?",
      "Is there a type of gathering or guest that would genuinely stress you out in our home?",
    ],
  },
  {
    slug: "visits-stays",
    theme: "Visits & Stays",
    pack: "MAIN",
    warmup: [
      "How often do you picture your family visiting once we have our own place?",
      "What's your ideal heads-up time before someone stays over for a night?",
    ],
    realTalk: [
      "How do you want to handle out-of-town friends or family staying for a longer visit — a few days vs. a week+?",
      "What house rules change (if any) when family or guests are staying with us?",
    ],
    goDeep: [
      "Is there a family dynamic or in-law situation you're a little nervous about once we're cohabitating?",
      "What would you need from me if a visit from my family or friends started to feel like too much?",
    ],
  },
  {
    slug: "non-negotiables-boundaries",
    theme: "Non-negotiables & Boundaries",
    pack: "MAIN",
    warmup: [
      "What's one house rule you want locked in from day one?",
      "Do you need a hard stop on phones/work at a certain time in the evening?",
    ],
    realTalk: [
      "What's a boundary around alone time, personal space, or 'do not disturb' that I should know?",
      "What topics or moments do you need privacy on, even living together?",
    ],
    goDeep: [
      "What's a true non-negotiable for you — something that, if violated, would be a serious problem?",
      "How do you want us to fight fairly when we live in the same space and can't just go home?",
      "What's one of your biggest fears or anxieties about living together?",
    ],
  },
  {
    slug: "differences-similarities",
    theme: "Differences & Similarities",
    pack: "EXPANSION",
    warmup: [
      "What's one big way you and I are exactly alike that surprised you when you first noticed it?",
      "What's a small daily habit where we're total opposites?",
    ],
    realTalk: [
      "Where do our differences actually make us a better team, rather than a source of friction?",
      "What's a value or belief we don't fully share — and how do we make peace with that?",
      "Is there a difference between us that you've had to actively get used to?",
    ],
    goDeep: [
      "What's the biggest way our personalities differ, and how do you think that will show up once we're sharing a home full-time?",
      "If we're being honest, what's a similarity between us that could become a blind spot — two people who are alike in the same way, missing the same thing?",
    ],
  },
  {
    slug: "future-long-term-plans",
    theme: "Future & Long-Term Plans",
    pack: "EXPANSION",
    warmup: [
      "Five years from now, what does our day-to-day life look like in your head?",
      "Do you see this place as a 'starter' or something more long-term?",
    ],
    realTalk: [
      "How do we want to handle major future decisions together — career moves, big purchases — once we're sharing space?",
      "What's a personal goal of yours that living together should make easier, not harder?",
    ],
    goDeep: [
      "Where do marriage, kids, or other big milestones fit into how you picture our future together?",
      "What's a fear you have about how living together might change either of our individual ambitions?",
    ],
  },
];

const CURVEBALL_CARDS: string[] = [
  "What's the weirdest little ritual or habit you have that I should be warned about?",
  "Do you talk to yourself, narrate your actions, or have any odd verbal tics at home? Demonstrate one, right now.",
  "What's a compulsive little pattern of yours — organizing, checking locks twice, a very specific order of operations — that's just 'how you are'?",
  "What's something you do at home that you'd be a little embarrassed for anyone else to witness?",
  "What's the quirk you're most nervous for me to discover once we're living together full-time?",
  "What's a quirk of mine you've already noticed that you find endearing rather than annoying?",
  "What's the most irrational fear you have about living together — the dumber the better?",
  "If a horror movie were made about our worst possible roommate disaster, what's the opening scene?",
  "What's the one thing you're secretly a little scared I'll find in a drawer or closet once we unpack?",
  "Swap one chore you'd normally hate for one your partner usually does — negotiate the trade right now.",
  "Describe our future home in one sentence, like a real estate listing. Most charming description wins a Connection Point.",
  "You have 60 seconds each to pitch your partner on why your way of loading a dishwasher (or folding towels) is correct.",
  "Trade one 'must-have' apartment feature for one of your partner's must-haves. What did you each give up?",
  "Name the one household object you will fight to the death to keep out of storage. Defend it.",
  "Plan our first grocery run together, out loud, right now — who's pushing the cart and who's reading the list?",
];

function buildThemedCards(): SeedCard[] {
  const cards: SeedCard[] = [];
  for (const def of THEMES) {
    const levels: [SeedCardLevel, string[]][] = [
      ["WARMUP", def.warmup],
      ["REAL_TALK", def.realTalk],
      ["GO_DEEP", def.goDeep],
    ];
    for (const [level, texts] of levels) {
      texts.forEach((text, i) => {
        cards.push({
          slug: `${def.pack.toLowerCase()}-${def.slug}-${level.toLowerCase()}-${String(i + 1).padStart(2, "0")}`,
          theme: def.theme,
          level,
          pack: def.pack,
          text,
          curveballNo: null,
        });
      });
    }
  }
  return cards;
}

function buildCurveballCards(): SeedCard[] {
  return CURVEBALL_CARDS.map((text, i) => ({
    slug: `curveball-${String(i + 1).padStart(2, "0")}`,
    theme: null,
    level: "CURVEBALL",
    pack: "CURVEBALL",
    text,
    curveballNo: i + 1,
  }));
}

export const SEED_CARDS: SeedCard[] = [
  ...buildThemedCards(),
  ...buildCurveballCards(),
];

export const EXPECTED_COUNTS = {
  total: 85,
  main: 57,
  expansion: 13,
  curveball: 15,
  byLevel: {
    WARMUP: 23,
    REAL_TALK: 23,
    GO_DEEP: 24,
    CURVEBALL: 15,
  },
} as const;
