"use client";

import Link from "next/link";
import { LayoutDashboard, FileText, Package, Grid, Receipt } from "lucide-react";

type SidebarTab = "dashboard" | "prescription" | "inventory" | "rackManagement" | "billing";

type AppSidebarProps = {
  active: SidebarTab;
};

const NAV_ITEMS: Array<{
  key: SidebarTab;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
    { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "prescription", label: "Prescription Reader", href: "/prescription", icon: FileText },
    { key: "inventory", label: "Inventory", href: "/inventory", icon: Package },
    { key: "rackManagement", label: "Rack Management", href: "/rackManagement", icon: Grid },
    { key: "billing", label: "Billing", href: "/billing", icon: Receipt },
  ];

export default function AppSidebar({ active }: AppSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">
      <div className="border-b border-gray-200 px-7 py-7">
        <div className="flex items-center gap-4">
          <img src="logo.png" alt="logo" />
        </div>
      </div>

      <nav className="space-y-1 py-8">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-4 px-8 py-3 text-sm font-bold transition ${isActive ? "bg-[#10b7ab] text-white shadow-sm" : "text-slate-700 hover:bg-gray-100"
                }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
