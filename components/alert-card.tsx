"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AlertTriangle, Flame, Thermometer, Droplets, Activity } from "lucide-react"

export type AlertType = "fire" | "temperature" | "humidity" | "animal" | "general"
export type AlertSeverity = "low" | "medium" | "high" | "critical"

interface AlertCardProps {
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  timestamp: string
  isNew?: boolean
}

const alertIcons: Record<AlertType, typeof AlertTriangle> = {
  fire: Flame,
  temperature: Thermometer,
  humidity: Droplets,
  animal: Activity,
  general: AlertTriangle,
}

const severityColors: Record<AlertSeverity, string> = {
  low: "border-l-emerald-300 bg-emerald-50",
  medium: "border-l-amber-300 bg-amber-50",
  high: "border-l-rose-300 bg-rose-50",
  critical: "border-l-rose-400 bg-rose-100 animate-pulse",
}

const severityIconColors: Record<AlertSeverity, string> = {
  low: "text-emerald-500",
  medium: "text-amber-500",
  high: "text-rose-400",
  critical: "text-rose-500",
}

export function AlertCard({
  type,
  severity,
  title,
  description,
  timestamp,
  isNew,
}: AlertCardProps) {
  const Icon = alertIcons[type]

  return (
    <Card
      className={cn(
        "border-l-4 border-border/50 transition-all duration-300",
        severityColors[severity]
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5", severityIconColors[severity])}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {title}
              </h4>
              {isNew && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-400 text-white rounded">
                  NUEVA
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {description}
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {timestamp}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
