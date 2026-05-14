"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface ZoneData {
  zone: string
  count: number
  status: "normal" | "warning" | "danger"
}

const initialData: ZoneData[] = [
  { zone: "Norte", count: 18, status: "normal" },
  { zone: "Sur", count: 12, status: "normal" },
  { zone: "Este", count: 8, status: "warning" },
  { zone: "Oeste", count: 13, status: "normal" },
]

const zoneColors = {
  Norte: "#10b981", // Emerald
  Sur: "#0ea5e9",   // Sky
  Este: "#f59e0b",  // Amber
  Oeste: "#8b5cf6",  // Violet
}

export function LivestockChart() {
  const [data, setData] = useState<ZoneData[]>(initialData)

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((zone) => {
          const change = Math.floor(Math.random() * 3) - 1
          const newCount = Math.max(0, Math.min(25, zone.count + change))
          const status: ZoneData["status"] =
            newCount < 5 ? "danger" : newCount < 10 ? "warning" : "normal"
          return { ...zone, count: newCount, status }
        })
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const totalCount = data.reduce((sum, zone) => sum + zone.count, 0)

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Distribución de Ganado
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Total: <span className="font-mono text-primary">{totalCount}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="zone"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 10 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={zoneColors[entry.zone as keyof typeof zoneColors]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
