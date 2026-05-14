# 🛠️ Manual de Instalación - AgroEye Live AI

Sigue estos pasos para configurar y ejecutar el entorno de desarrollo de AgroEye en tu máquina local.

## 📋 Requisitos Previos

Asegúrate de tener instalado lo siguiente:
- **Node.js** (Versión 18.x o superior)
- **npm** o **pnpm** (recomendado pnpm)
- **Git**

## 🔧 Pasos de Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/gely25/Agronomy.git
cd Agronomy
```

### 2. Instalar Dependencias
Utiliza pnpm para una gestión eficiente de los paquetes:
```bash
pnpm install
# O si usas npm:
npm install
```

### 3. Configuración de Entorno
Crea un archivo `.env.local` en la raíz (opcional para simulación):
```bash
# Ejemplo si se requiere una API Key de Mapas en el futuro
NEXT_PUBLIC_MAPS_API_KEY=your_key_here
```

### 4. Ejecución en Desarrollo
Inicia el servidor local:
```bash
pnpm dev
# O con npm:
npm run dev
```

El sistema estará disponible en [http://localhost:3000](http://localhost:3000).

## 🚀 Despliegue (Producción)

Para generar la versión optimizada para producción:
```bash
pnpm build
pnpm start
```

## 🛡️ Notas de Operación
- El mapa utiliza capas de **Esri World Imagery**; asegúrate de tener conexión a internet para cargar los azulejos satelitales.
- El sistema de auditoría persiste en memoria durante la sesión; para persistencia real, conectar a una base de datos compatible con el modelo `Alert` definido en `app/page.tsx`.

---
© 2026 AgroEye Team - Soporte Técnico: support@agroeye.ai
