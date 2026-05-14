"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Thermometer,
  Droplets,
  Flame,
  Activity,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Cpu,
  MapPin,
  Radio,
  Plane,
  Syringe,
  Droplet,
  Users,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { toast } from "sonner"

type SensorSource = 
  | { type: "biometric"; animalId: string; sensorId: string }
  | { type: "environmental"; zone: string; sensorId: string }
  | { type: "drone"; droneId: string }
  | null

interface HistoryRecord {
  id: string
  date: string
  time: string
  type: "temperature" | "humidity" | "fire" | "livestock"
  event: string
  value?: string
  severity: "info" | "warning" | "critical"
  animalId?: string
  sensorSource?: SensorSource
  resolved?: boolean
  resolution?: string
  resolvedBy?: string
  resolvedAt?: string
}

interface HistoryViewProps {
  filterAnimalId?: string | null
  onClearFilter?: () => void
  onResolutionSubmit?: (resolution: string, record: HistoryRecord) => void
}

const initialHistoryData: HistoryRecord[] = [
  {
    id: "h1",
    date: "13 May 2026",
    time: "14:32",
    type: "temperature",
    event: "Temperatura ambiental critica",
    value: "42C",
    severity: "warning",
    sensorSource: { type: "environmental", zone: "Sector Norte - Pastizal", sensorId: "ENV-T-003" },
  },
  {
    id: "h1b",
    date: "13 May 2026",
    time: "13:50",
    type: "temperature",
    event: "Fiebre detectada en animal",
    value: "39.8C",
    severity: "critical",
    animalId: "V-002",
    sensorSource: { type: "biometric", animalId: "V-002", sensorId: "BIO-002" },
  },
  {
    id: "h2",
    date: "13 May 2026",
    time: "12:15",
    type: "livestock",
    event: "Ganado reubicado a zona norte",
    value: "23 cabezas",
    severity: "info",
    animalId: "V-003",
    sensorSource: { type: "drone", droneId: "AgroEye-01" },
  },
  {
    id: "h3",
    date: "13 May 2026",
    time: "09:45",
    type: "humidity",
    event: "Humedad critica - riesgo de sequia",
    value: "18%",
    severity: "critical",
    sensorSource: { type: "environmental", zone: "Zona Este - Cultivo", sensorId: "ENV-H-001" },
  },
  {
    id: "med-1",
    date: "15 Mar 2026",
    time: "10:00",
    type: "livestock",
    event: "Vacuna anual aplicada",
    severity: "info",
    animalId: "V-001",
    resolved: true,
    resolution: "Dosis completa administrada",
    resolvedBy: "Dr. Martinez",
    resolvedAt: "10:30",
  },
  {
    id: "med-2",
    date: "10 May 2026",
    time: "14:20",
    type: "temperature",
    event: "Temperatura elevada detectada",
    value: "39.1C",
    severity: "warning",
    animalId: "V-001",
    sensorSource: { type: "biometric", animalId: "V-001", sensorId: "BIO-001" },
    resolved: true,
    resolution: "Reubicado a zona con sombra e hidratacion",
    resolvedBy: "Operador Juan",
    resolvedAt: "15:00",
  },
  {
    id: "h4",
    date: "12 May 2026",
    time: "18:20",
    type: "fire",
    event: "Alerta de incendio despejada",
    severity: "info",
    sensorSource: { type: "environmental", zone: "Limite Noreste", sensorId: "ENV-IR-002" },
    resolved: true,
    resolution: "Falsa alarma - sensor recalibrado",
    resolvedBy: "Operador Juan",
    resolvedAt: "18:45",
  },
  {
    id: "h5",
    date: "12 May 2026",
    time: "16:05",
    type: "fire",
    event: "Riesgo de incendio alto",
    severity: "critical",
    sensorSource: { type: "environmental", zone: "Zona Este - Sector 4", sensorId: "ENV-IR-001" },
    resolved: true,
    resolution: "Se activo sistema de riego preventivo en Zona Este",
    resolvedBy: "Sistema Automatico",
    resolvedAt: "16:15",
  },
  {
    id: "h6",
    date: "12 May 2026",
    time: "11:30",
    type: "livestock",
    event: "Animal inmovil detectado",
    severity: "warning",
    animalId: "V-005",
    sensorSource: { type: "biometric", animalId: "V-005", sensorId: "BIO-005" },
    resolved: true,
    resolution: "Se envio veterinario - animal descansando normalmente",
    resolvedBy: "Dr. Martinez",
    resolvedAt: "12:00",
  },
  {
    id: "h9",
    date: "12 May 2026",
    time: "10:45",
    type: "temperature",
    event: "Temperatura corporal elevada",
    value: "39.5C",
    severity: "warning",
    animalId: "V-005",
    sensorSource: { type: "biometric", animalId: "V-005", sensorId: "BIO-005" },
  },
  {
    id: "h10",
    date: "12 May 2026",
    time: "09:30",
    type: "livestock",
    event: "Movimiento reducido detectado",
    severity: "info",
    animalId: "V-005",
    sensorSource: { type: "biometric", animalId: "V-005", sensorId: "BIO-005" },
    resolved: true,
    resolution: "Monitoreo continuo activado",
    resolvedBy: "Sistema IA",
    resolvedAt: "09:35",
  },
  {
    id: "h1c",
    date: "12 May 2026",
    time: "08:15",
    type: "temperature",
    event: "Estres termico detectado en zona",
    value: "38C",
    severity: "warning",
    sensorSource: { type: "environmental", zone: "Potrero Central", sensorId: "ENV-T-002" },
    resolved: true,
    resolution: "Se evacuo ganado a zona con sombra",
    resolvedBy: "Operador Maria",
    resolvedAt: "08:45",
  },
  {
    id: "h11",
    date: "11 May 2026",
    time: "16:20",
    type: "livestock",
    event: "Zona de pastoreo cambiada",
    severity: "info",
    animalId: "V-001",
    sensorSource: { type: "drone", droneId: "AgroEye-01" },
  },
  {
    id: "h12",
    date: "11 May 2026",
    time: "14:00",
    type: "livestock",
    event: "Revision veterinaria completada",
    severity: "info",
    animalId: "V-002",
    sensorSource: { type: "biometric", animalId: "V-002", sensorId: "BIO-002" },
    resolved: true,
    resolution: "Chequeo de rutina - todo en orden",
    resolvedBy: "Dr. Martinez",
    resolvedAt: "14:30",
  },
  {
    id: "med-3",
    date: "11 May 2026",
    time: "09:00",
    type: "livestock",
    event: "Revision veterinaria completada",
    severity: "info",
    animalId: "V-001",
    resolved: true,
    resolution: "Signos vitales estables, recuperado de fiebre",
    resolvedBy: "Dr. Martinez",
    resolvedAt: "09:30",
  },
  {
    id: "h7",
    date: "11 May 2026",
    time: "20:15",
    type: "temperature",
    event: "Descenso de temperatura nocturna",
    value: "14C",
    severity: "info",
    sensorSource: { type: "environmental", zone: "Zona General", sensorId: "ENV-T-001" },
  },
  {
    id: "h8",
    date: "11 May 2026",
    time: "15:00",
    type: "humidity",
    event: "Humedad normalizada",
    value: "45%",
    severity: "info",
    sensorSource: { type: "environmental", zone: "Zona Este - Cultivo", sensorId: "ENV-H-001" },
  },
]

const typeIcons = {
  temperature: Thermometer,
  humidity: Droplets,
  fire: Flame,
  livestock: Activity,
}

const typeColors = {
  temperature: "text-rose-500",
  humidity: "text-sky-500",
  fire: "text-amber-500",
  livestock: "text-emerald-500",
}

const severityBadge = {
  info: "bg-emerald-100 text-emerald-600 border-emerald-200",
  warning: "bg-amber-100 text-amber-600 border-amber-200",
  critical: "bg-rose-100 text-rose-600 border-rose-200",
}

type FilterType = "all" | "temperature" | "humidity" | "fire" | "livestock" | "pending"

// Opciones de resolucion segun tipo de sensor
const biometricResolutionOptions = [
  "Se envio veterinario",
  "Se administro medicamento",
  "Se movio manualmente al animal",
  "Se aumento hidratacion",
  "Animal trasladado a sombra",
  "Chequeo completado - normal",
  "Se programo seguimiento veterinario",
]

const environmentalResolutionOptions = [
  "Se activo sistema de riego",
  "Se evacuo ganado de la zona",
  "Se alertó al personal de campo",
  "Se activo protocolo anti-incendio",
  "Sensor recalibrado",
  "Se verifico in situ - sin problemas",
  "Se instalo sombreadero temporal",
]

const droneResolutionOptions = [
  "Dron retornado a base",
  "Se cambio a dron de respaldo",
  "Mision reprogramada",
  "Bateria reemplazada",
  "Mantenimiento completado",
]

const getResolutionOptions = (sensorSource: SensorSource) => {
  if (!sensorSource) return biometricResolutionOptions
  switch (sensorSource.type) {
    case "biometric": return biometricResolutionOptions
    case "environmental": return environmentalResolutionOptions
    case "drone": return droneResolutionOptions
    default: return biometricResolutionOptions
  }
}

export function HistoryView({ filterAnimalId, onClearFilter, onResolutionSubmit }: HistoryViewProps) {
  const [filter, setFilter] = useState<FilterType>("all")
  const [historyData, setHistoryData] = useState(initialHistoryData)
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)
  const [resolvingRecord, setResolvingRecord] = useState<string | null>(null)
  const [selectedResolution, setSelectedResolution] = useState("")
  const [customResolution, setCustomResolution] = useState("")

  const filteredData = filterAnimalId
    ? historyData.filter((record) => record.animalId === filterAnimalId)
    : filter === "all"
      ? historyData
      : filter === "pending"
        ? historyData.filter((record) => !record.resolved && (record.severity === "warning" || record.severity === "critical"))
        : historyData.filter((record) => record.type === filter)

  const pendingCount = historyData.filter(r => !r.resolved && (r.severity === "warning" || r.severity === "critical")).length

  const filters: { id: FilterType; label: string; count?: number }[] = [
    { id: "all", label: "Todos" },
    { id: "pending", label: "Pendientes", count: pendingCount },
    { id: "temperature", label: "Temperatura" },
    { id: "humidity", label: "Humedad" },
    { id: "fire", label: "Incendio" },
    { id: "livestock", label: "Ganado" },
  ]

  // Generar datos simulados de tendencia de temperatura para el animal
  const animalTrendData = filterAnimalId ? [
    { day: "Hace 7d", temp: 38.0 },
    { day: "Hace 6d", temp: 38.1 },
    { day: "Hace 5d", temp: 38.2 },
    { day: "Hace 4d", temp: 38.2 },
    { day: "Hace 3d", temp: 38.4 },
    { day: "Hace 2d", temp: 38.8 },
    { day: "Ayer", temp: 39.1 },
    { day: "Hoy", temp: filterAnimalId === "V-005" ? 39.8 : 39.2 },
  ] : []

  const handleResolve = (recordId: string) => {
    const resolution = selectedResolution || customResolution
    if (!resolution) return

    const targetRecord = historyData.find(r => r.id === recordId)

    setHistoryData(prev => prev.map(record => 
      record.id === recordId 
        ? {
            ...record,
            resolved: true,
            resolution,
            resolvedBy: "Operador",
            resolvedAt: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
          }
        : record
    ))
    
    if (onResolutionSubmit && targetRecord) {
      onResolutionSubmit(resolution, targetRecord)
    }

    setResolvingRecord(null)
    setSelectedResolution("")
    setCustomResolution("")
  }

  return (
    <div className="space-y-4">
      {/* Animal Filter Banner */}
      {filterAnimalId && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">
                  Historial de {filterAnimalId}
                </span>
                <Badge className="bg-emerald-200 text-emerald-700 text-[10px]">
                  {filteredData.length} eventos
                </Badge>
              </div>
              <button
                onClick={onClearFilter}
                className="text-xs text-emerald-600 hover:text-emerald-800 underline"
              >
                Ver todo el historial
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {filterAnimalId && (
        <Card className="border-violet-200 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2 bg-violet-50/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-violet-800">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Tendencia de Temperatura (Últimos 7 días)
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs font-medium text-violet-600 bg-violet-100 px-2 py-1 rounded-md">
              <Radio className="h-3 w-3" />
              Fuente: Sensor Biométrico {filterAnimalId}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={animalTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10 }} 
                    stroke="#888888"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[37.5, 40.5]} 
                    tick={{ fontSize: 10 }} 
                    stroke="#888888"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}°`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                    formatter={(value: number) => [`${value}°C`, 'Temperatura']}
                  />
                  <ReferenceLine y={39.0} stroke="#f59e0b" strokeDasharray="3 3" />
                  <ReferenceLine y={39.5} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="temp" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                    activeDot={{ r: 6, fill: "#8b5cf6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {animalTrendData[animalTrendData.length - 1].temp > 39.0 && (
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 text-amber-800 p-3 rounded-md text-xs font-medium border border-amber-200">
                <div className="flex items-start sm:items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p>El sistema de IA ha detectado una <span className="font-bold">Tendencia Febril</span> (Aumento de 0.5°C diario). Se sugiere inspección visual preventiva.</p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex-shrink-0"
                  onClick={() => {
                    toast.success(
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4 animate-pulse text-emerald-500" />
                        <span>Dron desplegado para inspeccionar a {filterAnimalId}</span>
                      </div>,
                      { duration: 5000 }
                    )
                  }}
                >
                  <Plane className="h-3.5 w-3.5 mr-1.5" />
                  Desplegar Dron ahora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              Historial de Eventos
            </CardTitle>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                  {pendingCount} pendientes
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {filteredData.length} registros
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {!filterAnimalId && (
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5",
                    filter === f.id
                      ? f.id === "pending" 
                        ? "bg-amber-500 text-white"
                        : "bg-emerald-500 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  )}
                >
                  {f.label}
                  {f.count !== undefined && f.count > 0 && (
                    <span className={cn(
                      "px-1.5 rounded-full text-[10px] font-bold",
                      filter === f.id ? "bg-white/30" : "bg-amber-200 text-amber-700"
                    )}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {filteredData.map((record) => {
          const Icon = typeIcons[record.type]
          const isExpanded = expandedRecord === record.id
          const isResolving = resolvingRecord === record.id
          const needsAction = !record.resolved && (record.severity === "warning" || record.severity === "critical")
          
          return (
            <Card
              key={record.id}
              className={cn(
                "border-border/50 bg-card/30 backdrop-blur-sm transition-all",
                needsAction && "border-l-4 border-l-amber-400",
                record.resolved && "opacity-75"
              )}
            >
              <CardContent className="p-3">
                <div 
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg bg-secondary/50",
                      typeColors[record.type]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium text-foreground">
                        {record.event}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", severityBadge[record.severity])}
                      >
                        {record.severity === "info" && "Info"}
                        {record.severity === "warning" && "Alerta"}
                        {record.severity === "critical" && "Critico"}
                      </Badge>
                      {record.resolved && (
                        <Badge className="bg-emerald-100 text-emerald-600 text-[10px]">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                          Resuelto
                        </Badge>
                      )}
                    </div>

                    {/* Sensor Source Badge */}
                    {record.sensorSource && (
                      <div className="mb-1.5">
                        {record.sensorSource.type === "biometric" && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px]">
                            <Radio className="h-3 w-3" />
                            <span className="font-medium">Sensor Biometrico</span>
                            <span className="text-violet-500">|</span>
                            <span>{record.sensorSource.animalId}</span>
                            <span className="text-violet-400 font-mono">[{record.sensorSource.sensorId}]</span>
                          </div>
                        )}
                        {record.sensorSource.type === "environmental" && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px]">
                            <Cpu className="h-3 w-3" />
                            <span className="font-medium">Sensor Ambiental</span>
                            <span className="text-sky-500">|</span>
                            <MapPin className="h-3 w-3" />
                            <span>{record.sensorSource.zone}</span>
                            <span className="text-sky-400 font-mono">[{record.sensorSource.sensorId}]</span>
                          </div>
                        )}
                        {record.sensorSource.type === "drone" && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">
                            <Plane className="h-3 w-3" />
                            <span className="font-medium">Dron</span>
                            <span className="text-emerald-500">|</span>
                            <span>{record.sensorSource.droneId}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {record.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {record.time}
                      </span>
                      {record.value && (
                        <span className={cn(
                          "font-mono font-medium px-1.5 py-0.5 rounded",
                          record.sensorSource?.type === "biometric" 
                            ? "bg-violet-100 text-violet-700"
                            : "bg-sky-100 text-sky-700"
                        )}>
                          {record.value}
                        </span>
                      )}
                      {record.animalId && !record.sensorSource && (
                        <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-600 border-violet-200">
                          {record.animalId}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {needsAction && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-amber-200 text-amber-600 hover:bg-amber-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          setResolvingRecord(record.id)
                          setExpandedRecord(record.id)
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Resolver
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Panel Expandido */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                    {/* Resolucion existente */}
                    {record.resolved && record.resolution && (
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-emerald-800 font-medium">
                              {record.resolution}
                            </p>
                            <p className="text-xs text-emerald-600 mt-1">
                              Por: {record.resolvedBy} - {record.resolvedAt}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Formulario de resolucion */}
                    {isResolving && !record.resolved && (
                      <div className={cn(
                        "rounded-lg p-3 space-y-3",
                        record.sensorSource?.type === "biometric" 
                          ? "bg-violet-50" 
                          : record.sensorSource?.type === "environmental"
                            ? "bg-sky-50"
                            : "bg-amber-50"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          {record.sensorSource?.type === "biometric" ? (
                            <>
                              <Syringe className="h-4 w-4 text-violet-600" />
                              <span className="text-sm font-medium text-violet-800">
                                Accion para {record.animalId}
                              </span>
                            </>
                          ) : record.sensorSource?.type === "environmental" ? (
                            <>
                              <Shield className="h-4 w-4 text-sky-600" />
                              <span className="text-sm font-medium text-sky-800">
                                Control para {record.sensorSource.zone}
                              </span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-800">
                                Que accion se tomo?
                              </span>
                            </>
                          )}
                        </div>

                        {/* Opciones rapidas segun tipo de sensor */}
                        <div className="flex flex-wrap gap-2">
                          {getResolutionOptions(record.sensorSource || null).map((option) => (
                            <button
                              key={option}
                              onClick={() => setSelectedResolution(option)}
                              className={cn(
                                "px-2 py-1 text-xs rounded-full transition-all",
                                selectedResolution === option
                                  ? record.sensorSource?.type === "biometric"
                                    ? "bg-violet-500 text-white"
                                    : record.sensorSource?.type === "environmental"
                                      ? "bg-sky-500 text-white"
                                      : "bg-amber-500 text-white"
                                  : record.sensorSource?.type === "biometric"
                                    ? "bg-white text-violet-700 border border-violet-200 hover:bg-violet-100"
                                    : record.sensorSource?.type === "environmental"
                                      ? "bg-white text-sky-700 border border-sky-200 hover:bg-sky-100"
                                      : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-100"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>

                        {/* Input personalizado */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="O escribe una nota personalizada..."
                            value={customResolution}
                            onChange={(e) => {
                              setCustomResolution(e.target.value)
                              setSelectedResolution("")
                            }}
                            className={cn(
                              "flex-1 px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2",
                              record.sensorSource?.type === "biometric"
                                ? "border-violet-200 focus:ring-violet-400"
                                : record.sensorSource?.type === "environmental"
                                  ? "border-sky-200 focus:ring-sky-400"
                                  : "border-amber-200 focus:ring-amber-400"
                            )}
                          />
                        </div>

                        {/* Botones de accion */}
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setResolvingRecord(null)
                              setSelectedResolution("")
                              setCustomResolution("")
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                            disabled={!selectedResolution && !customResolution}
                            onClick={() => handleResolve(record.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Confirmar Resolucion
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {filteredData.length === 0 && (
          <Card className="border-border/50 bg-card/30">
            <CardContent className="p-8 text-center">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hay registros</p>
              {filterAnimalId && (
                <p className="text-xs text-muted-foreground/70">
                  No se encontraron eventos para {filterAnimalId}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
