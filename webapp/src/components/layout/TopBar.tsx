"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { GlobalSearch } from "./GlobalSearch";
import type { PositionRow } from "@/lib/types";

interface TopBarProps {
  userName: string;
  workspaceId: string;
  positions: PositionRow[];
}

export function TopBar({ userName, positions }: TopBarProps) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-slate-200 shrink-0">
      <div className="flex items-center flex-1 max-w-sm">
        <GlobalSearch positions={positions} />
      </div>

      <div className="flex items-center gap-2 ml-4">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2 pl-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-slate-700 font-medium hidden md:block">{userName}</span>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          title="Abmelden"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
