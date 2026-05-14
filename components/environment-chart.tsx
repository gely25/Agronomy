"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface DataPoint {
  time: string
  temperature: number
  humidity: number
}

function generateInitialData(): DataPoint[] {
  const data: DataPoint[] = []
  const now = new Date()

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    const hour = time.getHours()

    // Simulate temperature curve (lower at night, higher during day)
    const baseTemp = 25
    const tempVariation = Math.sin(((hour - 6) / 24) * Math.PI * 2) * 10
    const temperature = Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 4)

    // Humidity inversely related to temperature
    const baseHumidity = 50
    const humidityVariation = -tempVariation * 2
    const humidity = Math.round(Math.max(15, Math.min(85, baseHumidity + humidityVariation + (Math.random() - 0.5) * 10)))

    data.push({
      time: `${hour.toString().padStart(2, "0")}:00`,
      temperature: Math.max(15, Math.min(45, temperature)),
      humidity,
    })
  }

  return data
}

export function EnvironmentChart({ currentTemp, currentHumidity }: { currentTemp: number, currentHumidity: number }) {
  const [data, setData] = useState<DataPoint[]>([])

  useEffect(() => {
    setData(generateInitialData())
  }, [])

  useEffect(() => {
    if (data.length === 0) return

    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()

    setData((prev) => {
      const newData = [...prev.slice(1)]
      newData.push({
        time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        temperature: Math.round(currentTemp),
        humidity: Math.round(currentHumidity),
      })
      return newData
    })
  }, [currentTemp, currentHumidity])

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Histórico Ambiental (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fca5a5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#fca5a5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.65 0 0)", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #d1fae5",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                labelStyle={{ color: "#374151" }}
              />
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#f87171"
                fill="url(#tempGradient)"
                strokeWidth={2}
                name="Temp (C)"
              />
              <Area
                type="monotone"
                dataKey="humidity"
                stroke="#60a5fa"
                fill="url(#humidityGradient)"
                strokeWidth={2}
                name="Humedad (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-rose-400 rounded" />
            <span className="text-xs text-muted-foreground">Temperatura</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-sky-400 rounded" />
            <span className="text-xs text-muted-foreground">Humedad</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
