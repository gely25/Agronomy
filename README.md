<div align="center">

# 🛰️ AgroEye Live AI
### *Plataforma de Operaciones Agrícolas de Grado Industrial*

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

<p align="center">
  <b>Monitorización satelital, despliegue de drones y control de actuadores en tiempo real.</b><br>
  AgroEye transforma la gestión rural en una operación ciberfísica de alta precisión.
</p>

![AgroEye Banner](https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=1200)

</div>

## 🚀 Funcionalidades Principales

### 🛸 Ecosistema de Drones Tácticos
*   **Inspección 4K**: Zoom digital de 2.8x con enfoque automático en objetivos.
*   **Navegación Táctica**: Reubicación de unidades mediante clics directos en el mapa.
*   **Relay de Energía**: Sistema automático de rotación (Hangar -> Misión -> RTH) para cobertura ininterrumpida.

### 🔒 Red de Seguridad Perimetral
*   **Actuadores de Acceso**: Control remoto de portones Norte, Sur, Este y Oeste.
*   **Verificación Visual**: Cámara de dron integrada para confirmar cierres físicos y seguridad.
*   **Protocolos de Mitigación**: Activación de aspersores de riego preventivo ante riesgos de incendio.

### 📋 Sistema de Auditoría Industrial
*   **Trazabilidad Total**: Registro inalterable con fecha, hora, sensor fuente y estado de atención.
*   **Centro de Filtrado**: Búsqueda avanzada por severidad, categoría y fecha.

---

## 🔔 Catálogo de Notificaciones y Alertas

El sistema AgroEye utiliza IA para clasificar eventos en tiempo real. Aquí el detalle de cada protocolo:

| Tipo de Alerta | Severidad | Origen del Sensor | Acción Recomendada |
| :--- | :--- | :--- | :--- |
| **🔥 Fuego / Humo** | 🔴 CRÍTICA | Sensor Térmico / Óptico | Desplegar Dron + Activar Riego Preventivo |
| **🐮 Ganado Fuera** | 🟡 MEDIA | Biometría GPS | Inspección visual para verificar rotura de vallas |
| **🔓 Portón Abierto** | 🔴 ALTA | Actuador Magnético | Comando de cierre remoto + Verificación con Dron |
| **🌡️ Temp. Extrema** | 🟡 MEDIA | AGRO-NODE (Ambiente) | Activar protocolos de hidratación de ganado |
| **🌱 Humedad Baja** | 🟢 BAJA | Sensor de Suelo | Programación de ciclo de riego en zona afectada |

---

## 🏗️ Arquitectura del Sistema

```mermaid
graph TD
    A[Sensores de Campo / AGRO-NODE] -->|Telemetría| B(Servidor de IA AgroEye)
    B -->|Detección de Anomalías| C{Gestión de Alertas}
    C -->|Notificación| D[Dashboard Operador]
    D -->|Comando Manual| E[Flota de Drones]
    D -->|Comando Manual| F[Red de Portones]
    E -->|Verificación Visual| D
    F -->|Confirmación de Estado| D
```

---

<div align="center">

### 🛠️ Configuración Rápida

1. `pnpm install`  
2. `pnpm dev`  
3. Accede a `localhost:3000`

---
© 2026 **AgroEye Team** | *Eficiencia. Seguridad. Innovación.*
</div>
