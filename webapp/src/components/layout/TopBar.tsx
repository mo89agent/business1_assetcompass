"use client";

import { useRouter } from "next/navigation";
import { Bell, Search, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface TopBarProps {
  userName: string;
  workspaceId: string;
}

export function TopBar({ userName }: TopBarProps) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-slate-200 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        <div className="relative w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search assets, transactions…"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Alerts */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-slate-700 font-medium hidden md:block">
            {userName}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
