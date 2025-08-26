# TransiLoja - Aplicación Móvil con OpenStreetMap

## 🗺️ Mapa Único con OpenStreetMap

### ✅ Cambios Implementados:
- **Solo OpenStreetMap**: Implementación 100% gratuita usando exclusivamente OpenStreetMap
- **WebView optimizado**: Integración perfecta con React Native usando `react-native-webview`
- **Reemplazo completo**: Todos los componentes de mapa ahora usan LeafletMapView
- **Visualización completa**: Todos los datos se muestran correctamente en el mapa

### 📱 Componentes Actualizados:
- `LeafletMapView.tsx`: Componente principal del mapa con Leaflet
- `MapView.tsx`: Ahora redirige a LeafletMapView
- `MapView.web.tsx`: También usa LeafletMapView para consistencia
- `app/map.tsx`: Actualizado para usar solo OpenStreetMap
- `TripPlanner.tsx`: Integrado con LeafletMapView

## 🎯 Datos Mostrados en el Mapa

### Paradas de Transporte:
- **Marcadores circulares**: Fáciles de identificar
- **Colores diferenciados**: 
  - 🟡 Amarillo: Paradas normales
  - 🟢 Verde: Puntos de conexión
  - 🔴 Rojo: Paradas inactivas
- **Información completa**: 
  - Nombre de la parada
  - Código de identificación
  - Coordenadas exactas
  - Estado (activa/inactiva)

### Rutas de Buses:
- **Líneas continuas**: Muestran el recorrido completo
- **Colores personalizables**: Cada ruta con su color distintivo
- **Líneas punteadas**: Para rutas inactivas
- **Detalles emergentes**: 
  - Nombre de la ruta
  - Código de identificación
  - Número de paradas
  - Descripción del recorrido

### Buses en Tiempo Real:
- **Marcadores de buses**: 🚌 Visualización clara
- **Estados del bus**:
  - 🟢 Verde: En ruta
  - 🟡 Amarillo: En parada
  - 🔴 Rojo: Offline/Inactivo
- **Información del vehículo**: 
  - Número de placa
  - Número interno
  - Ruta asignada
  - Velocidad (si disponible)
  - Coordenadas actuales

### Ubicación del Usuario:
- **Marcador especial**: 📍 Pin azul distintivo
- **Círculo de precisión**: Indica la exactitud de la ubicación
- **Actualización automática**: Se actualiza al cambiar la posición
- **Botón de centrado**: Para volver a la ubicación actual

## 🚀 Cómo Usar

### Ver Información en el Mapa:
1. Abrir la aplicación y ir a la pestaña "Mapa"
2. El mapa mostrará automáticamente:
   - 📍 Tu ubicación actual (si tienes permisos)
   - 🟡 Paradas de transporte cercanas
   - 🔵 Rutas de buses activas
   - 🚌 Buses en tiempo real (si está habilitado)
3. Tocar cualquier elemento para ver información detallada
4. Usar los controles para:
   - 🎯 Centrar en tu ubicación
   - 🔄 Actualizar datos
   - 📍 Planificar viaje

### Controles Disponibles:
- **Toggle de capas**: Activar/desactivar paradas, rutas, buses
- **Botón de ubicación**: Centrar mapa en tu posición
- **Botón de actualización**: Refrescar datos del transporte
- **Botón de planificación**: Abrir planificador de viajes

### Planificador de Viajes:
1. Tocar el botón de planificación (ícono de direcciones)
2. Seleccionar origen y destino usando:
   - Búsqueda de paradas/rutas
   - Toque directo en el mapa
   - Ubicación actual
3. Configurar preferencias de viaje (opcional)
4. Ver rutas sugeridas con detalles completos

## 🛠️ Características Técnicas

### Tecnologías Utilizadas:
- **OpenStreetMap**: Mapas gratuitos y de código abierto
- **Leaflet**: Biblioteca de mapas ligera y eficiente
- **React Native WebView**: Integración nativa optimizada
- **TypeScript**: Tipado fuerte para mejor mantenimiento

### Optimizaciones:
- **Carga diferida**: Los elementos aparecen conforme se cargan
- **Gestión de memoria**: Remoción automática de marcadores antiguos
- **Cache de datos**: Mejora el rendimiento en uso repetido
- **Comunicación eficiente**: WebView-React Native optimizada

### Estilos de Mapa:
- **Modo claro**: OpenStreetMap estándar
- **Modo oscuro**: Tema oscuro de CartoDB
- **Cambio automático**: Según configuración del sistema

## 🐛 Debugging y Logs

La aplicación incluye logs detallados para facilitar el debugging:

- **Console logs**: Información sobre cuántos elementos se cargan
- **Error handling**: Manejo de paradas/buses sin coordenadas
- **Estado del mapa**: Confirmación de inicialización exitosa
- **Interacciones**: Logs de selección de elementos

Para ver los logs en desarrollo:
- **iOS**: Usar Safari Web Inspector
- **Android**: Usar Chrome DevTools
- **Expo**: Logs aparecen en Metro bundler

Ejemplo de logs que verás:
```
Mapa inicializado correctamente
Agregando 45 paradas
Agregando 12 rutas
Agregando 8 buses
Parada seleccionada: {nombre: "Terminal Terrestre", codigo: "TT001"}
```

## 🔄 Compatibilidad

- **Todas las plataformas**: OpenStreetMap funciona en iOS, Android y Web
- **Sin conexión**: Datos cacheados cuando sea posible
- **Dispositivos antiguos**: Optimizaciones de rendimiento
- **Permisos de ubicación**: Funciona sin GPS con selección manual
- **Carga progresiva**: Los elementos aparecen conforme se cargan los datos

## ⚡ Rendimiento

### Optimizaciones Implementadas:
- **Marcadores eficientes**: Uso de CircleMarkers en lugar de marcadores complejos
- **Popups bajo demanda**: Se crean solo al hacer clic
- **Limpieza automática**: Remoción de elementos anteriores antes de agregar nuevos
- **Inicialización diferida**: Carga progresiva de elementos del mapa

### Métricas Esperadas:
- **Tiempo de carga inicial**: < 3 segundos
- **Actualización de datos**: < 1 segundo
- **Respuesta a interacciones**: Instantánea
- **Uso de memoria**: Optimizado para dispositivos móviles

## 🎨 Personalización

### Colores y Estilos:
```javascript
// Paradas
normal: '#F59E0B' (amarillo)
conexion: '#10B981' (verde)
inactiva: '#EF4444' (rojo)

// Buses
en_ruta: '#10B981' (verde)
en_parada: '#F59E0B' (amarillo)
offline: '#EF4444' (rojo)

// Usuario
ubicacion: '#3B82F6' (azul)
precision: 'rgba(59, 130, 246, 0.2)' (azul transparente)
```

Esta implementación garantiza que **toda la información relevante del sistema de transporte sea visible en el mapa**, incluyendo paradas, rutas, buses y la ubicación del usuario, usando únicamente tecnologías gratuitas y de código abierto.