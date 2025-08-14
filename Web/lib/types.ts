export interface User {
  id: string
  email: string
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

export interface Stop {
  id: string
  name: string
  lat: number
  lng: number
  lines: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Route {
  id: string
  name: string
  shortName: string
  description: string
  color: string
  textColor: string
  operatingStartTime: string // HH:MM
  operatingEndTime: string // HH:MM
  stopIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Calendar {
  id: string
  name: string
  routeId?: string // Nueva propiedad para asociar calendario con ruta específica
  operatingStartTime: string // HH:MM - hora de inicio específica para esta ruta
  operatingEndTime: string // HH:MM - hora de fin específica para esta ruta
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
  startDate: Date
  endDate: Date
  holidays: string[] // Array of holiday dates in YYYY-MM-DD format
}

export interface Bus {
  id: string
  plateNumber: string
  model: string
  year: number
  capacity: number
  status: "active" | "maintenance" | "retired"
  routeId?: string
  features: {
    airConditioning: boolean
    wheelchair: boolean
    wifi: boolean
    gps: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface Trip {
  id: string
  routeId: string
  busId: string
  calendarId: string
  headsign: string
  direction: 0 | 1 // 0 = outbound, 1 = inbound
  startTime: string // HH:MM:SS
  endTime: string // HH:MM:SS
  frequency?: number // minutes between trips
  createdAt: Date
  updatedAt: Date
}

export interface StopTime {
  id: string
  tripId: string
  stopId: string
  arrivalTime: string // HH:MM:SS
  departureTime: string // HH:MM:SS
  stopSequence: number
}

export interface LiveBus {
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
  delay: number // minutes (positive = late, negative = early)
}

export interface Alert {
  id: string
  title: string
  description: string
  type: "info" | "warning" | "error" | "success"
  affectedRoutes: string[]
  affectedStops: string[]
  alternativeRoute?: string // Route ID for alternative
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
}

export interface UserInteraction {
  id: string
  userId: string
  action: "plan_trip" | "view_route" | "favorite_stop" | "favorite_route"
  metadata: Record<string, any>
  timestamp: Date
}
