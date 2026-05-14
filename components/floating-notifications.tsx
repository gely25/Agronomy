"use client"

import { useState, useEffect, useCallback } from "react"
import { X, MapPin, ChevronRight, Flame, Thermometer, Droplets, AlertTriangle, History, Navigation, Copy, Check, Home, RefreshCw, Battery, Plane, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export type NotificationType = "fire" | "temperature" | "humidity" | "animal" | "drone" | "system"
export type NotificationPriority = "low" | "medium" | "high" | "critical"

export interface FloatingNotification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  location?: string
  coordinates?: [number, number]
  animalId?: string
  timestamp: Date
  actionLabel?: string
}

interface FloatingNotificationsProps {
  onNavigateToMap?: (coordinates?: [number, number], animalId?: string) => void
  onNavigateToAlerts?: () => void
  onViewAnimalHistory?: (animalId: string) => void
}

const notificationConfig: Record<NotificationType, { icon: typeof Flame; gradient: string; border: string }> = {
  fire: { 
    icon: Flame, 
    gradient: "from-rose-100 to-orange-50",
    border: "border-l-rose-400"
  },
  temperature: { 
    icon: Thermometer, 
    gradient: "from-amber-100 to-yellow-50",
    border: "border-l-amber-400"
  },
  humidity: { 
    icon: Droplets, 
    gradient: "from-sky-100 to-cyan-50",
    border: "border-l-sky-400"
  },
  animal: { 
    icon: AlertTriangle, 
    gradient: "from-violet-100 to-purple-50",
    border: "border-l-violet-400"
  },
  drone: { 
    icon: MapPin, 
    gradient: "from-emerald-100 to-green-50",
    border: "border-l-emerald-400"
  },
  system: { 
    icon: AlertTriangle, 
    gradient: "from-slate-100 to-gray-50",
    border: "border-l-slate-400"
  },
}

const priorityStyles: Record<NotificationPriority, string> = {
  low: "",
  medium: "",
  high: "shadow-lg shadow-rose-200/50",
  critical: "shadow-xl shadow-rose-300/60 animate-pulse",
}

// Datos de notificaciones simuladas
const notificationTemplates: Omit<FloatingNotification, "id" | "timestamp">[] = [
  {
    type: "fire",
    priority: "high",
    title: "Riesgo de Incendio",
    message: "Temperatura critica detectada en Zona Este. Humedad al 18%.",
    location: "Zona Este - Sector 4",
    coordinates: [-34.145, -60.185],
    actionLabel: "Activar Aspersores",
  },
  {
    type: "animal",
    priority: "medium",
    title: "Ganado en Movimiento",
    message: "V-003 se desplazo fuera del perimetro asignado.",
    location: "Perimetro Norte",
    coordinates: [-34.143, -60.200],
    animalId: "V-003",
    actionLabel: "Cerrar Portón",
  },
  {
    type: "temperature",
    priority: "medium",
    title: "Alerta de Temperatura",
    message: "Temperatura supera 37C en area de pastoreo principal.",
    location: "Area Central",
    coordinates: [-34.145, -60.205],
    actionLabel: "Iniciar Riego",
  },
  {
    type: "humidity",
    priority: "low",
    title: "Humedad Baja",
    message: "Nivel de humedad descendio al 25% en sector forestal.",
    location: "Bosque Sur",
    coordinates: [-34.155, -60.210],
    actionLabel: "Riego Puntual",
  },
  {
    type: "drone",
    priority: "medium",
    title: "Dron: Bateria Baja - 23%",
    message: "AgroEye-01 requiere decision: retornar a base o continuar mision.",
    location: "Sector Norte - 2.3km de base",
    actionLabel: "Gestionar",
  },
  {
    type: "drone",
    priority: "low",
    title: "Dron: Mision Completada",
    message: "AgroEye-01 finalizo patrullaje de Zona Este. Listo para nueva mision.",
    location: "Base Principal",
    actionLabel: "Asignar",
  },
  {
    type: "animal",
    priority: "high",
    title: "Animal Inmovil - V-005",
    message: "V-005 no registra movimiento por 45 min. Temp: 39.8C",
    location: "Zona Oeste - Potrero 2",
    coordinates: [-34.157, -60.205],
    animalId: "V-005",
    actionLabel: "Llamar Vet",
  },
  {
    type: "animal",
    priority: "medium",
    title: "Temperatura Alta - V-002",
    message: "V-002 presenta temperatura de 39.2C, +1.2C del promedio.",
    location: "Pastizal Norte",
    coordinates: [-34.145, -60.205],
    animalId: "V-002",
    actionLabel: "Inspeccionar",
  },
  {
    type: "fire",
    priority: "critical",
    title: "ALERTA CRITICA",
    message: "Focos de calor detectados. Posible inicio de incendio.",
    location: "Limite Noreste",
    coordinates: [-34.142, -60.175],
    actionLabel: "Emergencia",
  },
]

export function FloatingNotifications({ 
  onNavigateToMap, 
  onNavigateToAlerts,
  onViewAnimalHistory 
}: FloatingNotificationsProps) {
  const [notifications, setNotifications] = useState<FloatingNotification[]>([])
  const [isHovered, setIsHovered] = useState<string | null>(null)
  const [copiedCoord, setCopiedCoord] = useState<string | null>(null)
  const [droneAction, setDroneAction] = useState<{ id: string; action: string } | null>(null)

  const addNotification = useCallback(() => {
    const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)]
    const newNotification: FloatingNotification = {
      ...template,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 4)
      return updated
    })

    // Auto-remove after 10 seconds (unless critical)
    if (template.priority !== "critical") {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, 10000)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const handleExecuteAction = useCallback((notification: FloatingNotification) => {
    const action = notification.actionLabel
    
    // Simular ejecucion de comando ciberfisico
    if (action?.includes("Riego") || action?.includes("Aspersores")) {
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">Comando de Riego Ejecutado</span>
          <span className="text-xs">Sistema activado en {notification.location}. Telemetria actualizandose...</span>
        </div>
      )
      window.dispatchEvent(new CustomEvent('update-system-status', { detail: { action: "riego" } }))
    } else if (action === "Cerrar Portón") {
      toast.info(
        <div className="flex flex-col gap-1">
          <span className="font-bold">Infraestructura Bloqueada</span>
          <span className="text-xs">Portones perimetrales cerrados para contencion de {notification.animalId}.</span>
        </div>
      )
    } else if (action === "Llamar Vet") {
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">Veterinario Alertado</span>
          <span className="text-xs">Ficha medica de {notification.animalId} enviada al equipo de salud.</span>
        </div>
      )
      if (notification.animalId) {
        window.dispatchEvent(new CustomEvent('update-animal-stats', { detail: { animalId: notification.animalId } }))
      }
    } else if (action === "Inspeccionar") {
      toast.success(
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 animate-pulse text-emerald-500" />
          <span>Dron desplegado a coordenadas rurales {notification.coordinates?.[0].toFixed(3)}, {notification.coordinates?.[1].toFixed(3)}</span>
        </div>
      )
    } else if (action === "Emergencia") {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-bold">PROTOCOLO DE EMERGENCIA</span>
          <span className="text-xs">Alertando a brigada local y desplegando drones de extincion.</span>
        </div>
      )
      window.dispatchEvent(new CustomEvent('update-system-status', { detail: { action: "emergency" } }))
    }

    if (notification.coordinates && onNavigateToMap) {
      onNavigateToMap(notification.coordinates, notification.animalId)
    }
    removeNotification(notification.id)
  }, [onNavigateToMap, removeNotification])

  const handleNavigateToMap = useCallback((notification: FloatingNotification) => {
    if (notification.coordinates && onNavigateToMap) {
      onNavigateToMap(notification.coordinates, notification.animalId)
    }
    removeNotification(notification.id)
  }, [onNavigateToMap, removeNotification])

  const handleViewHistory = useCallback((notification: FloatingNotification) => {
    if (notification.animalId && onViewAnimalHistory) {
      onViewAnimalHistory(notification.animalId)
    }
    removeNotification(notification.id)
  }, [onViewAnimalHistory, removeNotification])

  const handleCopyCoordinates = useCallback((notification: FloatingNotification) => {
    if (notification.coordinates) {
      const coordString = `${notification.coordinates[0].toFixed(5)}, ${notification.coordinates[1].toFixed(5)}`
      navigator.clipboard.writeText(coordString)
      setCopiedCoord(notification.id)
      setTimeout(() => setCopiedCoord(null), 2000)
    }
  }, [])

  const handleDroneAction = useCallback((notification: FloatingNotification, action: "return" | "continue" | "swap") => {
    setDroneAction({ id: notification.id, action })
    
    // Simular accion del dron
    setTimeout(() => {
      setDroneAction(null)
      removeNotification(notification.id)
      
      // Agregar notificacion de confirmacion
      const confirmNotification: FloatingNotification = {
        id: `confirm-${Date.now()}`,
        type: "drone",
        priority: "low",
        title: action === "return" 
          ? "Dron: Retornando a Base" 
          : action === "swap"
            ? "Dron: AgroEye-02 Activado"
            : "Dron: Mision Extendida",
        message: action === "return"
          ? "AgroEye-01 en camino a estacion de carga. ETA: 8 min."
          : action === "swap"
            ? "AgroEye-02 asumiendo patrullaje. AgroEye-01 en retorno."
            : "AgroEye-01 continuara 15 min adicionales con bateria de reserva.",
        location: action === "return" ? "En transito a base" : "Sector Norte",
        timestamp: new Date(),
      }
      
      setNotifications(prev => [confirmNotification, ...prev].slice(0, 4))
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== confirmNotification.id))
      }, 6000)
    }, 1500)
  }, [removeNotification])

  // Agregar notificaciones periodicamente
  useEffect(() => {
    const initialTimeout = setTimeout(addNotification, 3000)
    
    const interval = setInterval(() => {
      if (Math.random() < 0.6) {
        addNotification()
      }
    }, 10000 + Math.random() * 5000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [addNotification])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((notification, index) => {
        const config = notificationConfig[notification.type]
        const Icon = config.icon
        const isCurrentHovered = isHovered === notification.id
        const hasAnimal = !!notification.animalId

        return (
          <div
            key={notification.id}
            className={cn(
              "pointer-events-auto",
              "transform transition-all duration-500 ease-out",
              index === 0 ? "animate-in slide-in-from-right-full" : ""
            )}
            style={{
              opacity: 1 - index * 0.12,
              transform: `scale(${1 - index * 0.02})`,
            }}
            onMouseEnter={() => setIsHovered(notification.id)}
            onMouseLeave={() => setIsHovered(null)}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-xl border-l-4 bg-gradient-to-r",
                config.gradient,
                config.border,
                priorityStyles[notification.priority],
                "backdrop-blur-sm",
                "transition-all duration-300",
                isCurrentHovered ? "scale-[1.02]" : ""
              )}
            >
              {/* Progress bar for auto-dismiss */}
              {notification.priority !== "critical" && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-black/5">
                  <div 
                    className="h-full bg-black/20 animate-shrink-width"
                    style={{ animationDuration: "10s" }}
                  />
                </div>
              )}

              <div className="p-3">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 p-2 rounded-lg",
                    notification.priority === "critical" 
                      ? "bg-rose-200 animate-pulse" 
                      : "bg-white/60"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      notification.type === "fire" && "text-rose-500",
                      notification.type === "temperature" && "text-amber-500",
                      notification.type === "humidity" && "text-sky-500",
                      notification.type === "animal" && "text-violet-500",
                      notification.type === "drone" && "text-emerald-500",
                      notification.type === "system" && "text-slate-500",
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={cn(
                        "text-sm font-semibold truncate",
                        notification.priority === "critical" ? "text-rose-700" : "text-gray-800"
                      )}>
                        {notification.title}
                      </h4>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
                      >
                        <X className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>

                    {/* Animal ID Badge */}
                    {hasAnimal && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 bg-violet-200 text-violet-700 text-[10px] font-bold rounded-full">
                          ID: {notification.animalId}
                        </span>
                      </div>
                    )}

                    {/* Location with coordinates */}
                    {notification.location && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-[10px] text-gray-500">{notification.location}</span>
                      </div>
                    )}

                    {/* Coordinates display */}
                    {notification.coordinates && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Navigation className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {notification.coordinates[0].toFixed(4)}, {notification.coordinates[1].toFixed(4)}
                        </span>
                        <button
                          onClick={() => handleCopyCoordinates(notification)}
                          className="p-0.5 rounded hover:bg-emerald-100 transition-colors"
                          title="Copiar coordenadas"
                        >
                          {copiedCoord === notification.id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      {/* Drone-specific actions */}
                      {notification.type === "drone" && notification.title.includes("Bateria") && (
                        <>
                          {droneAction?.id === notification.id ? (
                            <div className="flex items-center gap-2 text-xs text-emerald-600">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Ejecutando {droneAction.action === "return" ? "retorno" : droneAction.action === "swap" ? "cambio" : "extension"}...</span>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleDroneAction(notification, "return")}
                                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-all"
                              >
                                <Home className="h-3 w-3" />
                                Retornar a Base
                              </button>
                              <button
                                onClick={() => handleDroneAction(notification, "swap")}
                                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full bg-sky-500 text-white hover:bg-sky-600 shadow-sm transition-all"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Cambiar Dron
                              </button>
                              <button
                                onClick={() => handleDroneAction(notification, "continue")}
                                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full bg-white/80 text-gray-700 hover:bg-white hover:shadow-sm transition-all"
                              >
                                <Battery className="h-3 w-3" />
                                Continuar
                              </button>
                            </>
                          )}
                        </>
                      )}

                      {/* Map navigation for non-drone or drone without battery issue */}
                      {notification.coordinates && notification.type !== "drone" && (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleExecuteAction(notification)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1 text-xs font-bold",
                              "px-2.5 py-2 rounded-lg shadow-sm transition-all active:scale-95",
                              notification.priority === "critical" || notification.actionLabel === "Emergencia"
                                ? "bg-rose-600 text-white hover:bg-rose-700"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            )}
                          >
                            {notification.actionLabel === "Inspeccionar" || notification.actionLabel === "Llamar Vet" ? (
                              <Plane className="h-3 w-3" />
                            ) : (
                              <Activity className="h-3 w-3" />
                            )}
                            {notification.actionLabel || "Ejecutar"}
                          </button>
                          
                          <button
                            onClick={() => handleNavigateToMap(notification)}
                            className="p-2 rounded-lg bg-white/50 text-gray-700 hover:bg-white hover:shadow-sm transition-all active:scale-95"
                            title="Ver en mapa"
                          >
                            <MapPin className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      {hasAnimal && (
                        <button
                          onClick={() => handleViewHistory(notification)}
                          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full bg-white/80 text-gray-700 hover:bg-white hover:shadow-sm transition-all duration-200"
                        >
                          <History className="h-3 w-3" />
                          Historial
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    {notification.timestamp.toLocaleTimeString("es-ES", { 
                      hour: "2-digit", 
                      minute: "2-digit",
                      second: "2-digit"
                    })}
                  </span>
                  {notification.priority === "critical" && (
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide animate-pulse">
                      Requiere atencion
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
