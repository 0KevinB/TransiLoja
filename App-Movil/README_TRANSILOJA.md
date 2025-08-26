# TransiLoja - Aplicación Móvil

TransiLoja es una aplicación móvil de transporte público para la ciudad de Loja, Ecuador. Permite a los usuarios encontrar rutas óptimas, consultar paradas cercanas, ver buses en tiempo real y acceder a información del sistema de transporte público.

## Características Principales

### 🚌 Planificación de Rutas
- Algoritmo RAPTOR para optimización de rutas
- Búsqueda de rutas multimodal (caminata + transporte público)
- Múltiples opciones de ruta con diferentes tiempos y transferencias
- Navegación paso a paso

### 📍 Paradas y Ubicación
- Listado completo de paradas de transporte público
- Búsqueda por nombre o código de parada
- Paradas cercanas basadas en GPS
- Información de rutas que pasan por cada parada

### 🗺️ Mapa Interactivo
- Visualización de paradas y buses en tiempo real
- Mapa temático (claro/oscuro) según preferencias
- Seguimiento de ubicación del usuario
- Información detallada al tocar marcadores

### 🎨 Accesibilidad y Personalización
- **Temas flexibles**: Claro, oscuro y alto contraste
- **Colorimetría personalizable**: Adaptable a diferentes municipios
- **Escalado de fuente**: Respeta la configuración del sistema y permite ajustes adicionales
- **Diseño responsive**: Adaptado a diferentes tamaños de pantalla

### 🔔 Notificaciones y Alertas
- Alertas del sistema de transporte en tiempo real
- Notificaciones personalizables
- Información de interrupciones de servicio

## Tecnologías Utilizadas

- **React Native con Expo** - Framework de desarrollo
- **TypeScript** - Tipado estático
- **Firebase** - Backend (Auth, Firestore, Storage)
- **React Native Maps** - Mapas interactivos
- **Expo Location** - Servicios de ubicación
- **Expo Notifications** - Sistema de notificaciones
- **AsyncStorage** - Persistencia local de datos

## Configuración del Proyecto

### Prerrequisitos
- Node.js (v16 o superior)
- npm o yarn
- Expo CLI (`npm install -g @expo/cli`)
- Cuenta de Firebase configurada

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd App-Movil
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crear archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales de Firebase
   ```

### Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS (solo en macOS)
npm run ios

# Ejecutar en web
npm run web

# Linting
npm run lint
```

### Configuración de Firebase

1. **Crear proyecto en Firebase Console**
2. **Habilitar servicios necesarios:**
   - Authentication (Email/Password)
   - Firestore Database
   - Storage (opcional)

3. **Estructura de Firestore:**
   ```
   /municipios/{municipioId}
   /paradas/{paradaId}
   /rutas/{rutaId}
   /buses/{busId}
   /conductores/{conductorId}
   /viajes/{viajeId}
   /alertas/{alertaId}
   /usuarios/{userId}
   ```

## Arquitectura de la Aplicación

### Estructura de Carpetas
```
App-Movil/
├── app/                    # Pantallas (Expo Router)
│   ├── (tabs)/            # Navegación principal
│   ├── auth/              # Autenticación
│   └── map.tsx            # Mapa completo
├── components/            # Componentes reutilizables
│   └── ui/               # Componentes de interfaz
├── context/              # Contextos de React
├── hooks/                # Hooks personalizados
├── lib/                  # Utilidades y tipos
└── assets/               # Recursos estáticos
```

### Contextos Principales

- **ThemeContext**: Manejo de temas y accesibilidad
- **AuthContext**: Autenticación de usuarios
- **TransportContext**: Datos de transporte público

### Algoritmo RAPTOR

Implementación del algoritmo RAPTOR (Round-bAsed Public Transit Optimized Router) para encontrar rutas óptimas:
- Múltiples rondas de exploración
- Optimización por tiempo de viaje
- Soporte para transferencias
- Integración con caminata inicial y final

## Personalización para Municipios

La aplicación está diseñada para ser flexible y adaptarse a diferentes municipios:

### Configuración de Colores
```typescript
// Variables de entorno
EXPO_PUBLIC_PRIMARY_COLOR=#1E40AF      // Color primario
EXPO_PUBLIC_SECONDARY_COLOR=#3B82F6    // Color secundario  
EXPO_PUBLIC_ACCENT_COLOR=#60A5FA       // Color de acento
EXPO_PUBLIC_LOGO_URL=path/to/logo.png  // Logo del municipio
```

### Base de Datos por Municipio
Cada municipio tiene su propia configuración en Firestore:
```typescript
interface Municipio {
  id: string;
  nombre: string;
  codigo: string;
  configuracion: {
    colores: {
      primario: string;
      secundario: string;
      acento: string;
    };
    logo_url?: string;
  };
}
```

## Desarrollo y Contribución

### Estilo de Código
- Usar TypeScript para todo el código
- Seguir convenciones de React Native
- Usar componentes funcionales con Hooks
- Mantener accesibilidad en todos los componentes

### Testing
```bash
# Ejecutar tests (cuando estén configurados)
npm test
```

### Build para Producción
```bash
# Build con EAS
eas build -p android
eas build -p ios
```

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para soporte técnico o reportar problemas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

**TransiLoja** - Conectando a la ciudad a través del transporte público inteligente.