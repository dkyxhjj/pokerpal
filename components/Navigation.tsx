"use client";

import { usePathname, useRouter } from "next/navigation";
import { Calculator, Users, UserPlus, Coins } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { path: "/tracker", label: "Tracker", icon: UserPlus },
    { path: "/equity", label: "Equity", icon: Calculator },
    { path: "/sidepot", label: "Side Pot", icon: Users },
    { path: "/coinflip", label: "Call/Fold", icon: Coins },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="flex gap-1 rounded-full border border-zinc-800 bg-zinc-900/95 backdrop-blur-sm p-1.5 shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-zinc-100 text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
