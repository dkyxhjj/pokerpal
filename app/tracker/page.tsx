"use client";

import { useState } from "react";
import { Minus, Plus, Share2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Player {
  id: number;
  name: string;
  bullets: number;
  remainingChips: number;
}

export default function TrackerPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [chipsPerHand, setChipsPerHand] = useState<number>(10);
  const [nextId, setNextId] = useState<number>(1);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const addPlayer = () => {
    setPromptValue("");
    setShowPrompt(true);
  };

  const handleAddPlayerConfirm = () => {
    if (promptValue && promptValue.trim()) {
      setPlayers([
        ...players,
        {
          id: nextId,
          name: promptValue.trim(),
          bullets: 0,
          remainingChips: 0,
        },
      ]);
      setNextId(nextId + 1);
    }
    setShowPrompt(false);
    setPromptValue("");
  };

  const updateBullets = (id: number, delta: number) => {
    setPlayers(
      players.map((player) =>
        player.id === id
          ? {
              ...player,
              bullets: Math.max(0, player.bullets + delta),
            }
          : player
      )
    );
  };

  const updateRemainingChips = (id: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPlayers(
      players.map((player) =>
        player.id === id ? { ...player, remainingChips: numValue } : player
      )
    );
  };

  const calculateProfitLoss = (player: Player): number => {
    const totalBuyIn = player.bullets * chipsPerHand;
    return player.remainingChips - totalBuyIn;
  };

  const totalProfitLoss = players.reduce((sum, player) => {
    return sum + calculateProfitLoss(player);
  }, 0);

  const totalBuyIns = players.reduce((sum, player) => {
    return sum + (player.bullets * chipsPerHand);
  }, 0);

  const totalCashouts = players.reduce((sum, player) => {
    return sum + player.remainingChips;
  }, 0);

  const isBalanced = Math.abs(totalProfitLoss) < 0.01;
  const hasCashouts = players.some((player) => player.remainingChips > 0);

  const handleReset = () => {
    setPlayers([]);
    setNextId(1);
  };

  const handleShare = () => {
    const results = players
      .map((player) => {
        const pl = calculateProfitLoss(player);
        return `${player.name}: ${pl >= 0 ? "+" : ""}${pl.toFixed(2)}`;
      })
      .join("\n");

    const summary = `\nTotal Buy-ins: ${totalBuyIns.toFixed(2)}\nTotal Cashouts: ${totalCashouts.toFixed(2)}\nDifference: ${totalProfitLoss.toFixed(2)}`;

    navigator.clipboard.writeText(results + summary);
    setAlertMessage("Results copied to clipboard!");
    setShowAlert(true);
  };

  return (
    <div className="mx-auto w-full max-w-[560px]">
      {/* Top Bar */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Tracker</h1>

        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-zinc-500">$/Buy-in</div>
          <Input
            type="number"
            value={chipsPerHand}
            onChange={(e) => setChipsPerHand(parseFloat(e.target.value) || 0)}
            className="h-9 w-16 bg-zinc-900 border border-zinc-700 text-center text-sm font-semibold text-zinc-100 ring-0 focus-visible:border-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-500"
          />
        </div>
      </div>

      {/* Add Player */}
      <div className="mb-3">
        <Button
          onClick={addPlayer}
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-full"
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          <span className="text-xs font-medium">Add player</span>
        </Button>
      </div>

      {/* Ledger Card */}
      <div className="overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm shadow-xl">
        {/* Header strip (labels) */}
        <div className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr] gap-3 border-b border-zinc-800/50 bg-zinc-900 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <div>Name</div>
          <div className="text-center">Buy-ins</div>
          <div className="text-center">Cashout</div>
          <div className="text-right">P/L</div>
        </div>

        {/* Scroll area */}
        <div className="max-h-[480px] overflow-y-auto p-2">
          {players.length === 0 ? (
            <div className="px-12 py-24 text-center text-sm text-zinc-600">
              No players yet. Add a player to start.
            </div>
          ) : (
            <div className="space-y-0">
              {players.map((player) => {
                const profitLoss = calculateProfitLoss(player);
                return (
                  <div
                    key={player.id}
                    className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr] gap-4 items-center border-b border-zinc-800/30 px-5 py-4 hover:bg-zinc-800/20 transition-all last:border-0"
                  >
                    {/* Name */}
                    <div className="text-sm font-semibold text-zinc-100 truncate">
                      {player.name}
                    </div>

                    {/* Buy-ins Stepper */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateBullets(player.id, -1)}
                        className="h-7 w-7 rounded border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-lg font-bold text-zinc-100 tabular-nums">
                        {player.bullets}
                      </span>
                      <button
                        onClick={() => updateBullets(player.id, 1)}
                        className="h-7 w-7 rounded border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Cashout Input */}
                    <div className="flex justify-center">
                      <Input
                        type="number"
                        value={player.remainingChips || ""}
                        onChange={(e) => updateRemainingChips(player.id, e.target.value)}
                        placeholder="0"
                        className={`h-9 w-24 rounded bg-zinc-950 text-center text-base font-bold ring-0 border focus-visible:border-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-500 placeholder:text-zinc-700 tabular-nums ${
                          profitLoss > 0
                            ? "text-green-400 border-green-900/50"
                            : profitLoss < 0
                            ? "text-red-400 border-red-900/50"
                            : "text-zinc-100 border-zinc-700/50"
                        }`}
                      />
                    </div>

                    {/* P/L */}
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold tabular-nums ${
                          profitLoss > 0
                            ? "text-green-400"
                            : profitLoss < 0
                            ? "text-red-400"
                            : "text-zinc-600"
                        }`}
                      >
                        {profitLoss > 0 ? "+" : ""}
                        {profitLoss.toFixed(0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Balance Warning */}
          {players.length > 0 && hasCashouts && !isBalanced && (
            <div className="border-t border-zinc-800 bg-zinc-800/50 px-5 py-3 text-center">
              <span className="text-xs font-medium text-zinc-400">
                ⚠️ Ledger is not balanced
              </span>
            </div>
          )}

          {/* Summary Strip */}
          {players.length > 0 && hasCashouts && (
            <div className="border-t border-zinc-800 bg-zinc-800/30 px-5 py-4">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">Total Buy-ins</div>
                  <div className="text-2xl font-semibold text-zinc-100 tabular-nums">
                    {totalBuyIns.toFixed(0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">Total Cashouts</div>
                  <div className="text-2xl font-semibold text-zinc-400 tabular-nums">
                    {totalCashouts.toFixed(0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">Difference</div>
                  <div
                    className={`text-2xl font-semibold tabular-nums ${
                      isBalanced ? "text-zinc-100" : "text-zinc-300"
                    }`}
                  >
                    {totalProfitLoss >= 0 ? "+" : ""}
                    {totalProfitLoss.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer buttons */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          onClick={handleShare}
          disabled={players.length === 0}
          className="h-10 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-semibold text-sm disabled:opacity-30 shadow-sm"
        >
          <Share2 className="mr-2 h-3.5 w-3.5" />
          Share
        </Button>
        <Button
          onClick={handleReset}
          disabled={players.length === 0}
          variant="outline"
          className="h-10 border-zinc-700/50 text-zinc-100 hover:bg-zinc-800/50 hover:border-zinc-600 font-semibold text-sm disabled:opacity-30"
        >
          Reset
        </Button>
      </div>

      {/* Custom Prompt Dialog */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-800/50 bg-zinc-900/95 backdrop-blur-sm p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Add Player</h3>
              <button
                onClick={() => setShowPrompt(false)}
                className="text-zinc-500 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Input
              type="text"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPlayerConfirm()}
              placeholder="Enter player name"
              autoFocus
              className="mb-4 h-10 rounded bg-zinc-950 border border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-500"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => setShowPrompt(false)}
                variant="outline"
                className="flex-1 border-zinc-700/50 text-zinc-100 hover:bg-zinc-800/50 hover:border-zinc-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPlayerConfirm}
                className="flex-1 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 shadow-sm"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Dialog */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-800/50 bg-zinc-900/95 backdrop-blur-sm p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Success</h3>
              <button
                onClick={() => setShowAlert(false)}
                className="text-zinc-500 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-zinc-400">{alertMessage}</p>
            <Button
              onClick={() => setShowAlert(false)}
              className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 shadow-sm"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
