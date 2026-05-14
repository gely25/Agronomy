"use client"

import { useEffect, useState, useCallback, useImperativeHandle, forwardRef, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { Search, X, History, Navigation, Crosshair } from "lucide-react"

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)
const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false }
)
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
)
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
)
const useMapEvents = dynamic(
  () => import("react-leaflet").then((mod) => mod.useMapEvents as any),
  { ssr: false }
) as any

import "leaflet/dist/leaflet.css"

interface Livestock {
  id: string
  lat: number
  lng: number
  type: "cow" | "sheep"
  status: "active" | "resting" | "alert"
  temp: number
  avgTemp: number
  lastMovement: number // minutes ago
}

interface DronePosition {
  lat: number
  lng: number
  rotation: number
  battery: number
  altitude: number
  speed: number
  status: "flying" | "scanning" | "returning" | "inspecting" | "landed" | "takeoff"
  targetCoords?: [number, number]
  isVisible?: boolean
  unitId?: string
}

interface Zone {
  id: string
  name: string
  bounds: [number, number][]
  type: "safe" | "warning" | "danger" | "monitored"
  description: string
}

type MapLayer = "satellite" | "terrain" | "hybrid"

export interface DroneMapRef {
  sendDroneToCoordinates: (coords: [number, number]) => void
  highlightAnimal: (animalId: string) => void
  centerOnCoordinates: (coords: [number, number]) => void
}

interface DroneMapProps {
  onViewHistory?: (animalId: string) => void
  targetCoordinates?: [number, number] | null
  highlightedAnimalId?: string | null
  gatesStatuses?: Record<string, "open" | "closed" | "closing">
  activeSprinklers?: Set<string>
}

const CENTER: [number, number] = [-34.150, -60.200]

const zones: Zone[] = [
  {
    id: "z1",
    name: "Pastizal Norte",
    bounds: [
      [-34.142, -60.215],
      [-34.142, -60.195],
      [-34.147, -60.195],
      [-34.147, -60.215],
    ],
    type: "safe",
    description: "Zona de pastoreo principal - Sin alertas",
  },
  {
    id: "z2",
    name: "Bosque Este",
    bounds: [
      [-34.142, -60.195],
      [-34.142, -60.175],
      [-34.147, -60.175],
      [-34.147, -60.195],
    ],
    type: "warning",
    description: "Alerta de temperatura elevada detectada",
  },
  {
    id: "z3",
    name: "Zona Sur",
    bounds: [
      [-34.152, -60.215],
      [-34.152, -60.195],
      [-34.162, -60.195],
      [-34.162, -60.215],
    ],
    type: "monitored",
    description: "Monitoreo continuo - Vegetacion densa",
  },
  {
    id: "z4",
    name: "Corrales Oeste",
    bounds: [
      [-34.152, -60.195],
      [-34.152, -60.175],
      [-34.162, -60.175],
      [-34.162, -60.195],
    ],
    type: "danger",
    description: "Humedad baja - Precaucion",
  },
]

const initialLivestock: Livestock[] = [
  { id: "V-001", lat: -34.144, lng: -60.210, type: "cow", status: "active", temp: 38.2, avgTemp: 38.0, lastMovement: 2 },
  { id: "V-002", lat: -34.145, lng: -60.205, type: "cow", status: "resting", temp: 38.5, avgTemp: 38.1, lastMovement: 15 },
  { id: "V-003", lat: -34.143, lng: -60.200, type: "cow", status: "active", temp: 38.1, avgTemp: 38.2, lastMovement: 1 },
  { id: "O-001", lat: -34.146, lng: -60.208, type: "sheep", status: "active", temp: 39.0, avgTemp: 38.8, lastMovement: 5 },
  { id: "V-004", lat: -34.155, lng: -60.210, type: "cow", status: "active", temp: 38.3, avgTemp: 38.2, lastMovement: 3 },
  { id: "V-005", lat: -34.157, lng: -60.205, type: "cow", status: "alert", temp: 39.8, avgTemp: 38.4, lastMovement: 45 },
  { id: "O-002", lat: -34.159, lng: -60.200, type: "sheep", status: "resting", temp: 38.9, avgTemp: 38.7, lastMovement: 20 },
  { id: "V-006", lat: -34.155, lng: -60.188, type: "cow", status: "active", temp: 38.4, avgTemp: 38.3, lastMovement: 4 },
  { id: "V-007", lat: -34.157, lng: -60.182, type: "cow", status: "active", temp: 38.2, avgTemp: 38.1, lastMovement: 2 },
  { id: "O-003", lat: -34.159, lng: -60.185, type: "sheep", status: "active", temp: 39.1, avgTemp: 39.0, lastMovement: 8 },
]

const patrolPoints: [number, number][] = [
  [-34.144, -60.205],
  [-34.144, -60.185],
  [-34.157, -60.185],
  [-34.157, -60.205],
  [-34.150, -60.195],
]

const zoneColors = {
  norte: "#10b981", // Emerald
  sur: "#0ea5e9",   // Sky
  este: "#f59e0b",  // Amber
  oeste: "#8b5cf6",  // Violet
}

const statusColors = {
  active: "#4ade80",
  resting: "#60a5fa",
  alert: "#f87171",
}

const gateIcons = {
  open: "🔓",
  closed: "🔒",
  closing: "⏳"
}

const tileUrls: Record<MapLayer, string> = {
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  terrain: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  hybrid: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
}

function FollowController({ 
  targetPosition,
  shouldFollow,
  zoom = 16
}: { 
  targetPosition: [number, number]
  shouldFollow: boolean
  zoom?: number
}) {
  const [MapHookComponent, setMapHookComponent] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    import("react-leaflet").then((mod) => {
      const Component = () => {
        const map = mod.useMap()
        
        useEffect(() => {
          if (shouldFollow && map && targetPosition) {
            map.closePopup() // Despejar popups automáticamente
            map.setView(targetPosition, zoom, { animate: true, duration: 1.5 })
          }
        }, [map, targetPosition, shouldFollow, zoom])
        
        return null
      }
      setMapHookComponent(() => Component)
    })
  }, [shouldFollow, targetPosition])

  if (!MapHookComponent) return null
  return <MapHookComponent />
}

function MovingDroneMarker({ 
  position, 
  battery,
  altitude,
  speed,
  status,
  targetCoords,
  onClick
}: { 
  position: [number, number]
  battery: number
  altitude: number
  speed: number
  status: DronePosition["status"]
  targetCoords?: [number, number]
  onClick: () => void
}) {
  const [icon, setIcon] = useState<L.DivIcon | null>(null)
  
  const statusText = {
    flying: "En vuelo",
    scanning: "Escaneando",
    returning: "RTH (Base)",
    inspecting: "Inspeccionando",
    landed: "En Hangar",
    takeoff: "Despegando"
  }
  
  const statusColorMap = {
    flying: "#86efac",
    scanning: "#fcd34d", 
    returning: "#93c5fd",
    inspecting: "#c4b5fd",
    landed: "#94a3b8",
    takeoff: "#22c55e"
  }
  
  useEffect(() => {
    import("leaflet").then((L) => {
      const statusColor = statusColorMap[status]
      
      const droneIcon = L.divIcon({
        className: "drone-marker",
        html: `
          <div class="drone-container" style="cursor: pointer;">
            <div class="drone-shadow"></div>
            <div class="drone-body">
              <svg viewBox="0 0 64 64" width="56" height="56">
                <line x1="12" y1="12" x2="52" y2="52" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/>
                <line x1="52" y1="12" x2="12" y2="52" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="8" fill="#374151" stroke="${statusColor}" stroke-width="2"/>
                <circle cx="52" cy="12" r="8" fill="#374151" stroke="${statusColor}" stroke-width="2"/>
                <circle cx="12" cy="52" r="8" fill="#374151" stroke="${statusColor}" stroke-width="2"/>
                <circle cx="52" cy="52" r="8" fill="#374151" stroke="${statusColor}" stroke-width="2"/>
                <ellipse cx="12" cy="12" rx="10" ry="3" fill="${statusColor}" opacity="0.7" class="propeller"/>
                <ellipse cx="52" cy="12" rx="10" ry="3" fill="${statusColor}" opacity="0.7" class="propeller"/>
                <ellipse cx="12" cy="52" rx="10" ry="3" fill="${statusColor}" opacity="0.7" class="propeller"/>
                <ellipse cx="52" cy="52" rx="10" ry="3" fill="${statusColor}" opacity="0.7" class="propeller"/>
                <rect x="24" y="24" width="16" height="16" rx="4" fill="#1f2937" stroke="${statusColor}" stroke-width="2"/>
                <circle cx="32" cy="32" r="4" fill="${statusColor}"/>
                <circle cx="32" cy="32" r="2" fill="#ffffff"/>
                <circle cx="32" cy="26" r="2" fill="#ef4444" class="blink"/>
              </svg>
            </div>
            <div class="drone-pulse" style="border-color: ${statusColor};"></div>
            <div class="drone-label" style="background: ${statusColor}; color: #1f2937;">${statusText[status]}</div>
          </div>
          <style>
            .drone-container { position: relative; width: 56px; height: 56px; }
            .drone-label { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 9px; padding: 2px 8px; border-radius: 4px; white-space: nowrap; font-weight: 600; }
            .drone-shadow { position: absolute; width: 48px; height: 12px; background: radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%); bottom: -10px; left: 4px; animation: shadow-pulse 1s ease-in-out infinite; }
            .drone-body { position: relative; z-index: 2; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.5)); }
            .drone-pulse { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70px; height: 70px; border: 2px solid; border-radius: 50%; animation: pulse-ring 2s ease-out infinite; z-index: 1; }
            .propeller { transform-origin: center; animation: spin 0.08s linear infinite; }
            .blink { animation: blink 0.8s ease-in-out infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes pulse-ring { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; } }
            @keyframes shadow-pulse { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.15); opacity: 0.25; } }
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
          </style>
        `,
        iconSize: [56, 56],
        iconAnchor: [28, 28],
      })
      setIcon(droneIcon)
    })
  }, [status])

  if (!icon) return null

  return (
    <Marker 
      position={position} 
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="p-2 min-w-[180px]">
          <div className="font-bold text-emerald-600 mb-2 text-sm">Dron AgroEye-01</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Estado:</span>
              <span className="font-medium" style={{ color: statusColorMap[status] }}>
                {statusText[status]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bateria:</span>
              <span className="font-mono">{battery.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Altitud:</span>
              <span className="font-mono">{altitude}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Velocidad:</span>
              <span className="font-mono">{speed.toFixed(1)} km/h</span>
            </div>
            {targetCoords && (
              <div className="pt-1 border-t border-gray-200">
                <span className="text-gray-500 text-[10px]">Destino:</span>
                <span className="font-mono text-[10px] ml-1">
                  {targetCoords[0].toFixed(4)}, {targetCoords[1].toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

function MapClickHandler({ onClick }: { onClick: (coords: [number, number]) => void }) {
  useMapEvents({
    click: (e: any) => {
      onClick([e.latlng.lat, e.latlng.lng])
    }
  })
  return null
}

function LivestockMarker({ 
  animal, 
  onClick,
  isHighlighted,
  onViewHistory,
  onSendDrone
}: { 
  animal: Livestock
  onClick: () => void
  isHighlighted: boolean
  onViewHistory: () => void
  onSendDrone: () => void
}) {
  const [icon, setIcon] = useState<L.DivIcon | null>(null)
  
  useEffect(() => {
    import("leaflet").then((L) => {
      const statusColor = statusColors[animal.status]
      const highlightStyle = isHighlighted 
        ? `border: 4px solid #8b5cf6; box-shadow: 0 0 20px #8b5cf6, 0 0 40px #8b5cf6; animation: highlight-pulse 1s ease-in-out infinite;` 
        : ""
      const size = isHighlighted ? 44 : 36
      
      const cowSvg = `
        <svg viewBox="0 0 32 32" width="${size}" height="${size}">
          <ellipse cx="16" cy="18" rx="10" ry="7" fill="#8B4513"/>
          <circle cx="24" cy="14" r="5" fill="#8B4513"/>
          <ellipse cx="21" cy="10" rx="2" ry="1.5" fill="#A0522D"/>
          <ellipse cx="27" cy="10" rx="2" ry="1.5" fill="#A0522D"/>
          <path d="M20 9 Q18 6 19 4" stroke="#F5DEB3" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path d="M28 9 Q30 6 29 4" stroke="#F5DEB3" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <ellipse cx="12" cy="16" rx="3" ry="2" fill="#1a1a1a"/>
          <ellipse cx="18" cy="19" rx="2" ry="1.5" fill="#1a1a1a"/>
          <ellipse cx="26" cy="16" rx="2.5" ry="2" fill="#FFB6C1"/>
          <circle cx="23" cy="13" r="1" fill="#1a1a1a"/>
          <rect x="9" y="23" width="2" height="5" rx="1" fill="#5D3A1A"/>
          <rect x="14" y="23" width="2" height="5" rx="1" fill="#5D3A1A"/>
          <rect x="18" y="23" width="2" height="5" rx="1" fill="#5D3A1A"/>
          <rect x="21" y="23" width="2" height="5" rx="1" fill="#5D3A1A"/>
          <path d="M6 17 Q3 20 4 23" stroke="#8B4513" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>
      `
      
      const sheepSvg = `
        <svg viewBox="0 0 32 32" width="${size}" height="${size}">
          <circle cx="14" cy="18" r="4" fill="#F5F5DC"/>
          <circle cx="18" cy="16" r="4" fill="#FFFAF0"/>
          <circle cx="12" cy="16" r="3.5" fill="#F5F5DC"/>
          <circle cx="16" cy="20" r="4" fill="#FFFAF0"/>
          <circle cx="20" cy="18" r="3.5" fill="#F5F5DC"/>
          <circle cx="10" cy="18" r="3" fill="#FFFAF0"/>
          <ellipse cx="24" cy="16" rx="4" ry="5" fill="#2F2F2F"/>
          <ellipse cx="21" cy="12" rx="2" ry="1" fill="#2F2F2F"/>
          <ellipse cx="27" cy="12" rx="2" ry="1" fill="#2F2F2F"/>
          <circle cx="23" cy="15" r="1" fill="#1a1a1a"/>
          <circle cx="23" cy="15" r="0.4" fill="#ffffff"/>
          <ellipse cx="26" cy="18" rx="1.5" ry="1" fill="#FFB6C1"/>
          <rect x="10" y="22" width="2" height="5" rx="1" fill="#2F2F2F"/>
          <rect x="14" y="22" width="2" height="5" rx="1" fill="#2F2F2F"/>
          <rect x="18" y="22" width="2" height="5" rx="1" fill="#2F2F2F"/>
          <rect x="20" y="22" width="2" height="5" rx="1" fill="#2F2F2F"/>
        </svg>
      `

      const livestockIcon = L.divIcon({
        className: "livestock-marker",
        html: `
          <div class="animal-marker" style="cursor: pointer; ${highlightStyle} border-radius: 50%; padding: 4px; background: ${isHighlighted ? 'rgba(139, 92, 246, 0.2)' : 'transparent'};">
            ${animal.type === "cow" ? cowSvg : sheepSvg}
            <div class="status-dot" style="background: ${statusColor};"></div>
            <div class="animal-id-label">${animal.id}</div>
            ${animal.status === "alert" ? '<div class="alert-ring"></div>' : ''}
          </div>
          <style>
            .animal-marker { position: relative; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35)); transition: transform 0.2s ease; }
            .animal-marker:hover { transform: scale(1.15); }
            .status-dot { position: absolute; top: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
            .animal-id-label { position: absolute; bottom: -16px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; font-size: 9px; padding: 1px 4px; border-radius: 3px; white-space: nowrap; font-weight: 600; }
            .alert-ring { position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; border: 2px solid #fca5a5; border-radius: 50%; animation: alert-pulse 1s ease-out infinite; }
            @keyframes alert-pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
            @keyframes highlight-pulse { 0%, 100% { box-shadow: 0 0 20px #8b5cf6, 0 0 40px #8b5cf6; } 50% { box-shadow: 0 0 30px #8b5cf6, 0 0 60px #8b5cf6; } }
          </style>
        `,
        iconSize: [size + 8, size + 8],
        iconAnchor: [(size + 8) / 2, size],
      })
      setIcon(livestockIcon)
    })
  }, [animal.type, animal.status, isHighlighted])

  if (!icon) return null

  const statusText = { active: "Activo", resting: "Descansando", alert: "Alerta" }
  const tempDiff = animal.temp - animal.avgTemp
  const tempTrend = tempDiff > 0.3 ? "up" : tempDiff < -0.3 ? "down" : "stable"

  return (
    <Marker 
      position={[animal.lat, animal.lng]} 
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm flex items-center gap-2">
              {animal.type === "cow" ? "Vaca" : "Oveja"}
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {animal.id}
              </span>
            </div>
            <span 
              className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
              style={{ background: statusColors[animal.status] }}
            >
              {statusText[animal.status]}
            </span>
          </div>
          
          {/* Stats */}
          <div className="space-y-1.5 text-xs border-t border-gray-100 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Temperatura:</span>
              <div className="flex items-center gap-1">
                <span className={`font-mono font-medium ${animal.temp > 39.5 ? "text-red-500" : ""}`}>
                  {animal.temp.toFixed(1)}C
                </span>
                {tempTrend === "up" && <span className="text-red-500 text-[10px]">+{tempDiff.toFixed(1)}</span>}
                {tempTrend === "down" && <span className="text-blue-500 text-[10px]">{tempDiff.toFixed(1)}</span>}
                {tempTrend === "stable" && <span className="text-gray-400 text-[10px]">estable</span>}
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Ultimo mov:</span>
              <span className={`font-mono ${animal.lastMovement > 30 ? "text-amber-500 font-medium" : ""}`}>
                hace {animal.lastMovement} min
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
            <button
              onClick={(e) => { e.stopPropagation(); onSendDrone(); }}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-md bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
            >
              <Crosshair className="h-3 w-3" />
              Inspeccionar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onViewHistory(); }}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
            >
              <History className="h-3 w-3" />
              Historial
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

function GateMarker({ status, position, label }: { status: "open" | "closed" | "closing"; position: [number, number]; label: string }) {
  const [icon, setIcon] = useState<L.DivIcon | null>(null)
  
  useEffect(() => {
    import("leaflet").then((L) => {
      const color = status === "open" ? "#ef4444" : status === "closing" ? "#f59e0b" : "#10b981"
      const gateIcon = L.divIcon({
        className: "gate-marker",
        html: `
          <div class="gate-container ${status === 'closing' ? 'animate-pulse' : ''}" style="background: ${color}; border: 2px solid white; border-radius: 8px; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <span style="font-size: 16px;">${status === 'open' ? '🔓' : status === 'closing' ? '⏳' : '🔒'}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      setIcon(gateIcon)
    })
  }, [status])

  if (!icon) return null
  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="p-2 text-center">
          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Port&oacute;n {label}</p>
          <div className={`text-xs font-bold ${status === 'closed' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {status === 'open' ? 'ACCESO ABIERTO' : status === 'closing' ? 'CERRANDO...' : 'ASEGURADO'}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}


function ZonePolygon({ zone, onClick, isSelected }: { zone: Zone; onClick: () => void; isSelected: boolean }) {
  // Determinar color basado en el nombre de la zona para mantener consistencia
  const getZoneColor = (name: string) => {
    if (name.includes("Norte")) return zoneColors.norte
    if (name.includes("Sur")) return zoneColors.sur
    if (name.includes("Este")) return zoneColors.este
    if (name.includes("Oeste")) return zoneColors.oeste
    return "#94a3b8"
  }

  const color = getZoneColor(zone.name)

  if (typeof window === 'undefined') return null

  return (
    <Polygon
      positions={zone.bounds}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: isSelected ? 0.4 : 0.2,
        weight: isSelected ? 3 : 2,
      }}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="p-2 min-w-[180px]">
          <div className="font-bold mb-1 text-sm flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            {zone.name}
          </div>
          <p className="text-xs text-gray-600">{zone.description}</p>
        </div>
      </Popup>
    </Polygon>
  )
}

export const DroneMap = forwardRef<DroneMapRef, DroneMapProps>(function DroneMap(
  { 
    onViewHistory, 
    targetCoordinates, 
    highlightedAnimalId: externalHighlightedId,
    gatesStatuses = {},
    activeSprinklers = new Set()
  },
  ref
) {
  const [mounted, setMounted] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  const [mapLayer, setMapLayer] = useState<MapLayer>("satellite")
  const [followTarget, setFollowTarget] = useState<[number, number] | null>(null)
  const [followZoom, setFollowZoom] = useState(16)
  const [showZones, setShowZones] = useState(true)
  const [showLivestock, setShowLivestock] = useState(true)
  const [showPath, setShowPath] = useState(true)
  const [highlightedAnimal, setHighlightedAnimal] = useState<string | null>(null)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [drone, setDrone] = useState<DronePosition>({
    lat: patrolPoints[0][0],
    lng: patrolPoints[0][1],
    rotation: 0,
    battery: 87,
    altitude: 120,
    speed: 15,
    status: "flying",
  })
  const [targetIndex, setTargetIndex] = useState(0)
  const [livestock, setLivestock] = useState(initialLivestock)
  const [inspectionTarget, setInspectionTarget] = useState<[number, number] | null>(null)

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    sendDroneToCoordinates: (coords: [number, number]) => {
      setInspectionTarget(coords)
      setDrone(prev => ({ ...prev, status: "inspecting", targetCoords: coords }))
      setFollowZoom(20)
      setFollowTarget(coords)
      setTimeout(() => setFollowTarget(null), 2500)
    },
    highlightAnimal: (animalId: string) => {
      setHighlightedAnimal(animalId)
      const animal = livestock.find(a => a.id === animalId)
      if (animal) {
        setFollowZoom(20)
        setFollowTarget([animal.lat, animal.lng])
        setTimeout(() => setFollowTarget(null), 2500)
      }
      // Clear highlight after 10 seconds
      setTimeout(() => setHighlightedAnimal(null), 10000)
    },
    centerOnCoordinates: (coords: [number, number]) => {
      setFollowTarget(coords)
      setTimeout(() => setFollowTarget(null), 2000)
    },
    triggerRTH: () => {
      setInspectionTarget(CENTER)
      setDrone(prev => ({ ...prev, status: "returning", targetCoords: CENTER }))
      setFollowZoom(17)
      setFollowTarget(CENTER)
      
      // Lógica de Rotación: Desaparecer y Reaparecer
      setTimeout(() => {
        setFollowTarget(null)
      }, 2500)
    }
  }), [livestock])

  // Handle external target coordinates
  useEffect(() => {
    if (targetCoordinates) {
      setFollowZoom(20)
      setFollowTarget(targetCoordinates)
      setDrone(prev => ({ ...prev, status: "inspecting", targetCoords: targetCoordinates }))
      setInspectionTarget(targetCoordinates)
      setTimeout(() => setFollowTarget(null), 2500)
    }
  }, [targetCoordinates])

  // Handle external highlighted animal
  useEffect(() => {
    if (externalHighlightedId) {
      setHighlightedAnimal(externalHighlightedId)
      const animal = livestock.find(a => a.id === externalHighlightedId)
      if (animal) {
        setFollowZoom(18)
        setFollowTarget([animal.lat, animal.lng])
        setTimeout(() => setFollowTarget(null), 2500)
      }
      setTimeout(() => setHighlightedAnimal(null), 10000)
    }
  }, [externalHighlightedId, livestock])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Drone movement
  useEffect(() => {
    if (!mounted) return

    const interval = setInterval(() => {
      setDrone((prev) => {
        // If inspecting, move towards inspection target
        if (prev.status === "inspecting" && inspectionTarget) {
          const dlat = inspectionTarget[0] - prev.lat
          const dlng = inspectionTarget[1] - prev.lng
          const distance = Math.sqrt(dlat * dlat + dlng * dlng)

          if (distance < 0.0003) {
            // Arrived at inspection point
            setTimeout(() => {
              setDrone(d => ({ ...d, status: "scanning", targetCoords: undefined }))
              setInspectionTarget(null)
              // Return to patrol after scanning
              setTimeout(() => {
                setDrone(d => ({ ...d, status: "flying" }))
              }, 5000)
            }, 100)
            return { ...prev, altitude: 80 } // Lower altitude for inspection
          }

          const speed = 0.0002
          return {
            ...prev,
            lat: prev.lat + (dlat / distance) * speed,
            lng: prev.lng + (dlng / distance) * speed,
            battery: Math.max(0, prev.battery - 0.005),
            speed: 18 + Math.random() * 5,
            altitude: 90,
          }
        }
        
        // Handle Return to Home (RTH)
        if (prev.status === "returning") {
          const dlat = CENTER[0] - prev.lat
          const dlng = CENTER[1] - prev.lng
          const distance = Math.sqrt(dlat * dlat + dlng * dlng)
          if (distance < 0.0003) {
            // Arrived at Base - Start Landing Sequence
            if (prev.altitude > 0) {
              return { ...prev, speed: 0, altitude: Math.max(0, prev.altitude - 5), battery: Math.min(100, prev.battery + 0.1) }
            }
            
            // Landed - Disappear and trigger rotation
            if (prev.status !== "landed") {
              setTimeout(() => {
                // Spawn new drone after 4 seconds
                setDrone({
                  lat: CENTER[0],
                  lng: CENTER[1],
                  rotation: 0,
                  battery: 100,
                  altitude: 0,
                  speed: 0,
                  status: "takeoff",
                  isVisible: true
                })
              }, 4000)
              return { ...prev, status: "landed", isVisible: false }
            }
            return prev
          }

          const speed = 0.0003 // RTH is faster
          return {
            ...prev,
            lat: prev.lat + (dlat / distance) * speed,
            lng: prev.lng + (dlng / distance) * speed,
            rotation: (Math.atan2(dlng, dlat) * 180) / Math.PI,
            battery: Math.max(0, prev.battery - 0.01),
            speed: 25.0,
            altitude: Math.max(120, prev.altitude),
          }
        }

        // Handle Takeoff Sequence
        if (prev.status === "takeoff") {
          if (prev.altitude < 120) {
            return { ...prev, altitude: prev.altitude + 5, speed: 5, isVisible: true }
          }
          return { ...prev, status: "flying", isVisible: true }
        }

        // Normal patrol
        const target = patrolPoints[targetIndex]
        const dlat = target[0] - prev.lat
        const dlng = target[1] - prev.lng
        const distance = Math.sqrt(dlat * dlat + dlng * dlng)

        if (distance < 0.0005) {
          setTargetIndex((i) => (i + 1) % patrolPoints.length)
          const statuses: DronePosition["status"][] = ["flying", "scanning", "flying"]
          return { ...prev, status: statuses[Math.floor(Math.random() * statuses.length)] }
        }

        const speed = 0.00015
        return {
          ...prev,
          lat: prev.lat + (dlat / distance) * speed,
          lng: prev.lng + (dlng / distance) * speed,
          battery: Math.max(0, prev.battery - 0.003),
          speed: 10 + Math.random() * 8,
          altitude: 115 + Math.floor(Math.random() * 15),
        }
      })
    }, 50)

    return () => clearInterval(interval)
  }, [mounted, targetIndex, inspectionTarget])

  // Livestock movement
  useEffect(() => {
    if (!mounted) return
    const interval = setInterval(() => {
      setLivestock(prev => prev.map(animal => ({
        ...animal,
        lat: animal.lat + (Math.random() - 0.5) * 0.0002,
        lng: animal.lng + (Math.random() - 0.5) * 0.0002,
        temp: Math.max(37.5, Math.min(40.5, animal.temp + (Math.random() - 0.5) * 0.1)),
        lastMovement: animal.status === "resting" ? animal.lastMovement + 1 : Math.max(0, animal.lastMovement + (Math.random() > 0.7 ? 1 : -1)),
      })))
    }, 3000)
    return () => clearInterval(interval)
  }, [mounted])

  const handleCenterDrone = useCallback(() => {
    setFollowTarget([drone.lat, drone.lng])
    setTimeout(() => setFollowTarget(null), 2000)
  }, [drone.lat, drone.lng])

  const handleSendDroneToAnimal = useCallback((animal: Livestock) => {
    setInspectionTarget([animal.lat, animal.lng])
    setDrone(prev => ({ ...prev, status: "inspecting", targetCoords: [animal.lat, animal.lng] }))
    setFollowZoom(19)
    setFollowTarget([animal.lat, animal.lng])
    setTimeout(() => setFollowTarget(null), 2500)
  }, [])

  const handleSearchAnimal = useCallback((animalId: string) => {
    const animal = livestock.find(a => a.id.toLowerCase() === animalId.toLowerCase())
    if (animal) {
      setHighlightedAnimal(animal.id)
      setFollowTarget([animal.lat, animal.lng])
      setTimeout(() => setFollowTarget(null), 2000)
      setTimeout(() => setHighlightedAnimal(null), 10000)
      setSearchQuery("")
      setShowSearch(false)
    }
  }, [livestock])

  const filteredAnimals = searchQuery 
    ? livestock.filter(a => a.id.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  if (!mounted) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
        <CardContent className="p-3 h-full">
          <div className="w-full h-full min-h-[400px] bg-secondary/30 rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground text-sm">Cargando mapa satelital...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const cowCount = livestock.filter(l => l.type === "cow").length
  const sheepCount = livestock.filter(l => l.type === "sheep").length
  const alertCount = livestock.filter(l => l.status === "alert").length

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
      <CardContent className="p-3 h-full flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Mapa en Vivo</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search toggle */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-3 w-3" />
              Buscar
            </Button>
            <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-600 border-emerald-200">
              {cowCount} Vacas
            </Badge>
            <Badge variant="outline" className="text-xs bg-sky-100 text-sky-600 border-sky-200">
              {sheepCount} Ovejas
            </Badge>
            {alertCount > 0 && (
              <Badge className="text-xs bg-rose-100 text-rose-600 border-rose-200 animate-pulse">
                {alertCount} Alertas
              </Badge>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar animal por ID (ej: V-005)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && filteredAnimals[0] && handleSearchAnimal(filteredAnimals[0].id)}
                  className="pl-8 h-9 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Search results dropdown */}
            {searchQuery && filteredAnimals.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {filteredAnimals.map((animal) => (
                  <button
                    key={animal.id}
                    onClick={() => handleSearchAnimal(animal.id)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-sm">{animal.id}</span>
                      <span className="text-xs text-muted-foreground">
                        {animal.type === "cow" ? "Vaca" : "Oveja"}
                      </span>
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: statusColors[animal.status] }}
                      >
                        {animal.status === "active" ? "Activo" : animal.status === "resting" ? "Descansando" : "Alerta"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Navigation className="h-3 w-3" />
                      {animal.lat.toFixed(3)}, {animal.lng.toFixed(3)}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && filteredAnimals.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 p-3 text-center text-sm text-muted-foreground">
                No se encontro animal con ID "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Map Container */}
        <div className="relative flex-1 min-h-[350px] rounded-xl overflow-hidden border border-border/50 shadow-lg">
          <MapContainer
            center={CENTER}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            ref={(map) => {
              if (map) mapRef.current = map
            }}
          >
            {followTarget && (
              <FollowController 
                targetPosition={followTarget}
                shouldFollow={true}
                zoom={followZoom}
              />
            )}

            <MapClickHandler onClick={(coords) => sendDroneToCoordinates(coords)} />
            
            {mounted && (
              <>
                <TileLayer
                  url={tileUrls[mapLayer]}
                  attribution={mapLayer === "terrain" ? "&copy; OpenStreetMap" : "Tiles &copy; Esri"}
                />
                
                {mapLayer === "hybrid" && (
                  <TileLayer
                    url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                    opacity={0.8}
                  />
                )}
              </>
            )}
            
            {showZones && zones.map((zone) => (
              <ZonePolygon 
                key={zone.id} 
                zone={zone}
                onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)}
                isSelected={zone.id === selectedZone}
              />
            ))}

            {showPath && (
              <Polyline
                positions={[...patrolPoints, patrolPoints[0]]}
                pathOptions={{
                  color: "#86efac",
                  weight: 2,
                  dashArray: "8, 12",
                  opacity: 0.7,
                }}
              />
            )}

            {/* Inspection target line */}
            {inspectionTarget && (
              <Polyline
                positions={[[drone.lat, drone.lng], inspectionTarget]}
                pathOptions={{
                  color: "#c4b5fd",
                  weight: 3,
                  dashArray: "6, 8",
                  opacity: 0.9,
                }}
              />
            )}

            {/* Actuadores Visuales: Red de Portones */}
            {Object.entries(gatesStatuses).map(([id, status]) => (
              <GateMarker 
                key={id} 
                status={status} 
                position={id === "Norte" ? [-34.142, -60.200] : id === "Sur" ? [-34.158, -60.200] : id === "Este" ? [-34.150, -60.188] : [-34.150, -60.212]}
                label={id}
              />
            ))}

            {/* Actuadores Visuales: Irrigación (Aspersores) */}
            {zones.filter(z => activeSprinklers.has(z.name.replace("Pastizal ", "").replace("Zona ", "").replace("Bosque ", "").replace("Corrales ", ""))).map(zone => (
              <Circle
                key={`sprinkler-${zone.id}`}
                center={[zone.bounds[0][0] + 0.002, zone.bounds[0][1] + 0.01]}
                radius={100}
                pathOptions={{
                  color: "#0ea5e9",
                  fillColor: "#0ea5e9",
                  fillOpacity: 0.4,
                  weight: 2,
                  dashArray: "4, 4"
                }}
              />
            ))}

            {showLivestock && livestock.map((animal) => (
              <LivestockMarker 
                key={animal.id} 
                animal={animal}
                onClick={() => setHighlightedAnimal(animal.id === highlightedAnimal ? null : animal.id)}
                isHighlighted={animal.id === highlightedAnimal}
                onViewHistory={() => onViewHistory?.(animal.id)}
                onSendDrone={() => handleSendDroneToAnimal(animal)}
              />
            ))}

            <Circle
              center={[drone.lat, drone.lng]}
              radius={drone.status === "inspecting" ? 150 : 250}
              pathOptions={{
                color: drone.status === "inspecting" ? "#c4b5fd" : drone.status === "scanning" ? "#f59e0b" : "#22c55e",
                fillColor: drone.status === "inspecting" ? "#c4b5fd" : drone.status === "scanning" ? "#f59e0b" : "#22c55e",
                fillOpacity: 0.08,
                weight: 1,
                dashArray: drone.status === "scanning" || drone.status === "inspecting" ? "4, 4" : undefined,
              }}
            />

            {drone.isVisible !== false && (
              <MovingDroneMarker 
                position={[drone.lat, drone.lng]} 
                battery={drone.battery}
                altitude={drone.altitude}
                speed={drone.speed}
                status={drone.status === "returning" && drone.altitude < 50 ? "landed" : drone.status}
                targetCoords={drone.targetCoords}
                onClick={handleCenterDrone}
              />
            )}
          </MapContainer>

          {/* Map Controls */}
          <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
            <div className="bg-background/95 backdrop-blur-sm rounded-lg p-1.5 border border-border/50 shadow-lg">
              <div className="flex flex-col gap-1">
                {[
                  { key: "satellite" as MapLayer, icon: "S", label: "Satelite" },
                  { key: "terrain" as MapLayer, icon: "T", label: "Terreno" },
                  { key: "hybrid" as MapLayer, icon: "H", label: "Hibrido" },
                ].map((layer) => (
                  <button
                    key={layer.key}
                    onClick={() => setMapLayer(layer.key)}
                    className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${
                      mapLayer === layer.key
                        ? "bg-emerald-500 text-white shadow-md"
                        : "bg-secondary/80 hover:bg-secondary text-foreground"
                    }`}
                    title={layer.label}
                  >
                    {layer.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-background/95 backdrop-blur-sm rounded-lg p-1.5 border border-border/50 shadow-lg">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setShowZones(!showZones)}
                  className={`w-8 h-8 rounded-md text-xs transition-all flex items-center justify-center ${
                    showZones ? "bg-sky-100 text-sky-600" : "bg-secondary/80 text-muted-foreground"
                  }`}
                  title="Mostrar zonas"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                </button>
                <button
                  onClick={() => setShowLivestock(!showLivestock)}
                  className={`w-8 h-8 rounded-md text-xs transition-all flex items-center justify-center ${
                    showLivestock ? "bg-amber-100 text-amber-600" : "bg-secondary/80 text-muted-foreground"
                  }`}
                  title="Mostrar ganado"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="3"/>
                    <circle cx="6" cy="8" r="2"/>
                    <circle cx="18" cy="8" r="2"/>
                    <circle cx="6" cy="16" r="2"/>
                    <circle cx="18" cy="16" r="2"/>
                  </svg>
                </button>
                <button
                  onClick={() => setShowPath(!showPath)}
                  className={`w-8 h-8 rounded-md text-xs transition-all flex items-center justify-center ${
                    showPath ? "bg-emerald-100 text-emerald-600" : "bg-secondary/80 text-muted-foreground"
                  }`}
                  title="Mostrar ruta"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2">
                    <path d="M3 12h18M12 3v18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Drone panel */}
          <div className="absolute bottom-3 left-3 right-3 z-[1000]">
            <div className="bg-background/95 backdrop-blur-sm rounded-lg p-3 border border-border/50 shadow-lg">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                      drone.status === "inspecting" ? "bg-violet-500" :
                      drone.status === "scanning" ? "bg-amber-500" : "bg-emerald-500"
                    }`} />
                    <span className="text-xs font-medium">AgroEye-01</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      drone.status === "inspecting" ? "bg-violet-100 text-violet-700" :
                      drone.status === "scanning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {drone.status === "flying" ? "En vuelo" : drone.status === "scanning" ? "Escaneando" : drone.status === "inspecting" ? "Inspeccionando" : "Regresando"}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-border hidden sm:block" />
                  <div className="hidden sm:flex items-center gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Alt: </span>
                      <span className="font-mono font-medium">{drone.altitude}m</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vel: </span>
                      <span className="font-mono font-medium">{drone.speed.toFixed(1)}km/h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bat: </span>
                      <span className={`font-mono font-medium ${drone.battery < 20 ? "text-rose-500" : ""}`}>
                        {drone.battery.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCenterDrone}
                  className="h-7 text-xs gap-1.5"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  Centrar Dron
                </Button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute top-3 right-3 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-2.5 border border-border/50 shadow-lg text-[11px] space-y-2">
            <div className="font-medium text-xs mb-1.5 text-muted-foreground">Leyenda</div>
            <div className="space-y-1.5">
              {[
                { color: zoneColors.safe, label: "Zona Segura" },
                { color: zoneColors.warning, label: "Precaucion" },
                { color: zoneColors.danger, label: "Peligro" },
                { color: zoneColors.monitored, label: "Monitoreado" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: item.color, opacity: 0.6 }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border/50 pt-2 mt-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Activo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-500" />
                <span>Descansando</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span>Alerta</span>
              </div>
            </div>
          </div>

          {/* Highlighted animal info panel */}
          {highlightedAnimal && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="bg-violet-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                <Crosshair className="h-4 w-4" />
                <span className="text-sm font-medium">Animal {highlightedAnimal} localizado</span>
                <button
                  onClick={() => setHighlightedAnimal(null)}
                  className="ml-1 p-0.5 rounded-full hover:bg-white/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
