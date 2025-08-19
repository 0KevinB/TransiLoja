// ==================== TIPOS PARA ESQUEMA RAPTOR ====================

export interface Coordenadas {
  lat: number
  lng: number
}

// Esquema RAPTOR - Rutas
export interface Ruta {
  id_ruta: string
  nombre_largo: string
  nombre_corto: string
  color?: string
  textColor?: string
  descripcion?: string
  createdAt?: Date
  updatedAt?: Date
}

// Esquema RAPTOR - Paradas
export interface Parada {
  id_parada: string
  nombre: string
  es_punto_conexion: boolean
  coordenadas: Coordenadas
  createdAt?: Date
  updatedAt?: Date
}

// Esquema RAPTOR - Calendario
export interface Calendario {
  id_calendario: string
  tipo_dia: string // "Lunes a Viernes", "Sábados", "Domingos y Feriados"
  fecha_inicio?: Date
  fecha_fin?: Date
  dias_activos?: {
    lunes: boolean
    martes: boolean
    miercoles: boolean
    jueves: boolean
    viernes: boolean
    sabado: boolean
    domingo: boolean
  }
  feriados?: string[] // Array de fechas en formato YYYY-MM-DD
}

// Esquema RAPTOR - Viajes
export interface Viaje {
  id_viaje: string
  id_ruta: string
  id_calendario: string
  trazado_geografico?: string // encoded polyline
  direccion?: 0 | 1 // 0 = ida, 1 = vuelta
  createdAt?: Date
  updatedAt?: Date
}

// Esquema RAPTOR - Tiempos de Parada
export interface TiempoParada {
  id_viaje: string
  id_parada: string
  tiempo_llegada: string // HH:MM:SS
  tiempo_salida?: string // HH:MM:SS (opcional si es igual a llegada)
  secuencia: number
}

// Esquema RAPTOR - Transbordos
export interface Transbordo {
  id_parada_origen: string
  id_parada_destino: string
  tiempo_caminata_seg: number
  distancia_metros?: number
  accesible?: boolean
}

// Esquema RAPTOR - Buses en Vivo
export interface BusEnVivo {
  id_bus: string
  id_viaje_actual: string
  ultima_actualizacion: number // timestamp
  coordenadas_actuales: Coordenadas
  velocidad?: number
  direccion?: number // bearing en grados
  estado: "en_transito" | "en_parada" | "fuera_servicio"
  retraso_seg?: number // segundos de retraso (+ = tarde, - = temprano)
  siguiente_parada?: string
}

// Esquema RAPTOR - Alertas
export interface Alerta {
  id_alerta: string
  titulo: string
  descripcion: string
  tipo: "info" | "warning" | "error" | "success"
  rutas_afectadas: string[]
  paradas_afectadas?: string[]
  fecha_inicio: number // timestamp
  fecha_fin: number // timestamp
  activa: boolean
  ruta_alternativa?: string
  createdAt?: Date
}

// Esquema RAPTOR - Usuarios
export interface Usuario {
  id_usuario: string // uid de Firebase
  email: string
  nombre?: string
  rol: "admin" | "usuario"
  favoritos: {
    paradas: string[]
    rutas: string[]
  }
  preferencias: {
    idioma: "es" | "en"
    notificaciones: boolean
    tema: "light" | "dark" | "system"
    ubicacion_defecto?: {
      lat: number
      lng: number
      nombre: string
    }
  }
  fecha_registro: number // timestamp
  ultima_actividad?: number // timestamp
}

// Esquema RAPTOR - Interacciones de Usuario
export interface InteraccionUsuario {
  id_interaccion: string
  id_usuario: string
  tipo_evento: "planificar_viaje" | "ver_ruta" | "favorito_parada" | "favorito_ruta" | "buscar_parada"
  fecha: number // timestamp
  metadatos?: Record<string, any>
  origen?: string // id_parada
  destino?: string // id_parada
  ruta_seleccionada?: string // id_ruta
}

// ==================== TIPOS ADICIONALES PARA RAPTOR ====================

// Para el algoritmo RAPTOR
export interface EstadoRAPTOR {
  ronda: number
  parada: string
  tiempo_llegada: number
  viaje_utilizado?: string
  parada_anterior?: string
  ruta_utilizada?: string
}

export interface RutaOptima {
  origen: string
  destino: string
  tiempo_total_seg: number
  numero_transbordos: number
  segmentos: SegmentoViaje[]
  costo_estimado?: number
}

export interface SegmentoViaje {
  tipo: "caminar" | "autobus" | "esperar"
  desde: string // id_parada
  hasta: string // id_parada
  id_viaje?: string
  id_ruta?: string
  tiempo_inicio: string // HH:MM:SS
  tiempo_fin: string // HH:MM:SS
  duracion_seg: number
  distancia_metros?: number
  instrucciones?: string
}

// Conductores
export interface Conductor {
  id_conductor: string
  cedula: string
  nombre: string
  apellidos: string
  fecha_nacimiento: Date
  telefono: string
  email?: string
  direccion?: string
  fecha_licencia: Date
  fecha_vencimiento_licencia: Date
  tipo_licencia: "A" | "B" | "C" | "D" | "E"
  estado: "activo" | "inactivo" | "suspendido" | "vacaciones"
  foto_url?: string
  experiencia_anos: number
  calificacion?: number // 1-5 estrellas
  observaciones?: string
  createdAt: Date
  updatedAt: Date
}

// Tarifas
export interface Tarifa {
  id_tarifa: string
  nombre: string
  descripcion?: string
  tipo: "regular" | "estudiante" | "tercera_edad" | "discapacidad" | "especial"
  precio: number
  moneda: string
  descuento_porcentaje?: number
  requiere_validacion: boolean
  activa: boolean
  fecha_inicio: Date
  fecha_fin?: Date
  rutas_aplicables: string[] // IDs de rutas donde aplica
  horarios_aplicables?: {
    hora_inicio: string
    hora_fin: string
    dias_semana: number[] // 0=domingo, 1=lunes, etc.
  }[]
  createdAt: Date
  updatedAt: Date
}

// Configuración de Municipio (refactorizada)
export interface Municipio {
  id_municipio: string
  nombre: string
  codigo_postal?: string
  provincia: string
  pais: string
  coordenadas_centro: Coordenadas
  zoom_defecto: number
  
  // Configuración visual
  configuracion_visual: {
    logo_url?: string
    favicon_url?: string
    color_primario: string
    color_secundario: string
    color_acento: string
    fuente_principal?: string
    tema_oscuro_disponible: boolean
  }
  
  // Configuración técnica
  configuracion_tecnica: {
    radio_busqueda_metros: number
    tiempo_maximo_caminata_seg: number
    tiempo_maximo_espera_seg: number
    precision_gps_metros: number
    intervalo_actualizacion_seg: number
  }
  
  // Configuración del mapa
  configuracion_mapa: {
    estilo_mapa: string
    mostrar_trafico: boolean
    mostrar_satelite: boolean
    capas_adicionales: string[]
  }
  
  // Información de contacto
  informacion_contacto: {
    telefono?: string
    email?: string
    sitio_web?: string
    direccion?: string
    horario_atencion?: string
    redes_sociales?: {
      facebook?: string
      twitter?: string
      instagram?: string
    }
  }
  
  // Configuración de la aplicación
  configuracion_app: {
    nombre_app: string
    descripcion_app?: string
    version_minima_android?: string
    version_minima_ios?: string
    url_play_store?: string
    url_app_store?: string
  }
  
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

// Para importación de datos
export interface ImportacionDatos {
  id_importacion: string
  tipo_datos: "paradas" | "rutas" | "viajes" | "conductores" | "buses" | "tarifas"
  archivo_nombre: string
  archivo_tipo: "csv" | "txt" | "json"
  estado: "pendiente" | "procesando" | "completado" | "error"
  registros_totales: number
  registros_procesados: number
  registros_exitosos: number
  registros_error: number
  errores: {
    linea: number
    campo?: string
    mensaje: string
  }[]
  fecha_inicio: Date
  fecha_fin?: Date
  usuario_id: string
  configuracion_importacion?: Record<string, any>
}

// ==================== TIPOS LEGACY (PARA COMPATIBILIDAD) ====================

// Mantenemos los tipos anteriores para compatibilidad gradual
export interface User extends Usuario {
  id: string
  name: string
  role: "admin" | "user"
  favoriteStops: string[]
  favoriteRoutes: string[]
  preferences: {
    language: "es" | "en"
    notifications: boolean
    theme: "light" | "dark" | "system"
    defaultLocation?: {
      lat: number
      lng: number
      name: string
    }
  }
  createdAt: Date
  updatedAt: Date
}

export interface Stop extends Parada {
  id: string
  name: string
  lat: number
  lng: number
  lines: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Route extends Ruta {
  id: string
  name: string
  shortName: string
  description: string
  color: string
  textColor: string
  operatingStartTime: string
  operatingEndTime: string
  stopIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Calendar extends Calendario {
  id: string
  name: string
  routeId?: string
  operatingStartTime: string
  operatingEndTime: string
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
  startDate: Date
  endDate: Date
  holidays: string[]
}

export interface Bus {
  id: string
  plateNumber: string
  model: string
  year: number
  capacity: number
  status: "active" | "maintenance" | "retired"
  routeId?: string
  conductorId?: string
  features: {
    airConditioning: boolean
    wheelchair: boolean
    wifi: boolean
    gps: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface Trip extends Viaje {
  id: string
  routeId: string
  busId: string
  calendarId: string
  headsign: string
  direction: 0 | 1
  startTime: string
  endTime: string
  frequency?: number
  createdAt: Date
  updatedAt: Date
}

export interface StopTime extends TiempoParada {
  id: string
  tripId: string
  stopId: string
  arrivalTime: string
  departureTime: string
  stopSequence: number
}

export interface LiveBus extends BusEnVivo {
  id: string
  busId: string
  routeId: string
  tripId: string
  lat: number
  lng: number
  bearing: number
  speed: number
  timestamp: Date
  status: "in_transit" | "stopped" | "maintenance"
  nextStopId?: string
  delay: number
}

export interface Alert extends Alerta {
  id: string
  title: string
  description: string
  type: "info" | "warning" | "error" | "success"
  affectedRoutes: string[]
  affectedStops: string[]
  alternativeRoute?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
}

export interface UserInteraction extends InteraccionUsuario {
  id: string
  userId: string
  action: "plan_trip" | "view_route" | "favorite_stop" | "favorite_route"
  metadata: Record<string, any>
  timestamp: Date
}
