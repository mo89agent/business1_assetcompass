"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Bitcoin,
  Landmark,
  ArrowLeftRight,
  Upload,
  FlaskConical,
  FolderOpen,
  Bell,
  Settings,
  ChevronRight,
  Banknote,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Holdings", href: "/dashboard/holdings", icon: TrendingUp },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { label: "Real Estate", href: "/dashboard/real-estate", icon: Building2 },
  { label: "Crypto", href: "/dashboard/crypto", icon: Bitcoin },
  { label: "Cash & Debt", href: "/dashboard/cash-debt", icon: Landmark },
  { label: "Dividenden", href: "/dashboard/dividends", icon: Banknote },
  { label: "Scenario Lab", href: "/dashboard/scenarios", icon: FlaskConical },
  { label: "Import", href: "/dashboard/import", icon: Upload },
  { label: "Documents", href: "/dashboard/documents", icon: FolderOpen },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell, badge: 3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  workspaceName: string;
}

export function Sidebar({ workspaceName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-60 bg-[#0f172a] text-slate-300 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">AC</span>
        </div>
        <div className="min-w-0">
          <div className="text-white font-semibold text-sm leading-tight truncate">
            AssetCompass
          </div>
          <div className="text-slate-500 text-xs truncate mt-0.5">{workspaceName}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/50 px-3 py-3">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors group">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
            {workspaceName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-slate-300 text-xs font-medium truncate">{workspaceName}</div>
          </div>
          <ChevronRight size={12} className="text-slate-600 group-hover:text-slate-400" />
        </div>
      </div>
    </div>
  );
}
