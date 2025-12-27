// All-in Side Pot Calculator with Multiple Runouts
// Implements standard Texas Hold'em side-pot rules

export interface Player {
  id: string;
  contribution: number;
}

export interface Runout {
  order: string[]; // e.g. ["A", "B|C", "D"] where | indicates tie
}

export interface Input {
  runs: number;
  deadMoney: number;
  players: Player[];
  runouts: Runout[];
}

export interface Pot {
  potIndex: number;
  amount: number;
  eligiblePlayers: string[];
}

export interface Result {
  totalPot: number;
  pots: Pot[];
  payoutsByRunout: { [playerId: string]: number }[];
  totalPayouts: { [playerId: string]: number };
  leftover: number;
}

/**
 * Main function to calculate all-in side pots with multiple runouts
 */
export function calculateAllInMultiRunout(input: Input): Result {
  const { runs, deadMoney, players, runouts } = input;

  // Validate input
  if (players.length < 2) {
    throw new Error("Need at least 2 players");
  }
  if (runouts.length !== runs) {
    throw new Error("Number of runouts must match runs");
  }

  // Calculate total pot
  const totalContributions = players.reduce((sum, p) => sum + p.contribution, 0);
  const totalPot = totalContributions + deadMoney;

  // Build pots based on contribution levels
  const pots = buildPots(players, deadMoney);

  // Initialize total payouts
  const totalPayouts: { [playerId: string]: number } = {};
  players.forEach((p) => {
    totalPayouts[p.id] = 0;
  });

  // Process each runout
  const payoutsByRunout: { [playerId: string]: number }[] = [];
  let totalLeftover = 0;

  for (const runout of runouts) {
    const runoutPayouts: { [playerId: string]: number } = {};
    players.forEach((p) => {
      runoutPayouts[p.id] = 0;
    });

    let runoutLeftover = 0;

    // Distribute each pot based on finishing order
    for (const pot of pots) {
      const { winners, leftover } = distributePot(
        pot.amount,
        pot.eligiblePlayers,
        runout.order
      );

      // Add winnings to runout payouts
      for (const [playerId, amount] of Object.entries(winners)) {
        runoutPayouts[playerId] += amount;
      }

      runoutLeftover += leftover;
    }

    payoutsByRunout.push(runoutPayouts);

    // Add to total payouts
    for (const [playerId, amount] of Object.entries(runoutPayouts)) {
      totalPayouts[playerId] += amount;
    }

    totalLeftover += runoutLeftover;
  }

  return {
    totalPot,
    pots,
    payoutsByRunout,
    totalPayouts,
    leftover: totalLeftover,
  };
}

/**
 * Build pots based on player contributions and dead money
 * Creates main pot and side pots following standard rules
 */
function buildPots(players: Player[], deadMoney: number): Pot[] {
  const pots: Pot[] = [];

  // Sort players by contribution (ascending)
  const sortedPlayers = [...players].sort((a, b) => a.contribution - b.contribution);

  // Track remaining contributions
  const remaining: { [playerId: string]: number } = {};
  players.forEach((p) => {
    remaining[p.id] = p.contribution;
  });

  let remainingDeadMoney = deadMoney;
  let potIndex = 0;

  // Build pots level by level
  for (let i = 0; i < sortedPlayers.length; i++) {
    const level = sortedPlayers[i].contribution;

    // Skip if this level is 0 or already processed
    if (level === 0) continue;

    // Find previous level
    const prevLevel = i > 0 ? sortedPlayers[i - 1].contribution : 0;
    const levelDiff = level - prevLevel;

    if (levelDiff === 0) continue;

    // Calculate pot amount for this level
    let potAmount = 0;

    // Eligible players are those who contributed at least to this level
    const eligiblePlayers: string[] = [];

    for (const player of players) {
      if (remaining[player.id] > 0) {
        const contribution = Math.min(remaining[player.id], levelDiff);
        potAmount += contribution;
        remaining[player.id] -= contribution;

        // Player is eligible if they contributed to this level
        if (player.contribution >= level) {
          eligiblePlayers.push(player.id);
        }
      }
    }

    // Add dead money proportionally to this pot
    if (remainingDeadMoney > 0) {
      const deadContribution = Math.min(
        remainingDeadMoney,
        Math.floor(deadMoney / (sortedPlayers.length - i))
      );
      potAmount += deadContribution;
      remainingDeadMoney -= deadContribution;
    }

    if (potAmount > 0) {
      pots.push({
        potIndex,
        amount: potAmount,
        eligiblePlayers,
      });
      potIndex++;
    }
  }

  // Add any remaining dead money to the last pot
  if (remainingDeadMoney > 0 && pots.length > 0) {
    pots[pots.length - 1].amount += remainingDeadMoney;
  }

  return pots;
}

/**
 * Distribute a single pot based on finishing order
 * Handles ties and integer chip splitting
 */
function distributePot(
  potAmount: number,
  eligiblePlayers: string[],
  finishingOrder: string[]
): { winners: { [playerId: string]: number }; leftover: number } {
  const winners: { [playerId: string]: number } = {};

  // Parse finishing order to find winners
  // Winners are the first eligible players in the finishing order
  let winnerIds: string[] = [];

  for (const position of finishingOrder) {
    // Check for ties (e.g., "A|B")
    const tiedPlayers = position.split("|").map((p) => p.trim());

    // Find eligible players in this position
    const eligibleInPosition = tiedPlayers.filter((p) => eligiblePlayers.includes(p));

    if (eligibleInPosition.length > 0) {
      winnerIds = eligibleInPosition;
      break;
    }
  }

  // If no eligible winners found, pot goes to leftover
  if (winnerIds.length === 0) {
    return { winners, leftover: potAmount };
  }

  // Split pot among winners
  const sharePerWinner = Math.floor(potAmount / winnerIds.length);
  const leftover = potAmount - sharePerWinner * winnerIds.length;

  // Distribute shares
  for (const winnerId of winnerIds) {
    winners[winnerId] = sharePerWinner;
  }

  // Distribute leftover chips to first winner(s) deterministically
  let remainingLeftover = leftover;
  for (let i = 0; i < winnerIds.length && remainingLeftover > 0; i++) {
    winners[winnerIds[i]]++;
    remainingLeftover--;
  }

  return { winners, leftover: remainingLeftover };
}
