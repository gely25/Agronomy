"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Smartphone,
  Moon,
  Wifi,
  MapPin,
  Volume2,
  Shield,
  Zap,
} from "lucide-react"

interface SettingItemProps {
  icon: typeof Bell
  title: string
  description: string
  defaultChecked?: boolean
}

function SettingItem({
  icon: Icon,
  title,
  description,
  defaultChecked = false,
}: SettingItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  )
}

export function SettingsView() {
  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Configuración del Sistema
            </CardTitle>
            <Badge className="bg-primary/10 text-primary border-primary/30">
              v2.4.1
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingItem
            icon={Bell}
            title="Notificaciones Push"
            description="Recibir alertas en tiempo real"
            defaultChecked
          />
          <SettingItem
            icon={Volume2}
            title="Sonido de Alertas"
            description="Reproducir sonido en alertas críticas"
            defaultChecked
          />
          <SettingItem
            icon={Smartphone}
            title="Vibración"
            description="Vibrar al recibir alertas"
            defaultChecked
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Preferencias del Dron
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingItem
            icon={MapPin}
            title="Seguimiento GPS"
            description="Mostrar posición del dron en mapa"
            defaultChecked
          />
          <SettingItem
            icon={Wifi}
            title="Modo Offline"
            description="Almacenar datos sin conexión"
          />
          <SettingItem
            icon={Zap}
            title="Modo Ahorro de Batería"
            description="Reducir frecuencia de actualización"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Apariencia y Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingItem
            icon={Moon}
            title="Modo Oscuro"
            description="Usar tema oscuro"
            defaultChecked
          />
          <SettingItem
            icon={Shield}
            title="Autenticación Biométrica"
            description="Requerir huella o Face ID"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Información del Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID del Dron</span>
              <span className="font-mono text-foreground">DRN-2024-0451</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Firmware</span>
              <span className="font-mono text-foreground">3.2.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última sincronización</span>
              <span className="font-mono text-foreground">Hace 2 min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cobertura de red</span>
              <span className="font-mono text-primary">Excelente</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
