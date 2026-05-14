"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  icon: LucideIcon
  trend?: "up" | "down" | "stable"
  trendValue?: string
  status?: "normal" | "warning" | "danger"
  className?: string
}

export function StatsCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  status = "normal",
  className,
}: StatsCardProps) {
  const statusColors = {
    normal: "text-emerald-500",
    warning: "text-amber-400",
    danger: "text-rose-400",
  }

  const statusBg = {
    normal: "bg-emerald-100",
    warning: "bg-amber-100",
    danger: "bg-rose-100",
  }

  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-2xl font-bold", statusColors[status])}>
                {value}
              </span>
              {unit && (
                <span className="text-sm text-muted-foreground">{unit}</span>
              )}
            </div>
            {trend && trendValue && (
              <p className={cn(
                "text-xs",
                trend === "up" && "text-destructive",
                trend === "down" && "text-primary",
                trend === "stable" && "text-muted-foreground"
              )}>
                {trend === "up" && "↑"}
                {trend === "down" && "↓"}
                {trend === "stable" && "→"} {trendValue}
              </p>
            )}
          </div>
          <div className={cn("p-2 rounded-lg", statusBg[status])}>
            <Icon className={cn("h-5 w-5", statusColors[status])} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
