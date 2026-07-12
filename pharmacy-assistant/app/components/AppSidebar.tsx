"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, FileText, Package, Grid, Receipt, Smartphone } from "lucide-react";
import LinkPhoneModal from "./LinkPhoneModal";

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
  const [isLinkPhoneOpen, setIsLinkPhoneOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">
        <div className="border-b border-gray-200 px-7 py-7">
          <div className="flex items-center gap-4">
            <img src="logo.png" alt="logo" />
          </div>
        </div>

        <nav className="space-y-1 py-8 flex-1">
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

        {/* Link Phone Button */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setIsLinkPhoneOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              color: '#6366f1',
            }}
          >
            <Smartphone size={18} />
            <span>Link Phone</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '2px 6px',
              borderRadius: '4px',
              color: '#6366f1',
            }}>
              Camera
            </span>
          </button>
        </div>
      </aside>

      {/* Link Phone Modal */}
      <LinkPhoneModal
        isOpen={isLinkPhoneOpen}
        onClose={() => setIsLinkPhoneOpen(false)}
      />
    </>
  );
}
