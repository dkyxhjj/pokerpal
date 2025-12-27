import { NextResponse } from "next/server";
import { Hand } from "pokersolver";

type ReqBody = {
  players: (string[] | null)[]; // each player: ["As","Kd"] or null if unknown
  board: string[];              // 0..5 cards
  dead?: string[];              // optional dead cards
  iters?: number;               // Monte Carlo iterations
};

const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];
const SUITS = ["s","h","d","c"];

function fullDeck(): string[] {
  const deck: string[] = [];
  for (const r of RANKS) for (const s of SUITS) deck.push(`${r}${s}`);
  return deck;
}

function shuffleInPlace(arr: string[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function normalize(card: string): string {
  // accept "AS" or "As" etc.
  const c = card.trim();
  if (c.length !== 2) throw new Error(`Bad card: ${card}`);
  const r = c[0].toUpperCase();
  const s = c[1].toLowerCase();
  if (!RANKS.includes(r) || !SUITS.includes(s)) throw new Error(`Bad card: ${card}`);
  return `${r}${s}`;
}

function uniqueOrThrow(cards: string[]) {
  const set = new Set(cards);
  if (set.size !== cards.length) throw new Error("Duplicate card detected.");
}

export async function POST(req: Request) {
  const body = (await req.json()) as ReqBody;

  const iters = Math.max(1, Math.min(body.iters ?? 50000, 300000));
  const board = (body.board ?? []).map(normalize);
  const dead = (body.dead ?? []).map(normalize);
  const players = (body.players ?? []).map((p) => (p ? p.map(normalize) : null));

  if (players.length < 2) {
    return NextResponse.json({ error: "Need at least 2 players." }, { status: 400 });
  }
  if (board.length > 5) {
    return NextResponse.json({ error: "Board can be at most 5 cards." }, { status: 400 });
  }

  const knownPlayerCards = players.flatMap((p) => (p ? p : []));
  const allKnown = [...board, ...dead, ...knownPlayerCards];
  try {
    uniqueOrThrow(allKnown);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  // remove known cards from deck
  const deck0 = fullDeck().filter((c) => !new Set(allKnown).has(c));

  // stats
  const wins = Array(players.length).fill(0);
  const ties = Array(players.length).fill(0);

  for (let t = 0; t < iters; t++) {
    const deck = deck0.slice();
    shuffleInPlace(deck);

    // deal missing hole cards
    const hole: string[][] = players.map((p) => (p ? [...p] : []));
    for (let i = 0; i < hole.length; i++) {
      while (hole[i].length < 2) hole[i].push(deck.pop()!);
    }

    // complete board
    const runBoard = [...board];
    while (runBoard.length < 5) runBoard.push(deck.pop()!);

    // evaluate
    const hands = hole.map((hc) => {
      const seven = [...hc, ...runBoard];
      return Hand.solve(seven);
    });

    const winners = Hand.winners(hands);

    if (winners.length === 1) {
      const idx = hands.findIndex((h) => h === winners[0]);
      wins[idx] += 1;
    } else {
      // split pot tie among multiple players
      for (const w of winners) {
        const idx = hands.findIndex((h) => h === w);
        ties[idx] += 1;
      }
    }
  }

  const result = players.map((_, i) => {
    const winPct = wins[i] / iters;
    const tiePct = ties[i] / iters;
    const equityApprox = winPct + tiePct * 0.5;
    return {
      player: i + 1,
      winPct,
      tiePct,
      equityApprox,
    };
  });

  return NextResponse.json({
    iters,
    board,
    dead,
    players: players.map((p, i) => ({ player: i + 1, hole: p ?? null })),
    result,
  });
}
