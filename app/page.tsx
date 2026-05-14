"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { StatsCard } from "@/components/stats-card"
import { AlertCard, type AlertType, type AlertSeverity } from "@/components/alert-card"
import { DroneMap, type DroneMapRef } from "@/components/drone-map"
import { EnvironmentChart } from "@/components/environment-chart"
import { LivestockChart } from "@/components/livestock-chart"
import { MobileNav } from "@/components/mobile-nav"
import { SystemStatus } from "@/components/system-status"
import { HistoryView } from "@/components/history-view"
import { SettingsView } from "@/components/settings-view"
import { LivestockManagement } from "@/components/livestock-management"
import { FloatingNotifications } from "@/components/floating-notifications"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Thermometer,
  Droplets,
  Activity,
  Flame,
  Satellite,
  RefreshCw,
  PawPrint,
  History,
  Search,
  AlertTriangle,
  Lock,
  X,
} from "lucide-react"
import { toast } from "sonner"

interface EnvData {
  temperature: number
  humidity: number
  livestockCount: number
  fireRisk: "Bajo" | "Medio" | "Alto" | "Crítico"
}

interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  timestamp: string // Amigable (Hace 3 min)
  dateTime: string  // Exacta (2026-05-13 19:30:45)
  isNew: boolean
  isAttended: boolean
  sensorSource?: { zone: string }
}

const initialAlerts: Alert[] = [
  {
    id: "g1",
    type: "animal",
    severity: "high",
    title: "Apertura no autorizada: Portón Este",
    description: "Se detectó movimiento en el actuador del portón Este sin autorización programada.",
    timestamp: "Hace 1 minuto",
    dateTime: "2026-05-13 19:28:45",
    isNew: true,
    isAttended: false,
    sensorSource: { zone: "Este" }
  },
  {
    id: "a1",
    type: "fire",
    severity: "high",
    title: "Riesgo de incendio elevado",
    description: "Zona este presenta condiciones de sequedad extrema. Monitoreo intensificado.",
    timestamp: "Hace 3 minutos",
    dateTime: "2026-05-13 19:26:12",
    isNew: true,
    isAttended: false,
    sensorSource: { zone: "Norte" }
  },
  {
    id: "a2",
    type: "temperature",
    severity: "medium",
    title: "Temperatura en aumento",
    description: "La temperatura ha superado los 35°C en la zona de pastoreo principal.",
    timestamp: "Hace 15 minutos",
    dateTime: "2026-05-13 19:14:05",
    isNew: true,
    isAttended: false,
    sensorSource: { zone: "Sur" }
  },
  {
    id: "a3",
    type: "animal",
    severity: "low",
    title: "Animal fuera de zona",
    description: "Se detectó movimiento de ganado hacia el perímetro norte.",
    timestamp: "Hace 28 minutos",
    dateTime: "2026-05-13 19:01:22",
    isNew: false,
    isAttended: true,
    sensorSource: { zone: "Norte" }
  },
  {
    id: "a4",
    type: "humidity",
    severity: "medium",
    title: "Humedad crítica",
    description: "Nivel de humedad por debajo del 25% en sector bosque sur.",
    timestamp: "Hace 45 minutos",
    dateTime: "2026-05-13 18:44:10",
    isNew: false,
    isAttended: true,
    sensorSource: { zone: "Sur" }
  },
]

const getGateCoordinates = (gateId: string): [number, number] => {
  const coords: Record<string, [number, number]> = {
    "Norte": [-34.142, -60.200],
    "Sur": [-34.158, -60.200],
    "Este": [-34.150, -60.188],
    "Oeste": [-34.150, -60.212]
  }
  return coords[gateId] || coords["Este"]
}

type Tab = "dashboard" | "map" | "alerts" | "livestock" | "history" | "settings"

export default function AgroEyeApp() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [targetCoordinates, setTargetCoordinates] = useState<[number, number] | null>(null)
  const [highlightedAnimalId, setHighlightedAnimalId] = useState<string | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [selectedAlertDetail, setSelectedAlertDetail] = useState<Alert | null>(null)
  const [droneCameraFeed, setDroneCameraFeed] = useState<{ title: string; status: string; type: string; gateId?: string } | null>(null)
  const [gatesStatuses, setGatesStatuses] = useState<Record<string, "open" | "closed" | "closing">>({
    "Norte": "closed",
    "Sur": "closed",
    "Este": "open",
    "Oeste": "closed"
  })
  const [activeSprinklers, setActiveSprinklers] = useState<Set<string>>(new Set())
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [alertFilters, setAlertFilters] = useState({
    search: "",
    type: "all",
    severity: "all",
    status: "all", // all, attended, pending
    date: "" // YYYY-MM-DD
  })
  const [historyFilter, setHistoryFilter] = useState<string | null>(null)
  const droneMapRef = useRef<DroneMapRef>(null)
  const [envData, setEnvData] = useState<EnvData>({
    temperature: 35,
    humidity: 22,
    livestockCount: 51,
    fireRisk: "Alto",
  })
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  const [isUpdating, setIsUpdating] = useState(false)

  const updateData = useCallback(() => {
    setIsUpdating(true)

    setTimeout(() => {
      setEnvData((prev) => {
        const newTemp = Math.max(
          15,
          Math.min(45, prev.temperature + (Math.random() - 0.5) * 4)
        )
        const newHumidity = Math.max(
          10,
          Math.min(80, prev.humidity + (Math.random() - 0.5) * 6)
        )
        const livestockChange = Math.floor(Math.random() * 3) - 1
        const newLivestock = Math.max(40, Math.min(60, prev.livestockCount + livestockChange))

        let fireRisk: EnvData["fireRisk"] = "Bajo"
        if (newTemp > 38 && newHumidity < 20) {
          fireRisk = "Crítico"
        } else if (newTemp > 35 && newHumidity < 30) {
          fireRisk = "Alto"
        } else if (newTemp > 30 && newHumidity < 40) {
          fireRisk = "Medio"
        }

        return {
          temperature: Math.round(newTemp),
          humidity: Math.round(newHumidity),
          livestockCount: newLivestock,
          fireRisk,
        }
      })

      // Occasionally add a new alert
      if (Math.random() < 0.1) {
        const alertTypes: AlertType[] = ["fire", "temperature", "humidity", "animal"]
        const severities: AlertSeverity[] = ["low", "medium", "high"]
        const type = alertTypes[Math.floor(Math.random() * alertTypes.length)]
        const severity = severities[Math.floor(Math.random() * severities.length)]

        const newAlert: Alert = {
          id: `a${Date.now()}`,
          type,
          severity,
          title: getAlertTitle(type),
          description: getAlertDescription(type),
          timestamp: "Ahora",
          dateTime: new Date().toISOString().replace('T', ' ').split('.')[0],
          isNew: true,
          isAttended: false,
        }

        setAlerts((prev) => [newAlert, ...prev.slice(0, 9)])
      }

      setLastUpdate(new Date())
      setIsUpdating(false)
    }, 300)
  }, [])

  useEffect(() => {
    const interval = setInterval(updateData, 5000)
    return () => clearInterval(interval)
  }, [updateData])

  const newAlertsCount = alerts.filter((a) => a.isNew).length

  const getFireRiskStatus = (risk: EnvData["fireRisk"]) => {
    switch (risk) {
      case "Crítico":
        return "danger"
      case "Alto":
        return "warning"
      case "Medio":
        return "warning"
      default:
        return "normal"
    }
  }

  const getTempStatus = (temp: number) => {
    if (temp >= 38) return "danger"
    if (temp >= 35) return "warning"
    return "normal"
  }

  const getHumidityStatus = (humidity: number) => {
    if (humidity <= 20) return "danger"
    if (humidity <= 30) return "warning"
    return "normal"
  }

  const handleResolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isNew: false } : a))
  }, [])

  const handleNavigateToMap = useCallback((coordinates?: [number, number], animalId?: string) => {
    setActiveTab("map")
    if (coordinates) {
      setTargetCoordinates(coordinates)
      setIsInspecting(true) // Activar HUD de inspección
      // Send drone to investigate after map renders
      setTimeout(() => {
        droneMapRef.current?.sendDroneToCoordinates(coordinates)
      }, 800)
    }
    if (animalId) {
      setHighlightedAnimalId(animalId)
      setTimeout(() => {
        droneMapRef.current?.highlightAnimal(animalId)
      }, 800)
    }
  }, [])

  const handleNavigateToAlerts = useCallback(() => {
    setActiveTab("alerts")
  }, [])

  const handleViewAnimalHistory = useCallback((animalId: string) => {
    setHistoryFilter(animalId)
    setActiveTab("history")
  }, [])

  // Clear target coordinates after navigation
  useEffect(() => {
    if (targetCoordinates && activeTab === "map") {
      const timer = setTimeout(() => {
        setTargetCoordinates(null)
        setHighlightedAnimalId(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [targetCoordinates, activeTab])

  const handleResolutionSubmit = useCallback((alertId: string, resolution: string, record: any) => {
    setIsActionLoading(true)
    setAlerts(prev => prev.map(alert => alert.id === alertId ? { ...alert, isNew: false, isAttended: true } : alert))
    
    if (resolution.toLowerCase().includes("riego")) {
      setTimeout(() => {
        setIsActionLoading(false)
        toast.info("Comando enviado al Actuador de Riego")
        setActiveSprinklers(prev => new Set(prev).add(record.sensorSource?.zone || "Norte"))
      }, 1000)

      let progress = 0
      const interval = setInterval(() => {
        progress += 1
        setEnvData(prev => ({ ...prev, humidity: Math.min(85, prev.humidity + 0.5) }))
        if (progress >= 20) {
          clearInterval(interval)
          setActiveSprinklers(prev => { const n = new Set(prev); n.delete(record.sensorSource?.zone || "Norte"); return n; })
        }
      }, 1000)

    } else if (resolution.toLowerCase().includes("portón") || resolution.toLowerCase().includes("cerrar")) {
      const gateId = record.sensorSource?.zone || "Este"
      
      setTimeout(() => {
        setIsActionLoading(false)
        setGatesStatuses(prev => ({ ...prev, [gateId]: "closing" }))
        toast.info(`Iniciando cierre remoto: Portón ${gateId}`)
        
        // ZOOM AL PORTÓN ESPECÍFICO
        const gateCoords = getGateCoordinates(gateId)
        setIsInspecting(true)
        droneMapRef.current?.centerOnCoordinates(gateCoords)
        
        setTimeout(() => {
          droneMapRef.current?.sendDroneToCoordinates(gateCoords)
        }, 1000)

        setTimeout(() => {
          setDroneCameraFeed({ 
            title: `FEED VIVO - PORTÓN ${gateId.toUpperCase()}`, 
            status: "ACTUADOR ACTIVADO - CERRANDO", 
            type: "gate",
            gateId: gateId
          })
        }, 3000)

        setTimeout(() => {
          setGatesStatuses(prev => ({ ...prev, [gateId]: "closed" }))
          setDroneCameraFeed(prev => prev ? { ...prev, status: "PERÍMETRO ASEGURADO", type: "gate-success" } : null)
          toast.success(`Portón ${gateId} asegurado correctamente`)
          // Mantener inspección activa para ver el resultado
        }, 8000)
      }, 500)

    } else if (resolution.toLowerCase().includes("dron") || resolution.toLowerCase().includes("retornar")) {
      setTimeout(() => {
        setIsActionLoading(false)
        toast.info("Iniciando protocolo RTH")
        droneMapRef.current?.triggerRTH()
      }, 800)
    } else {
      setIsActionLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Floating Notifications */}
      <FloatingNotifications 
        onNavigateToMap={handleNavigateToMap}
        onNavigateToAlerts={handleNavigateToAlerts}
        onViewAnimalHistory={handleViewAnimalHistory}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Satellite className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">AgroEye Live AI</h1>
                <p className="text-[10px] text-muted-foreground">
                  Sistema de Monitoreo Inteligente
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-100 text-emerald-600 border-emerald-200 hidden sm:flex"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                EN VIVO
              </Badge>
              <button
                onClick={updateData}
                disabled={isUpdating}
                className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 text-muted-foreground ${isUpdating ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:fixed lg:left-0 lg:top-[65px] lg:bottom-0 lg:w-64 lg:flex lg:flex-col lg:border-r lg:border-border/50 lg:bg-card/30 lg:backdrop-blur-lg">
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "dashboard" as Tab, label: "Panel Principal", icon: Activity },
            { id: "map" as Tab, label: "Mapa en Vivo", icon: Satellite },
            { id: "alerts" as Tab, label: "Alertas", icon: Flame, badge: newAlertsCount },
            { id: "livestock" as Tab, label: "Mi Ganado", icon: PawPrint },
            { id: "history" as Tab, label: "Historial", icon: History },
            { id: "settings" as Tab, label: "Configuracion", icon: Thermometer },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? "bg-emerald-100 text-emerald-600"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge ? (
                  <Badge className="bg-rose-400 text-white text-[10px] px-1.5">
                    {item.badge}
                  </Badge>
                ) : null}
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground text-center">
            Última actualización: {mounted ? lastUpdate.toLocaleTimeString("es-ES") : "--:--:--"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 lg:ml-64 lg:max-w-[calc(100%-16rem)]">
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatsCard
                title="Temperatura"
                value={envData.temperature}
                unit="°C"
                icon={Thermometer}
                status={getTempStatus(envData.temperature)}
                trend={envData.temperature > 35 ? "up" : "stable"}
                trendValue={envData.temperature > 35 ? "+2°C/h" : "estable"}
              />
              <StatsCard
                title="Humedad"
                value={envData.humidity}
                unit="%"
                icon={Droplets}
                status={getHumidityStatus(envData.humidity)}
                trend={envData.humidity < 30 ? "down" : "stable"}
                trendValue={envData.humidity < 30 ? "-3%/h" : "estable"}
              />
              <StatsCard
                title="Ganado"
                value={envData.livestockCount}
                unit="cabezas"
                icon={Activity}
                status="normal"
              />
              <StatsCard
                title="Riesgo Incendio"
                value={envData.fireRisk}
                icon={Flame}
                status={getFireRiskStatus(envData.fireRisk)}
              />
            </div>

            {/* Map and Alerts Row */}
            <div className="grid lg:grid-cols-2 gap-4">
              <DroneMap 
                key="dashboard-map"
                ref={droneMapRef}
                onViewHistory={handleViewAnimalHistory}
                targetCoordinates={targetCoordinates}
                highlightedAnimalId={highlightedAnimalId}
                gatesStatuses={gatesStatuses}
                activeSprinklers={activeSprinklers}
              />
              <div className="flex flex-col gap-4">
                <div className="bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border/50 shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Centro de Control de Alertas</h3>
                    <p className="text-xs text-muted-foreground mb-6">Gestione y audite las respuestas ciberfísicas del sistema.</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold mb-1">Resueltas</p>
                        <p className="text-2xl font-black text-emerald-700">124</p>
                      </div>
                      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                        <p className="text-[10px] uppercase tracking-wider text-rose-600 font-bold mb-1">Pendientes</p>
                        <p className="text-2xl font-black text-rose-700">{newAlertsCount}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab("alerts")}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    Ver Historial de Auditoría
                  </button>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-4">
              <EnvironmentChart />
              <div className="grid gap-4">
                <LivestockChart />
                <SystemStatus />
              </div>
            </div>
          </div>
        )}

        {activeTab === "map" && (
          <div className="h-[calc(100vh-180px)] lg:h-[calc(100vh-100px)] relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-black">
            {/* Contenedor del Mapa con Zoom Digital */}
            <div className={cn(
              "w-full h-full transition-transform duration-[2000ms] ease-in-out",
              isInspecting ? "scale-[2.8]" : "scale-100"
            )} style={{ transformOrigin: 'center' }}>
              <DroneMap 
                key="full-map"
                ref={droneMapRef}
                onViewHistory={handleViewAnimalHistory}
                targetCoordinates={targetCoordinates}
                highlightedAnimalId={highlightedAnimalId}
                gatesStatuses={gatesStatuses}
                activeSprinklers={activeSprinklers}
              />
            </div>
            
            {/* Overlay de Inspección (HUD de Dron) - Fuera del escalado para mantener nitidez */}
            {isInspecting && (highlightedAnimalId || droneCameraFeed?.type.includes('gate')) && (
              <div className="absolute inset-0 pointer-events-none z-[1000] flex items-center justify-center">
                <div className="absolute inset-4 border-2 border-emerald-500/30 rounded-lg overflow-hidden bg-emerald-950/2">
                  {/* Lineas de escaneo y estatica */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] z-10 opacity-30"></div>
                  
                  {/* Mira central táctica */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-emerald-500/40 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-rose-500 rounded-full animate-ping shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
                    <div className="absolute top-0 w-1 h-8 bg-emerald-500/60"></div>
                    <div className="absolute bottom-0 w-1 h-8 bg-emerald-500/60"></div>
                    <div className="absolute left-0 w-8 h-1 bg-emerald-500/60"></div>
                    <div className="absolute right-0 w-8 h-1 bg-emerald-500/60"></div>
                    
                    {/* Indicador de objetivo */}
                    <div className="absolute -bottom-10 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 shadow-lg">
                      <span className="animate-pulse">●</span> TARGET: {highlightedAnimalId || (droneCameraFeed?.gateId ? `PORTÓN ${droneCameraFeed.gateId}` : "POSICIÓN MANUAL")} [AUTO-LOCK]
                    </div>
                  </div>

                  {/* Telemetría Dinámica Izquierda */}
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 space-y-10 font-mono text-emerald-500/90 drop-shadow-md">
                    <div className="space-y-1">
                      <p className="text-[10px] opacity-70 tracking-widest">ALTITUDE</p>
                      <p className="text-2xl font-black italic">42.8<span className="text-xs">m</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] opacity-70 tracking-widest">VELOCITY</p>
                      <p className="text-2xl font-black italic">1.4<span className="text-xs">m/s</span></p>
                    </div>
                  </div>

                  {/* Telemetría Dinámica Derecha */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-10 font-mono text-emerald-500/90 text-right drop-shadow-md">
                    <div className="space-y-1">
                      <p className="text-[10px] opacity-70 tracking-widest">HEADING</p>
                      <p className="text-2xl font-black italic">142°<span className="text-xs">SE</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] opacity-70 tracking-widest">OPTICS</p>
                      <p className="text-2xl font-black italic">4.0<span className="text-xs">x</span></p>
                    </div>
                  </div>

                  {/* Barra de estado de video inferior */}
                  <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                    <div className="flex flex-col gap-2">
                      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-emerald-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                          <div className="flex flex-col">
                            <span className="text-[9px] text-white/50 uppercase font-bold tracking-widest">Rec Streaming</span>
                            <span className="text-xs font-mono font-bold text-white tracking-tighter">RAW // 4K // 60FPS // AES-256</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsInspecting(false)
                      }}
                      className="pointer-events-auto bg-rose-600/90 hover:bg-rose-700 text-white text-[11px] font-black px-6 py-3 rounded-xl shadow-xl transition-all active:scale-95 border border-rose-500/30 backdrop-blur-md"
                    >
                      TERMINAR INSPECCIÓN
                    </button>
                  </div>

                  {/* Coordenadas en las esquinas */}
                  <div className="absolute top-8 left-8 text-[10px] font-mono text-emerald-500/50">
                    LAT: 34.14522 // LON: -60.20541
                  </div>
                  <div className="absolute top-8 right-8 text-[10px] font-mono text-emerald-500/50">
                    ID_AGRO_01 // MODE: AI_INSPECTION
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Registro de Auditoría de Alertas</h2>
                <p className="text-sm text-muted-foreground">Monitoreo y trazabilidad de eventos críticos en tiempo real.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-rose-500 text-white border-none px-3 py-1">
                  {alerts.length} Eventos Totales
                </Badge>
                <button 
                  onClick={() => setAlertFilters({ search: "", type: "all", severity: "all", status: "all", date: "" })}
                  className="p-2 bg-secondary/50 rounded-lg border border-border hover:bg-secondary transition-colors"
                  title="Limpiar Filtros"
                >
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Barra de Filtros Inteligente */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
              <div className="relative col-span-1 md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="ID / Evento..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  value={alertFilters.search}
                  onChange={(e) => setAlertFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <select 
                className="px-4 py-2 bg-secondary/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={alertFilters.status}
                onChange={(e) => setAlertFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">Todos los Estados</option>
                <option value="pending">⚠️ Pendientes</option>
                <option value="attended">✅ Atendidas</option>
              </select>
              <input 
                type="date"
                className="px-4 py-2 bg-secondary/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={alertFilters.date}
                onChange={(e) => setAlertFilters(prev => ({ ...prev, date: e.target.value }))}
              />
              <select 
                className="px-4 py-2 bg-secondary/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-foreground"
                value={alertFilters.type}
                onChange={(e) => setAlertFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="all">Todas las Categorías</option>
                <option value="animal">🐮 Ganado</option>
                <option value="fire">🔥 Incendio</option>
                <option value="temperature">🌡️ Temperatura</option>
              </select>
              <select 
                className="px-4 py-2 bg-secondary/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={alertFilters.severity}
                onChange={(e) => setAlertFilters(prev => ({ ...prev, severity: e.target.value }))}
              >
                <option value="all">Prioridades</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>

            {/* Tabla de Auditoría Profesional */}
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/30 border-b border-border/50">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timestamp / ID</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Evento</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Severidad</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estado</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {(() => {
                      const filtered = alerts.filter(alert => {
                        const matchesSearch = alert.title.toLowerCase().includes(alertFilters.search.toLowerCase()) || 
                                           alert.id.toLowerCase().includes(alertFilters.search.toLowerCase())
                        const matchesType = alertFilters.type === 'all' || alert.type === alertFilters.type
                        const matchesSeverity = alertFilters.severity === 'all' || alert.severity === alertFilters.severity
                        const matchesStatus = alertFilters.status === 'all' || 
                                           (alertFilters.status === 'attended' && alert.isAttended) ||
                                           (alertFilters.status === 'pending' && !alert.isAttended)
                        const matchesDate = !alertFilters.date || (alert.dateTime && alert.dateTime.includes(alertFilters.date))
                        
                        return matchesSearch && matchesType && matchesSeverity && matchesStatus && matchesDate
                      })

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-secondary/50 rounded-full text-muted-foreground">
                                  <Search className="h-8 w-8 opacity-20" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-foreground">No se encontraron alertas</p>
                                  <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
                                    No hay registros que coincidan con los filtros aplicados. Intenta con otros términos o limpia la búsqueda.
                                  </p>
                                </div>
                                <button 
                                  onClick={() => setAlertFilters({ search: "", type: "all", severity: "all", status: "all", date: "" })}
                                  className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                                >
                                  Limpiar todos los filtros
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return filtered.map((alert) => (
                        <tr key={alert.id} className="hover:bg-secondary/10 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-bold text-foreground">
                                {alert.dateTime ? alert.dateTime.split(' ')[1] : "--:--"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {alert.dateTime ? alert.dateTime.split(' ')[0] : "S/F"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                alert.type === 'fire' ? "bg-rose-100 text-rose-600" :
                                alert.type === 'animal' ? "bg-emerald-100 text-emerald-600" :
                                alert.type === 'soil' ? "bg-amber-100 text-amber-600" :
                                "bg-amber-100 text-amber-600"
                              )}>
                                {alert.type === 'soil' ? <Droplets className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground leading-none mb-1">{alert.title}</span>
                                <span className="text-xs text-muted-foreground line-clamp-1">{alert.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-bold px-2 py-0",
                              alert.severity === 'high' ? "bg-rose-50 text-rose-600 border-rose-200" :
                              alert.severity === 'medium' ? "bg-amber-50 text-amber-600 border-amber-200" :
                              "bg-emerald-50 text-emerald-600 border-emerald-200"
                            )}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter border",
                              alert.isAttended 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                            )}>
                              {alert.isAttended ? "Atendida" : "Pendiente"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleNavigateToMap(undefined, alert.id)}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm"
                                title="Investigar"
                              >
                                <Satellite className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => setSelectedAlertDetail(alert)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
                                title="Ver Detalle"
                              >
                                <Activity className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              <div className="bg-secondary/20 px-6 py-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Mostrando 1-10 de {alerts.length} registros</span>
                <div className="flex items-center gap-1">
                  <button className="px-3 py-1 text-xs bg-white border border-border rounded-md hover:bg-secondary transition-colors disabled:opacity-50" disabled>Anterior</button>
                  <button className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-md shadow-sm">1</button>
                  <button className="px-3 py-1 text-xs bg-white border border-border rounded-md hover:bg-secondary transition-colors">2</button>
                  <button className="px-3 py-1 text-xs bg-white border border-border rounded-md hover:bg-secondary transition-colors">Siguiente</button>
                </div>
              </div>
            </div>

            {/* Modal de Detalles de Alerta (Audit Detail) */}
            {selectedAlertDetail && (
              <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                  {/* Header del Modal */}
                  <div className={cn(
                    "p-6 flex items-center justify-between text-white",
                    selectedAlertDetail.severity === 'high' ? "bg-rose-600" :
                    selectedAlertDetail.severity === 'medium' ? "bg-amber-500" : "bg-emerald-600"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{selectedAlertDetail.title}</h3>
                        <p className="text-xs opacity-80 font-mono">ID: {selectedAlertDetail.id} // {selectedAlertDetail.timestamp}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedAlertDetail(null)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Contenido del Modal */}
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Estado de Auditoría</span>
                        <div className="flex items-center gap-2">
                          <Badge className={selectedAlertDetail.isNew ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}>
                            {selectedAlertDetail.isNew ? "NO RESUELTO" : "AUDITADO"}
                          </Badge>
                          <span className="text-xs text-muted-foreground italic">Prioridad {selectedAlertDetail.severity}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Sensor Fuente</span>
                        <p className="text-sm font-bold text-foreground">AGRO-NODE-{selectedAlertDetail.id.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50">
                      <h4 className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Descripción del Evento</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedAlertDetail.description}. El sistema detectó una desviación fuera de los parámetros nominales establecidos en la configuración de la granja.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Análisis Predictivo IA</h4>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
                        <Activity className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-bold text-emerald-900 mb-1">Acción recomendada</p>
                          <p className="text-xs text-emerald-700 leading-relaxed">
                            Se recomienda desplegar un dron para inspección visual y activar el protocolo de mitigación preventiva en el sector afectado. Probabilidad de acierto: 94.2%.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer del Modal */}
                    <div className="pt-6 border-t border-border/50 flex flex-col gap-3">
                      <div className="flex gap-3">
                        <button 
                          disabled={isActionLoading}
                          onClick={() => {
                            const actionName = 
                              selectedAlertDetail.type === 'fire' || selectedAlertDetail.type === 'temperature' ? "riego" :
                              selectedAlertDetail.title.toLowerCase().includes("portón") ? "portón" : "dron"
                            
                            handleResolutionSubmit(selectedAlertDetail.id, actionName, { sensorSource: { zone: "Norte" } })
                            // El cierre del modal ocurre después de la carga si lo prefieres, o inmediatamente
                            if (!isActionLoading) setSelectedAlertDetail(null)
                          }}
                          className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-tight"
                        >
                          {isActionLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Enviando comando...
                            </>
                          ) : (
                            <>
                              <Activity className="h-4 w-4" />
                              Ejecutar Acción Recomendada
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            handleNavigateToMap(undefined, selectedAlertDetail.id)
                            setSelectedAlertDetail(null)
                          }}
                          className="flex-1 py-4 bg-secondary hover:bg-secondary/80 text-foreground rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Satellite className="h-4 w-4" />
                          Ver Mapa
                        </button>
                      </div>
                      <button 
                        onClick={() => setSelectedAlertDetail(null)}
                        className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cerrar sin realizar cambios
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "livestock" && (
          <LivestockManagement
            onLocateAnimal={(coords, animalId) => {
              handleNavigateToMap(coords, animalId)
            }}
            onViewHistory={handleViewAnimalHistory}
          />
        )}

        {activeTab === "history" && (
          <HistoryView 
            filterAnimalId={historyFilter}
            onClearFilter={() => setHistoryFilter(null)}
            onResolutionSubmit={handleResolutionSubmit}
          />
        )}

        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Drone Camera Feed Simulation Overlay */}
      {droneCameraFeed && (
        <div className="fixed bottom-24 right-6 z-[100] w-72 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
          <div className="relative aspect-video bg-gray-900 overflow-hidden">
            {/* Simulation of a video feed */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=400')] bg-cover bg-center opacity-50 grayscale contrast-125" />
            <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-mono text-white font-bold tracking-widest uppercase">Live REC</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                 {droneCameraFeed.type === 'gate' ? (
                  <div className="relative w-24 h-16 bg-white/5 border border-white/20 rounded flex items-center justify-center overflow-hidden">
                    {/* Simulación de portón cerrándose */}
                    <div className="absolute inset-y-2 left-2 w-1 bg-emerald-500 rounded-full" />
                    <div className="absolute inset-y-2 right-2 w-1 bg-emerald-500 rounded-full" />
                    <div className="h-full w-1/2 bg-white/20 border-x border-white/40 animate-gate-close" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <RefreshCw className="h-6 w-6 text-amber-400 animate-spin" />
                    </div>
                  </div>
                ) : droneCameraFeed.type === 'gate-success' ? (
                  <div className="p-3 bg-emerald-500/20 rounded-full border border-emerald-500/50 backdrop-blur-md">
                    <Lock className="h-6 w-6 text-emerald-400 animate-in zoom-in duration-500" />
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/20 rounded-full border border-emerald-500/50 backdrop-blur-md">
                    <Activity className="h-6 w-6 text-emerald-400 animate-pulse" />
                  </div>
                )}
                <div className="bg-emerald-500/90 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-tighter uppercase">
                  {droneCameraFeed.type === 'gate' ? "Cerrando Portón..." : 
                   droneCameraFeed.type === 'gate-success' ? "Asegurado" : "En Posición"}
                </div>
              </div>
            </div>
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">{droneCameraFeed.title}</h4>
                <p className="text-[10px] text-emerald-400 font-bold">{droneCameraFeed.status}</p>
              </div>
              <button 
                onClick={() => setDroneCameraFeed(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-white/50" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full animate-progress" />
              </div>
              <span className="text-[9px] font-mono text-white/40">100% AI MATCH</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          if (tab === "history") setHistoryFilter(null)
        }}
        alertCount={newAlertsCount}
      />
      <style jsx global>{`
        @keyframes gate-close {
          0% { width: 0%; opacity: 0.3; }
          100% { width: 100%; opacity: 1; }
        }
        .animate-gate-close {
          animation: gate-close 4s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}

function getAlertTitle(type: AlertType): string {
  const titles: Record<AlertType, string> = {
    fire: "Alerta de condiciones de fuego",
    temperature: "Variación de temperatura detectada",
    humidity: "Nivel de humedad anormal",
    animal: "Movimiento de ganado detectado",
    general: "Alerta del sistema",
  }
  return titles[type]
}

function getAlertDescription(type: AlertType): string {
  const descriptions: Record<AlertType, string> = {
    fire: "Se detectaron condiciones propicias para incendio en el área monitoreada.",
    temperature: "Cambio significativo de temperatura en la zona de pastoreo.",
    humidity: "Niveles de humedad fuera del rango óptimo detectados.",
    animal: "Desplazamiento de ganado hacia área no designada.",
    general: "El sistema detectó una anomalía que requiere atención.",
  }
  return descriptions[type]
}
