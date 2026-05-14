"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Wifi, Server, Camera, Radio, CheckCircle2, AlertCircle } from "lucide-react"

interface SystemItem {
  id: string
  name: string
  icon: typeof Wifi
  status: "online" | "offline" | "warning"
  latency?: number
}

const initialSystems: SystemItem[] = [
  { id: "s1", name: "Conectividad", icon: Wifi, status: "online", latency: 23 },
  { id: "s2", name: "Servidor IA", icon: Server, status: "online", latency: 45 },
  { id: "s3", name: "Cámaras Dron", icon: Camera, status: "online", latency: 12 },
  { id: "s4", name: "Sensores IoT", icon: Radio, status: "online", latency: 8 },
]

const statusColors = {
  online: "text-emerald-400",
  offline: "text-rose-400",
  warning: "text-amber-400",
}

const statusDotColors = {
  online: "bg-emerald-400",
  offline: "bg-rose-400",
  warning: "bg-amber-400",
}

export function SystemStatus() {
  const [systems, setSystems] = useState<SystemItem[]>(initialSystems)

  useEffect(() => {
    const interval = setInterval(() => {
      setSystems((prev) =>
        prev.map((system) => {
          const rand = Math.random()
          let newStatus: SystemItem["status"] = system.status

          // Small chance of status change
          if (rand < 0.02) {
            newStatus = "warning"
          } else if (rand < 0.01) {
            newStatus = "offline"
          } else if (rand > 0.05) {
            newStatus = "online"
          }

          // Update latency
          const latencyChange = Math.floor(Math.random() * 20) - 10
          const newLatency = Math.max(
            5,
            Math.min(200, (system.latency || 50) + latencyChange)
          )

          return { ...system, status: newStatus, latency: newLatency }
        })
      )
    }, 3000)

    const handleUpdate = (e: any) => {
      if (e.detail.action === "riego") {
        setSystems(prev => prev.map(s => s.id === "s4" ? { ...s, name: "Sistema de Riego (Activo)" } : s))
        setTimeout(() => {
          setSystems(prev => prev.map(s => s.id === "s4" ? { ...s, name: "Sensores IoT" } : s))
        }, 15000)
      }
    }
    window.addEventListener('update-system-status', handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('update-system-status', handleUpdate)
    }
  }, [])

  const onlineCount = systems.filter((s) => s.status === "online").length

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
          <div className="flex items-center gap-1.5">
            {onlineCount === systems.length ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-400" />
            )}
            <span className="text-xs text-muted-foreground">
              {onlineCount}/{systems.length} activos
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {systems.map((system) => {
          const Icon = system.icon
          return (
            <div
              key={system.id}
              className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", statusColors[system.status])} />
                <span className="text-sm">{system.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {system.latency}ms
                </span>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    statusDotColors[system.status],
                    system.status === "online" && "animate-pulse"
                  )}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
