"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Map, Bell, PawPrint, Settings } from "lucide-react"

type Tab = "dashboard" | "map" | "alerts" | "livestock" | "settings"

interface MobileNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  alertCount: number
}

const tabs = [
  { id: "dashboard" as const, icon: LayoutDashboard, label: "Panel" },
  { id: "map" as const, icon: Map, label: "Mapa" },
  { id: "alerts" as const, icon: Bell, label: "Alertas" },
  { id: "livestock" as const, icon: PawPrint, label: "Ganado" },
  { id: "settings" as const, icon: Settings, label: "Config" },
]

export function MobileNav({ activeTab, onTabChange, alertCount }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom z-50 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const showBadge = tab.id === "alerts" && alertCount > 0

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 mb-1", isActive && "drop-shadow-[0_0_8px_#86efac]")} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold bg-rose-400 text-white rounded-full px-0.5">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px]", isActive && "font-medium")}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
