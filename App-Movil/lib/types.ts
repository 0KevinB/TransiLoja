// Tipos para el sistema de transporte público

export interface Parada {
  id: string;
  nombre: string;
  ubicacion: {
    latitud: number;
    longitud: number;
  };
  codigo?: string;
  municipio_id: string;
  activa: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Ruta {
  id: string;
  numero: string;
  nombre: string;
  color: string;
  paradas: string[]; // IDs de paradas
  municipio_id: string;
  activa: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Bus {
  id: string;
  numero_placa: string;
  numero_interno?: string;
  ruta_id: string;
  conductor_id?: string;
  ubicacion_actual?: {
    latitud: number;
    longitud: number;
    timestamp: Date;
  };
  estado: 'activo' | 'inactivo' | 'mantenimiento';
  municipio_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Conductor {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono?: string;
  email?: string;
  licencia_numero: string;
  licencia_vencimiento: Date;
  bus_asignado?: string;
  municipio_id: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Viaje {
  id: string;
  ruta_id: string;
  bus_id: string;
  conductor_id: string;
  hora_inicio: Date;
  hora_fin?: Date;
  estado: 'programado' | 'en_curso' | 'completado' | 'cancelado';
  paradas_visitadas: {
    parada_id: string;
    hora_llegada?: Date;
    hora_salida?: Date;
  }[];
  municipio_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Alerta {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'informacion' | 'advertencia' | 'critica';
  ruta_ids?: string[];
  parada_ids?: string[];
  fecha_inicio: Date;
  fecha_fin?: Date;
  activa: boolean;
  municipio_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Municipio {
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
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

// Tipos para el algoritmo RAPTOR
export interface EstadoRAPTOR {
  parada_id: string;
  tiempo_llegada: number;
  ruta_tomada?: string;
  parada_anterior?: string;
  numero_transferencias: number;
}

export interface SegmentoViaje {
  tipo: 'caminar' | 'bus';
  desde: string;
  hasta: string;
  ruta_id?: string;
  tiempo_inicio: number;
  tiempo_fin: number;
  distancia?: number; // en metros
  instrucciones?: string;
}

export interface RutaOptima {
  segmentos: SegmentoViaje[];
  tiempo_total: number;
  numero_transferencias: number;
  distancia_caminata: number;
  costo?: number;
}

// Tipos para la interfaz de usuario
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
}

export interface AppTheme {
  mode: 'light' | 'dark' | 'high-contrast';
  colors: ThemeColors;
  fontScale: number;
  municipalityColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Tipos para la ubicación del usuario
export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

// Tipos para las notificaciones
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledTime?: Date;
  read: boolean;
  created_at: Date;
}