"use client";

import { useState } from "react";
import { Calculator, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type PlayerHand = {
  id: number;
  card1: string;
  card2: string;
};

type EquityResult = {
  player: number;
  winPct: number;
  tiePct: number;
  equityApprox: number;
};

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = [
  { symbol: "♠", code: "s", color: "text-zinc-100" },
  { symbol: "♥", code: "h", color: "text-red-500" },
  { symbol: "♦", code: "d", color: "text-red-500" },
  { symbol: "♣", code: "c", color: "text-zinc-100" },
];

export default function EquityPage() {
  const [players, setPlayers] = useState<PlayerHand[]>([
    { id: 1, card1: "", card2: "" },
    { id: 2, card1: "", card2: "" },
  ]);
  const [board, setBoard] = useState<string[]>(["", "", "", "", ""]);
  const [iters, setIters] = useState<number>(50000);
  const [results, setResults] = useState<EquityResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [nextId, setNextId] = useState(3);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{
    type: "player" | "board";
    id: number;
    field: "card1" | "card2" | "board";
    index?: number;
  } | null>(null);

  const addPlayer = () => {
    setPlayers([...players, { id: nextId, card1: "", card2: "" }]);
    setNextId(nextId + 1);
  };

  const removePlayer = (id: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((p) => p.id !== id));
    }
  };

  const openCardPicker = (
    type: "player" | "board",
    id: number,
    field: "card1" | "card2" | "board",
    index?: number
  ) => {
    setPickerTarget({ type, id, field, index });
    setShowCardPicker(true);
  };

  const selectCard = (card: string) => {
    if (!pickerTarget) return;

    if (pickerTarget.type === "player") {
      setPlayers(
        players.map((p) =>
          p.id === pickerTarget.id ? { ...p, [pickerTarget.field]: card } : p
        )
      );
    } else if (pickerTarget.type === "board" && pickerTarget.index !== undefined) {
      const newBoard = [...board];
      newBoard[pickerTarget.index] = card;
      setBoard(newBoard);
    }

    setShowCardPicker(false);
    setPickerTarget(null);
  };

  const getUsedCards = (): Set<string> => {
    const used = new Set<string>();
    players.forEach((p) => {
      if (p.card1) used.add(p.card1);
      if (p.card2) used.add(p.card2);
    });
    board.forEach((c) => {
      if (c) used.add(c);
    });
    return used;
  };

  const calculate = async () => {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const playersData = players.map((p) => {
        if (!p.card1 && !p.card2) return null;
        if (!p.card1 || !p.card2) throw new Error("Each player needs 2 cards or none");
        return [p.card1, p.card2];
      });

      const boardData = board.filter((c) => c.trim() !== "");

      const response = await fetch("/api/equity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          players: playersData,
          board: boardData,
          dead: [],
          iters,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Calculation failed");
      }

      setResults(data.result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPlayers([
      { id: 1, card1: "", card2: "" },
      { id: 2, card1: "", card2: "" },
    ]);
    setBoard(["", "", "", "", ""]);
    setResults(null);
    setError("");
    setNextId(3);
  };

  const usedCards = getUsedCards();

  const CardButton = ({ card, onClick }: { card: string; onClick: () => void }) => {
    const rank = card[0];
    const suit = SUITS.find((s) => s.code === card[1].toLowerCase());
    if (!suit) return null;

    return (
      <button
        onClick={onClick}
        className="flex h-12 w-9 flex-col items-center justify-center rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors"
      >
        <span className="text-sm font-bold text-zinc-100">{rank}</span>
        <span className={`text-lg ${suit.color}`}>{suit.symbol}</span>
      </button>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">Poker Equity Calculator</h2>
        <p className="text-xs text-zinc-500">Click cards to select</p>
      </div>

      {/* Players */}
      <div className="mb-4">
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
          {players.map((player, idx) => (
            <div key={player.id} className="flex items-center gap-2">
              <div className="w-8 text-xs text-zinc-500">P{idx + 1}</div>
              <button
                onClick={() => openCardPicker("player", player.id, "card1")}
                className="h-12 w-16 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-center text-sm font-semibold text-zinc-100 transition-colors"
              >
                {player.card1 ? (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-sm">{player.card1[0]}</span>
                    <span
                      className={
                        player.card1[1] === "h" || player.card1[1] === "d"
                          ? "text-red-500"
                          : "text-zinc-100"
                      }
                    >
                      {SUITS.find((s) => s.code === player.card1[1])?.symbol}
                    </span>
                  </div>
                ) : (
                  <span className="text-zinc-600">?</span>
                )}
              </button>
              <button
                onClick={() => openCardPicker("player", player.id, "card2")}
                className="h-12 w-16 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-center text-sm font-semibold text-zinc-100 transition-colors"
              >
                {player.card2 ? (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-sm">{player.card2[0]}</span>
                    <span
                      className={
                        player.card2[1] === "h" || player.card2[1] === "d"
                          ? "text-red-500"
                          : "text-zinc-100"
                      }
                    >
                      {SUITS.find((s) => s.code === player.card2[1])?.symbol}
                    </span>
                  </div>
                ) : (
                  <span className="text-zinc-600">?</span>
                )}
              </button>
              {players.length > 2 && (
                <button
                  onClick={() => removePlayer(player.id)}
                  className="ml-auto text-zinc-600 hover:text-zinc-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="mb-4">
        <div className="mb-2 text-sm font-medium text-zinc-400">Board</div>
        <div className="flex gap-2">
          {board.map((card, idx) => (
            <button
              key={idx}
              onClick={() => openCardPicker("board", 0, "board", idx)}
              className="h-12 w-16 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-center text-sm font-semibold text-zinc-100 transition-colors"
            >
              {card ? (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-sm">{card[0]}</span>
                  <span
                    className={
                      card[1] === "h" || card[1] === "d" ? "text-red-500" : "text-zinc-100"
                    }
                  >
                    {SUITS.find((s) => s.code === card[1])?.symbol}
                  </span>
                </div>
              ) : (
                <span className="text-zinc-600">?</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Iterations */}
      <div className="mb-4">
        <div className="mb-2 text-sm font-medium text-zinc-400">Simulations</div>
        <div className="flex gap-2">
          {[10000, 50000, 100000].map((n) => (
            <button
              key={n}
              onClick={() => setIters(n)}
              className={`px-3 py-2 text-xs rounded border transition-colors ${
                iters === n
                  ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-100"
              }`}
            >
              {n.toLocaleString()}
            </button>
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
      {results && (
        <div className="mb-4 overflow-hidden border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="text-sm font-medium text-zinc-100">Results</div>
          </div>
          <div className="p-3">
            {results.map((r) => (
              <div
                key={r.player}
                className="mb-3 rounded border border-zinc-800 bg-zinc-950 p-3 last:mb-0"
              >
                <div className="mb-2 text-sm font-semibold text-zinc-100">
                  Player {r.player}
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-zinc-500">Win</div>
                    <div className="text-lg font-semibold text-green-400">
                      {(r.winPct * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Tie</div>
                    <div className="text-lg font-semibold text-zinc-400">
                      {(r.tiePct * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Equity</div>
                    <div className="text-lg font-semibold text-zinc-100">
                      {(r.equityApprox * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={calculate}
          disabled={loading}
          className="h-11 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium disabled:opacity-30"
        >
          <Calculator className="mr-2 h-4 w-4" />
          {loading ? "Calculating..." : "Calculate"}
        </Button>
        <Button
          onClick={reset}
          variant="outline"
          className="h-11 border-zinc-700 text-zinc-100 hover:bg-zinc-800 font-medium"
        >
          Reset
        </Button>
      </div>

      {/* Card Picker Modal */}
      {showCardPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Select Card</h3>
              <button
                onClick={() => {
                  setShowCardPicker(false);
                  setPickerTarget(null);
                }}
                className="text-zinc-500 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {RANKS.map((rank) => (
                <div key={rank} className="flex gap-2">
                  {SUITS.map((suit) => {
                    const card = `${rank}${suit.code}`;
                    const isUsed = usedCards.has(card);
                    return (
                      <button
                        key={card}
                        onClick={() => !isUsed && selectCard(card)}
                        disabled={isUsed}
                        className={`flex h-12 flex-1 flex-col items-center justify-center rounded border transition-colors ${
                          isUsed
                            ? "border-zinc-800 bg-zinc-950 opacity-30 cursor-not-allowed"
                            : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                        }`}
                      >
                        <span className="text-sm font-bold text-zinc-100">{rank}</span>
                        <span className={`text-lg ${suit.color}`}>{suit.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button
                onClick={() => {
                  if (pickerTarget?.type === "player") {
                    setPlayers(
                      players.map((p) =>
                        p.id === pickerTarget.id ? { ...p, [pickerTarget.field]: "" } : p
                      )
                    );
                  } else if (
                    pickerTarget?.type === "board" &&
                    pickerTarget.index !== undefined
                  ) {
                    const newBoard = [...board];
                    newBoard[pickerTarget.index] = "";
                    setBoard(newBoard);
                  }
                  setShowCardPicker(false);
                  setPickerTarget(null);
                }}
                variant="outline"
                className="w-full border-zinc-700 text-zinc-100 hover:bg-zinc-800"
              >
                Clear Card
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
