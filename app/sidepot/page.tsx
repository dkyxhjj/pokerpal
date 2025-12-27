"use client";

import { useState } from "react";
import { Users, Plus, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateAllInMultiRunout, Player, Runout, Result } from "@/lib/sidepot";

interface PlayerInput {
  id: string;
  contribution: string;
}

export default function SidePotPage() {
  const [runs, setRuns] = useState<number>(1);
  const [deadMoney, setDeadMoney] = useState<string>("0");
  const [players, setPlayers] = useState<PlayerInput[]>([
    { id: "A", contribution: "" },
    { id: "B", contribution: "" },
  ]);
  const [runouts, setRunouts] = useState<string[][]>([[]]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string>("");
  const [nextPlayerId, setNextPlayerId] = useState(67); // ASCII 'C'

  const addPlayer = () => {
    const newId = String.fromCharCode(nextPlayerId);
    setPlayers([...players, { id: newId, contribution: "" }]);
    setNextPlayerId(nextPlayerId + 1);
  };

  const removePlayer = (id: string) => {
    if (players.length > 2) {
      setPlayers(players.filter((p) => p.id !== id));
    }
  };

  const updatePlayer = (id: string, contribution: string) => {
    setPlayers(players.map((p) => (p.id === id ? { ...p, contribution } : p)));
  };

  const updateRunoutPosition = (runIndex: number, posIndex: number, value: string) => {
    const newRunouts = [...runouts];
    if (!newRunouts[runIndex]) {
      newRunouts[runIndex] = [];
    }
    newRunouts[runIndex][posIndex] = value.toUpperCase();
    setRunouts(newRunouts);
  };

  const handleRunsChange = (newRuns: number) => {
    setRuns(newRuns);
    const newRunouts = Array(newRuns)
      .fill(null)
      .map((_, idx) => (runouts[idx] ? [...runouts[idx]] : []));
    setRunouts(newRunouts);
  };

  const calculate = () => {
    setError("");
    setResult(null);

    try {
      // Validate and parse players
      const parsedPlayers: Player[] = players.map((p) => {
        const contribution = parseInt(p.contribution) || 0;
        if (contribution < 0) throw new Error("Contributions must be non-negative");
        return { id: p.id, contribution };
      });

      // Validate and parse runouts
      const parsedRunouts: Runout[] = runouts.map((runout, idx) => {
        const order = runout.filter((pos) => pos.trim() !== "");
        if (order.length === 0) {
          throw new Error(`Runout ${idx + 1} is empty`);
        }

        // Validate all players appear exactly once
        const allPlayerIds = new Set<string>();
        for (const pos of order) {
          const ids = pos.split("|").map((id) => id.trim());
          for (const id of ids) {
            if (allPlayerIds.has(id)) {
              throw new Error(`Player ${id} appears multiple times in runout ${idx + 1}`);
            }
            if (!players.find((p) => p.id === id)) {
              throw new Error(`Unknown player ${id} in runout ${idx + 1}`);
            }
            allPlayerIds.add(id);
          }
        }

        const missingPlayers = players.filter((p) => !allPlayerIds.has(p.id));
        if (missingPlayers.length > 0) {
          throw new Error(
            `Players ${missingPlayers.map((p) => p.id).join(", ")} missing from runout ${idx + 1}`
          );
        }

        return { order };
      });

      const input = {
        runs,
        deadMoney: parseInt(deadMoney) || 0,
        players: parsedPlayers,
        runouts: parsedRunouts,
      };

      const calculatedResult = calculateAllInMultiRunout(input);
      setResult(calculatedResult);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const reset = () => {
    setRuns(1);
    setDeadMoney("0");
    setPlayers([
      { id: "A", contribution: "" },
      { id: "B", contribution: "" },
    ]);
    setRunouts([[]]);
    setResult(null);
    setError("");
    setNextPlayerId(67);
  };

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">Side Pot Calculator</h2>
        <p className="text-xs text-zinc-500">Calculate all-in pot distribution</p>
      </div>

      {/* Setup */}
      <div className="mb-4 space-y-4">
        {/* Runs */}
        <div>
          <div className="mb-2 text-sm font-medium text-zinc-400">Number of Runouts</div>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => handleRunsChange(n)}
                className={`px-4 py-2 text-sm rounded border transition-colors ${
                  runs === n
                    ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-100"
                }`}
              >
                {n}x
              </button>
            ))}
          </div>
        </div>

        {/* Dead Money */}
        <div>
          <div className="mb-2 text-sm font-medium text-zinc-400">Dead Money</div>
          <Input
            type="number"
            value={deadMoney}
            onChange={(e) => setDeadMoney(e.target.value)}
            placeholder="0"
            className="h-9 w-32 bg-zinc-900 border border-zinc-800 text-sm text-zinc-100"
          />
        </div>

        {/* Players */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-zinc-400">Players</div>
            <Button
              onClick={addPlayer}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-2">
                <div className="w-8 text-sm font-semibold text-zinc-100">{player.id}</div>
                <Input
                  type="number"
                  value={player.contribution}
                  onChange={(e) => updatePlayer(player.id, e.target.value)}
                  placeholder="Chips"
                  className="h-9 flex-1 bg-zinc-900 border border-zinc-800 text-sm text-zinc-100"
                />
                {players.length > 2 && (
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-zinc-600 hover:text-zinc-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Runouts */}
        <div>
          <div className="mb-2 text-sm font-medium text-zinc-400">
            Finishing Order (1st, 2nd, 3rd...)
          </div>
          <div className="text-xs text-zinc-600 mb-2">Use | for ties (e.g., A|B)</div>

          {Array.from({ length: runs }).map((_, runIdx) => (
            <div key={runIdx} className="mb-3">
              <div className="mb-1 text-xs text-zinc-500">Runout {runIdx + 1}</div>
              <div className="flex gap-2">
                {players.map((_, posIdx) => (
                  <Input
                    key={posIdx}
                    value={runouts[runIdx]?.[posIdx] || ""}
                    onChange={(e) => updateRunoutPosition(runIdx, posIdx, e.target.value)}
                    placeholder={`${posIdx + 1}${posIdx === 0 ? "st" : posIdx === 1 ? "nd" : posIdx === 2 ? "rd" : "th"}`}
                    className="h-9 w-16 bg-zinc-900 border border-zinc-800 text-center text-sm font-semibold text-zinc-100 uppercase"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mb-4 space-y-4">
          {/* Pots */}
          <div className="overflow-hidden border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-4 py-3">
              <div className="text-sm font-medium text-zinc-100">
                Pots (Total: {result.totalPot})
              </div>
            </div>
            <div className="p-3 space-y-2">
              {result.pots.map((pot) => (
                <div
                  key={pot.potIndex}
                  className="rounded border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold text-zinc-100">
                      {pot.potIndex === 0 ? "Main Pot" : `Side Pot ${pot.potIndex}`}
                    </div>
                    <div className="text-lg font-bold text-zinc-100">{pot.amount}</div>
                  </div>
                  <div className="text-xs text-zinc-500">
                    Eligible: {pot.eligiblePlayers.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payouts by Runout */}
          {runs > 1 && (
            <div className="overflow-hidden border border-zinc-800 bg-zinc-900">
              <div className="border-b border-zinc-800 px-4 py-3">
                <div className="text-sm font-medium text-zinc-100">Payouts by Runout</div>
              </div>
              <div className="p-3 space-y-2">
                {result.payoutsByRunout.map((payouts, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="text-xs text-zinc-500 mb-1">Runout {idx + 1}</div>
                    <div className="flex gap-3">
                      {Object.entries(payouts).map(([playerId, amount]) => (
                        <div key={playerId} className="text-zinc-100">
                          {playerId}: <span className="font-semibold">{amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Payouts */}
          <div className="overflow-hidden border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-4 py-3">
              <div className="text-sm font-medium text-zinc-100">Total Payouts</div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(result.totalPayouts).map(([playerId, amount]) => (
                  <div
                    key={playerId}
                    className="rounded border border-zinc-800 bg-zinc-950 p-3"
                  >
                    <div className="text-sm text-zinc-500 mb-1">Player {playerId}</div>
                    <div className="text-2xl font-bold text-green-400">{amount}</div>
                  </div>
                ))}
              </div>
              {result.leftover > 0 && (
                <div className="mt-3 text-xs text-zinc-500">
                  Leftover chips: {result.leftover}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={calculate}
          className="h-11 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
        >
          <Play className="mr-2 h-4 w-4" />
          Calculate
        </Button>
        <Button
          onClick={reset}
          variant="outline"
          className="h-11 border-zinc-700 text-zinc-100 hover:bg-zinc-800 font-medium"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
