"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Search,
  MapPin,
  History,
  Thermometer,
  Activity,
  Calendar,
  Weight,
  Syringe,
  ChevronRight,
  X,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Plane,
} from "lucide-react"
import { toast } from "sonner"

interface AnimalRecord {
  id: string
  type: "cow" | "sheep"
  name: string
  age: string
  weight: string
  lastVaccine: string
  nextVaccine: string
  zone: string
  coordinates: [number, number]
  temperature: number
  tempTrend: "up" | "down" | "stable"
  tempDiff: number
  healthScore: number
  status: "healthy" | "attention" | "critical"
  lastMovement: string
  dailyDistance: string
  alerts: number
}

const livestockData: AnimalRecord[] = [
  {
    id: "V-001",
    type: "cow",
    name: "Luna",
    age: "4 anios",
    weight: "485 kg",
    lastVaccine: "15 Mar 2026",
    nextVaccine: "15 Sep 2026",
    zone: "Pastizal Norte",
    coordinates: [-34.142, -60.210],
    temperature: 38.4,
    tempTrend: "stable",
    tempDiff: 0.1,
    healthScore: 92,
    status: "healthy",
    lastMovement: "Hace 12 min",
    dailyDistance: "2.3 km",
    alerts: 0,
  },
  {
    id: "V-002",
    type: "cow",
    name: "Estrella",
    age: "3 anios",
    weight: "420 kg",
    lastVaccine: "20 Feb 2026",
    nextVaccine: "20 Ago 2026",
    zone: "Pastizal Norte",
    coordinates: [-34.145, -60.205],
    temperature: 39.2,
    tempTrend: "up",
    tempDiff: 1.1,
    healthScore: 78,
    status: "attention",
    lastMovement: "Hace 25 min",
    dailyDistance: "1.8 km",
    alerts: 1,
  },
  {
    id: "V-003",
    type: "cow",
    name: "Mancha",
    age: "5 anios",
    weight: "510 kg",
    lastVaccine: "10 Ene 2026",
    nextVaccine: "10 Jul 2026",
    zone: "Zona Central",
    coordinates: [-34.148, -60.198],
    temperature: 38.6,
    tempTrend: "stable",
    tempDiff: 0.2,
    healthScore: 88,
    status: "healthy",
    lastMovement: "Hace 8 min",
    dailyDistance: "2.7 km",
    alerts: 0,
  },
  {
    id: "V-004",
    type: "cow",
    name: "Nube",
    age: "2 anios",
    weight: "380 kg",
    lastVaccine: "05 Abr 2026",
    nextVaccine: "05 Oct 2026",
    zone: "Pastizal Sur",
    coordinates: [-34.155, -60.202],
    temperature: 38.3,
    tempTrend: "down",
    tempDiff: -0.3,
    healthScore: 95,
    status: "healthy",
    lastMovement: "Hace 5 min",
    dailyDistance: "3.1 km",
    alerts: 0,
  },
  {
    id: "V-005",
    type: "cow",
    name: "Tormenta",
    age: "6 anios",
    weight: "530 kg",
    lastVaccine: "12 Dic 2025",
    nextVaccine: "12 Jun 2026",
    zone: "Zona Oeste",
    coordinates: [-34.152, -60.212],
    temperature: 39.8,
    tempTrend: "up",
    tempDiff: 1.6,
    healthScore: 62,
    status: "critical",
    lastMovement: "Hace 47 min",
    dailyDistance: "0.4 km",
    alerts: 3,
  },
  {
    id: "V-006",
    type: "cow",
    name: "Flor",
    age: "3 anios",
    weight: "445 kg",
    lastVaccine: "28 Mar 2026",
    nextVaccine: "28 Sep 2026",
    zone: "Pastizal Norte",
    coordinates: [-34.143, -60.196],
    temperature: 38.5,
    tempTrend: "stable",
    tempDiff: 0.0,
    healthScore: 90,
    status: "healthy",
    lastMovement: "Hace 15 min",
    dailyDistance: "2.0 km",
    alerts: 0,
  },
  {
    id: "O-001",
    type: "sheep",
    name: "Copo",
    age: "2 anios",
    weight: "65 kg",
    lastVaccine: "01 Abr 2026",
    nextVaccine: "01 Oct 2026",
    zone: "Colina Este",
    coordinates: [-34.145, -60.185],
    temperature: 39.0,
    tempTrend: "stable",
    tempDiff: 0.1,
    healthScore: 94,
    status: "healthy",
    lastMovement: "Hace 3 min",
    dailyDistance: "1.5 km",
    alerts: 0,
  },
  {
    id: "O-002",
    type: "sheep",
    name: "Algondon",
    age: "1 anio",
    weight: "52 kg",
    lastVaccine: "15 Mar 2026",
    nextVaccine: "15 Sep 2026",
    zone: "Colina Este",
    coordinates: [-34.147, -60.188],
    temperature: 39.1,
    tempTrend: "stable",
    tempDiff: 0.0,
    healthScore: 96,
    status: "healthy",
    lastMovement: "Hace 7 min",
    dailyDistance: "1.2 km",
    alerts: 0,
  },
]

interface LivestockManagementProps {
  onLocateAnimal?: (coordinates: [number, number], animalId: string) => void
  onViewHistory?: (animalId: string) => void
}

// Iconos detallados y realistas de animales (Premium Vector Style)
const CowIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#cowGrad)" />
    {/* Cabeza y Hocico */}
    <path d="M22 28C22 24 26 20 32 20C38 20 42 24 42 28V36C42 42 38 46 32 46C26 46 22 42 22 36V28Z" fill="white" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M22 36C22 40 26 44 32 44C38 44 42 40 42 36" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
    <path d="M28 40C28 40 29 38 32 38C35 38 36 40 36 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Manchas realistas */}
    <path d="M24 26C24 26 26 24 28 25C30 26 28 28 26 29C24 30 24 26 24 26Z" fill="currentColor" fillOpacity="0.8"/>
    <path d="M38 32C38 32 40 30 41 32C42 34 40 36 38 35C36 34 38 32 38 32Z" fill="currentColor" fillOpacity="0.8"/>
    {/* Orejas y Cuernos */}
    <path d="M22 24C18 24 16 28 16 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M42 24C46 24 48 28 48 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M26 20C26 14 24 12 22 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M38 20C38 14 40 12 42 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    {/* Ojos */}
    <circle cx="28" cy="31" r="1.5" fill="currentColor"/>
    <circle cx="36" cy="31" r="1.5" fill="currentColor"/>
    <circle cx="31.5" cy="41" r="0.8" fill="currentColor" fillOpacity="0.5"/>
    <circle cx="32.5" cy="41" r="0.8" fill="currentColor" fillOpacity="0.5"/>
  </svg>
)

const SheepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sheepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#sheepGrad)" />
    {/* Cuerpo de lana (Nubes) */}
    <circle cx="32" cy="24" r="8" fill="white" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="24" cy="28" r="8" fill="white" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="40" cy="28" r="8" fill="white" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="24" cy="38" r="8" fill="white" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="40" cy="38" r="8" fill="white" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="32" cy="42" r="8" fill="white" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="25" y="28" width="14" height="14" fill="white" />
    {/* Cara */}
    <path d="M40 30C40 26 44 24 48 24C52 24 54 28 54 32C54 36 50 40 46 40C42 40 40 37 40 34V30Z" fill="#333" stroke="currentColor" strokeWidth="1"/>
    <circle cx="48" cy="30" r="1" fill="white"/>
    {/* Orejas de oveja */}
    <path d="M42 26C42 26 40 22 38 24" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M52 26C52 26 54 22 56 24" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Patas sutiles */}
    <rect x="26" y="44" width="2" height="6" rx="1" fill="currentColor" fillOpacity="0.4"/>
    <rect x="36" y="44" width="2" height="6" rx="1" fill="currentColor" fillOpacity="0.4"/>
  </svg>
)

// Extraer zonas unicas de los datos
const availableZones = Array.from(new Set(livestockData.map(a => a.zone))).sort()

export function LivestockManagement({ onLocateAnimal, onViewHistory }: LivestockManagementProps) {
  const [animalsData, setAnimalsData] = useState<AnimalRecord[]>(livestockData)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalRecord | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "healthy" | "attention" | "critical">("all")
  const [zoneFilter, setZoneFilter] = useState<string>("all")

  useEffect(() => {
    const handleUpdate = (e: any) => {
      const { animalId } = e.detail
      setAnimalsData(prev => prev.map(a => 
        a.id === animalId 
          ? { 
              ...a, 
              temperature: Number((a.temperature - 0.9).toFixed(1)),
              tempTrend: "down",
              tempDiff: -0.9,
              healthScore: Math.min(100, a.healthScore + 15),
              status: "healthy",
              alerts: 0
            }
          : a
      ))
    }
    window.addEventListener('update-animal-stats', handleUpdate)
    return () => window.removeEventListener('update-animal-stats', handleUpdate)
  }, [])

  const filteredAnimals = useMemo(() => {
    return animalsData.filter((animal) => {
      const matchesSearch = 
        animal.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.zone.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || animal.status === statusFilter
      const matchesZone = zoneFilter === "all" || animal.zone === zoneFilter
      
      return matchesSearch && matchesStatus && matchesZone
    })
  }, [searchQuery, statusFilter, zoneFilter])

  const stats = useMemo(() => ({
    total: animalsData.length,
    healthy: animalsData.filter(a => a.status === "healthy").length,
    attention: animalsData.filter(a => a.status === "attention").length,
    critical: animalsData.filter(a => a.status === "critical").length,
  }), [animalsData])

  const statusColors = {
    healthy: "bg-emerald-100 text-emerald-700 border-emerald-200",
    attention: "bg-amber-100 text-amber-700 border-amber-200",
    critical: "bg-rose-100 text-rose-700 border-rose-200",
  }

  const statusIcons = {
    healthy: CheckCircle2,
    attention: AlertTriangle,
    critical: AlertTriangle,
  }

  return (
    <div className="space-y-4">
      {/* Header con Stats */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Mi Ganado
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "p-2 rounded-lg text-center transition-all",
                statusFilter === "all" 
                  ? "bg-emerald-100 ring-2 ring-emerald-500" 
                  : "bg-secondary/50 hover:bg-secondary"
              )}
            >
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </button>
            <button
              onClick={() => setStatusFilter("healthy")}
              className={cn(
                "p-2 rounded-lg text-center transition-all",
                statusFilter === "healthy" 
                  ? "bg-emerald-100 ring-2 ring-emerald-500" 
                  : "bg-secondary/50 hover:bg-secondary"
              )}
            >
              <p className="text-lg font-bold text-emerald-600">{stats.healthy}</p>
              <p className="text-[10px] text-muted-foreground">Sanos</p>
            </button>
            <button
              onClick={() => setStatusFilter("attention")}
              className={cn(
                "p-2 rounded-lg text-center transition-all",
                statusFilter === "attention" 
                  ? "bg-amber-100 ring-2 ring-amber-500" 
                  : "bg-secondary/50 hover:bg-secondary"
              )}
            >
              <p className="text-lg font-bold text-amber-600">{stats.attention}</p>
              <p className="text-[10px] text-muted-foreground">Atencion</p>
            </button>
            <button
              onClick={() => setStatusFilter("critical")}
              className={cn(
                "p-2 rounded-lg text-center transition-all",
                statusFilter === "critical" 
                  ? "bg-rose-100 ring-2 ring-rose-500" 
                  : "bg-secondary/50 hover:bg-secondary"
              )}
            >
              <p className="text-lg font-bold text-rose-600">{stats.critical}</p>
              <p className="text-[10px] text-muted-foreground">Critico</p>
            </button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/30 border-border/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Selector de Zona */}
            <div className="relative min-w-[140px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className={cn(
                  "w-full h-9 pl-9 pr-3 rounded-md text-sm",
                  "bg-secondary/30 border border-border/50",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                  "appearance-none cursor-pointer",
                  zoneFilter !== "all" && "bg-emerald-50 border-emerald-200 text-emerald-700"
                )}
              >
                <option value="all">Todas las zonas</option>
                {availableZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
            </div>
          </div>

          {/* Filtros activos */}
          {(zoneFilter !== "all" || statusFilter !== "all") && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtros:</span>
              {zoneFilter !== "all" && (
                <Badge 
                  variant="outline" 
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs cursor-pointer hover:bg-emerald-100"
                  onClick={() => setZoneFilter("all")}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {zoneFilter}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs cursor-pointer",
                    statusFilter === "healthy" && "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                    statusFilter === "attention" && "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
                    statusFilter === "critical" && "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  )}
                  onClick={() => setStatusFilter("all")}
                >
                  {statusFilter === "healthy" ? "Sanos" : statusFilter === "attention" ? "Atencion" : "Criticos"}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              <button
                onClick={() => {
                  setZoneFilter("all")
                  setStatusFilter("all")
                  setSearchQuery("")
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Animales */}
      <div className="space-y-2">
        {filteredAnimals.map((animal) => {
          const StatusIcon = statusIcons[animal.status]
          return (
            <Card
              key={animal.id}
              className={cn(
                "border-border/50 bg-card/30 backdrop-blur-sm cursor-pointer transition-all hover:bg-card/50",
                selectedAnimal?.id === animal.id && "ring-2 ring-emerald-500"
              )}
              onClick={() => setSelectedAnimal(selectedAnimal?.id === animal.id ? null : animal)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar/Icono del Animal */}
                  <div className={cn(
                    "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner",
                    animal.status === "healthy" && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                    animal.status === "attention" && "bg-amber-50 text-amber-600 border border-amber-100",
                    animal.status === "critical" && "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse-subtle"
                  )}>
                    {animal.type === "cow" ? (
                      <CowIcon className="w-10 h-10" />
                    ) : (
                      <SheepIcon className="w-10 h-10" />
                    )}
                    
                    <div className={cn(
                      "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                      animal.status === "healthy" ? "bg-emerald-500" : 
                      animal.status === "attention" ? "bg-amber-500" : "bg-rose-500"
                    )} />
                  </div>

                  {/* Info Principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-base tracking-tight text-foreground">
                        {animal.id}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground truncate">
                        {animal.name}
                      </span>
                      {animal.alerts > 0 && (
                        <div className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold leading-none shadow-sm">
                          {animal.alerts}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="font-medium">{animal.zone}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-border" />
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{animal.lastMovement}</span>
                      </div>
                    </div>
                  </div>

                  {/* Métrica de Salud Rápida */}
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                        Salud
                      </div>
                      <div className={cn(
                        "text-lg font-black leading-none",
                        animal.healthScore >= 85 ? "text-emerald-500" :
                        animal.healthScore >= 70 ? "text-amber-500" : "text-rose-500"
                      )}>
                        {animal.healthScore}%
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Thermometer className={cn(
                          "h-3.5 w-3.5",
                          animal.temperature > 39 ? "text-rose-500" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          "text-base font-mono font-bold",
                          animal.temperature > 39.5 ? "text-rose-600" : 
                          animal.temperature > 39 ? "text-amber-600" : "text-foreground"
                        )}>
                          {animal.temperature.toFixed(1)}°
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-end">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] px-2 py-0 border-none shadow-none font-bold uppercase tracking-tight",
                            animal.status === "healthy" ? "text-emerald-600" : 
                            animal.status === "attention" ? "text-amber-600" : "text-rose-600"
                          )}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {animal.status === "healthy" ? "Óptimo" : animal.status === "attention" ? "Alerta" : "Crítico"}
                        </Badge>
                      </div>
                    </div>
                    
                    <ChevronRight className={cn(
                      "h-5 w-5 text-muted-foreground/30 transition-transform duration-300",
                      selectedAnimal?.id === animal.id && "rotate-90 text-emerald-500"
                    )} />
                  </div>
                </div>

                {/* Panel Expandido */}
                {selectedAnimal?.id === animal.id && (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                    {/* Ficha del Animal */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-secondary/30 rounded-lg p-2">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-[10px]">Edad</span>
                        </div>
                        <p className="text-sm font-medium">{animal.age}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-2">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Weight className="h-3 w-3" />
                          <span className="text-[10px]">Peso</span>
                        </div>
                        <p className="text-sm font-medium">{animal.weight}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-2">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Syringe className="h-3 w-3" />
                          <span className="text-[10px]">Ult. Vacuna</span>
                        </div>
                        <p className="text-sm font-medium">{animal.lastVaccine}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-2">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Syringe className="h-3 w-3" />
                          <span className="text-[10px]">Prox. Vacuna</span>
                        </div>
                        <p className="text-sm font-medium">{animal.nextVaccine}</p>
                      </div>
                    </div>

                    {/* Metricas de Salud Avanzadas */}
                    <div className="bg-gradient-to-br from-secondary/40 to-secondary/10 rounded-xl p-4 border border-border/40 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-bold text-foreground uppercase tracking-tight">Estado Biométrico</span>
                        </div>
                        <span className={cn(
                          "text-base font-black px-2 py-0.5 rounded-lg",
                          animal.healthScore >= 85 ? "bg-emerald-100 text-emerald-700" :
                          animal.healthScore >= 70 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                        )}>
                          {animal.healthScore}/100
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5 uppercase">
                            <span>Nivel de Salud General</span>
                            <span>{animal.healthScore}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-secondary/50 rounded-full overflow-hidden p-0.5 border border-border/30">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                                animal.healthScore >= 85 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                                animal.healthScore >= 70 ? "bg-gradient-to-r from-amber-400 to-amber-500" : 
                                "bg-gradient-to-r from-rose-400 to-rose-500"
                              )}
                              style={{ width: `${animal.healthScore}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Distancia Hoy</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-bold">{animal.dailyDistance}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">Recorridos</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Localización GPS</span>
                            <span className="text-[10px] font-mono font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded self-start">
                              {animal.coordinates[0].toFixed(4)}, {animal.coordinates[1].toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Accion Premium */}
                    <div className="flex gap-2.5 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200/50 transition-all active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation()
                          onLocateAnimal?.(animal.coordinates, animal.id)
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Localizar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewHistory?.(animal.id)
                        }}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Historial
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-10 border-sky-200 text-sky-700 hover:bg-sky-50 shadow-sm transition-all active:scale-95 group"
                        onClick={(e) => {
                          e.stopPropagation()
                          toast.info(
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Plane className="h-4 w-4 animate-bounce text-sky-500" />
                                <span className="font-bold">Iniciando Fase de Inspección</span>
                              </div>
                              <div className="text-xs space-y-1">
                                <p className="opacity-80">1. Calibrando sensores térmicos...</p>
                                <p className="opacity-80">2. Fijando coordenadas GPS: {animal.coordinates[0].toFixed(4)}</p>
                                <p className="animate-pulse font-mono text-[10px] text-sky-600 bg-sky-50 p-1 rounded">
                                  ESTADO: DESPLEGANDO AGENTE AÉREO...
                                </p>
                              </div>
                            </div>,
                            { duration: 4000 }
                          )
                          
                          // Simular el tiempo de vuelo y luego fijar el objetivo
                          setTimeout(() => {
                            toast.success(
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4 text-emerald-500" />
                                  <span className="font-bold">Objetivo Localizado</span>
                                </div>
                                <span className="text-xs">Streaming en vivo establecido. Zoom digital 4x activado.</span>
                              </div>
                            )
                            onLocateAnimal?.(animal.coordinates, animal.id)
                          }, 2500)
                        }}
                      >
                        <Plane className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                        Dron
                      </Button>
                    </div>
                  </div>
                )}
                </CardContent>
              </Card>
            )
          })}

        {filteredAnimals.length === 0 && (
          <Card className="border-border/50 bg-card/30">
            <CardContent className="p-8 text-center">
              <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No se encontraron animales</p>
              <p className="text-xs text-muted-foreground/70">Intenta con otro termino de busqueda</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
