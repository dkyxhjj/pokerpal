"use client";

import { useState } from "react";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CoinFlipPage() {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<"CALL" | "FOLD" | null>(null);
  const [flipCount, setFlipCount] = useState(0);

  const flipCoin = () => {
    setIsFlipping(true);
    setResult(null);
    setFlipCount((prev) => prev + 1);

    // Simulate coin flip animation
    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? "CALL" : "FOLD";
      setResult(outcome);
      setIsFlipping(false);
    }, 1500);
  };

  return (
    <div className="mx-auto w-full max-w-[560px]">
      {/* Header */}
      <div className="mb-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">Call or Fold?</h1>
      </div>

      {/* Coin */}
      <div className="mb-16 flex items-center justify-center">
        <button
          onClick={flipCoin}
          disabled={isFlipping}
          className={`relative h-64 w-64 transition-all duration-300 ${
            isFlipping ? "animate-flip" : "hover:scale-105"
          }`}
          key={flipCount}
        >
          <div
            className={`absolute inset-0 flex items-center justify-center rounded-full border-2 transition-all duration-500 shadow-2xl ${
              result === "CALL"
                ? "border-green-500/50 bg-zinc-900 shadow-green-500/20"
                : result === "FOLD"
                ? "border-red-500/50 bg-zinc-900 shadow-red-500/20"
                : "border-zinc-800/50 bg-zinc-900 hover:border-zinc-700 hover:shadow-zinc-800/50"
            }`}
          >
            {!isFlipping && result && (
              <div
                className={`text-7xl font-black tracking-tight ${
                  result === "CALL" ? "text-green-400" : "text-red-400"
                }`}
              >
                {result}
              </div>
            )}
            {isFlipping && (
              <Coins className="h-28 w-28 text-zinc-600 animate-spin" />
            )}
            {!isFlipping && !result && (
              <Coins className="h-28 w-28 text-zinc-700" />
            )}
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="text-center text-xs font-medium text-zinc-600">
        <p>Click coin to flip</p>
      </div>

      <style jsx>{`
        @keyframes flip {
          0% {
            transform: rotateY(0deg) scale(1);
          }
          25% {
            transform: rotateY(180deg) scale(1.1);
          }
          50% {
            transform: rotateY(360deg) scale(1);
          }
          75% {
            transform: rotateY(540deg) scale(1.1);
          }
          100% {
            transform: rotateY(720deg) scale(1);
          }
        }

        .animate-flip {
          animation: flip 1.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
