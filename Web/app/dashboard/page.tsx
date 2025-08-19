"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InteractiveMap } from "@/components/map/interactive-map"
import { MapPin, Route, Users, AlertTriangle, TrendingUp, Clock, Radio, Bus, Calendar, Navigation, Globe } from "lucide-react"

interface DashboardStats {
  totalStops: number
  totalRoutes: number
  totalUsers: number
  totalBuses: number
  activeAlerts: number
  liveBuses: number
  totalTrips: number
  totalCalendars: number
}

interface RecentAlert {
  id: string
  title: string
  type: "info" | "warning" | "error" | "success"
  createdAt: Date
}

interface RecentTrip {
  id: string
  routeName: string
  busPlate: string
  startTime: string
  createdAt: Date
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStops: 0,
    totalRoutes: 0,
    totalUsers: 0,
    totalBuses: 0,
    activeAlerts: 0,
    liveBuses: 0,
    totalTrips: 0,
    totalCalendars: 0,
  })
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([])
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([])
  const [stops, setStops] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [stopsSnap, routesSnap, usersSnap, busesSnap, alertsSnap, liveBusesSnap, tripsSnap, calendarsSnap] =
        await Promise.all([
          getDocs(collection(db, "stops")),
          getDocs(collection(db, "routes")),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "buses")),
          getDocs(query(collection(db, "alerts"), where("isActive", "==", true))),
          getDocs(collection(db, "liveBuses")),
          getDocs(collection(db, "trips")),
          getDocs(collection(db, "calendars")),
        ])

      setStats({
        totalStops: stopsSnap.size,
        totalRoutes: routesSnap.size,
        totalUsers: usersSnap.size,
        totalBuses: busesSnap.size,
        activeAlerts: alertsSnap.size,
        liveBuses: liveBusesSnap.size,
        totalTrips: tripsSnap.size,
        totalCalendars: calendarsSnap.size,
      })

      // Fetch stops and routes for map
      const stopsData: any[] = []
      stopsSnap.forEach((doc) => {
        const data = doc.data()
        stopsData.push({
          id: doc.id,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          lines: data.lines || [],
        })
      })

      const routesData: any[] = []
      routesSnap.forEach((doc) => {
        const data = doc.data()
        routesData.push({
          id: doc.id,
          name: data.name,
          shortName: data.shortName,
          color: data.color,
          textColor: data.textColor,
          stopIds: data.stopIds || [],
        })
      })

      setStops(stopsData)
      setRoutes(routesData)

      // Fetch recent alerts
      const recentAlertsSnap = await getDocs(query(collection(db, "alerts"), orderBy("createdAt", "desc"), limit(5)))

      const alerts: RecentAlert[] = []
      recentAlertsSnap.forEach((doc) => {
        const data = doc.data()
        alerts.push({
          id: doc.id,
          title: data.title,
          type: data.type,
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      })
      setRecentAlerts(alerts)

      // Fetch recent trips
      const recentTripsSnap = await getDocs(query(collection(db, "trips"), orderBy("createdAt", "desc"), limit(5)))

      const trips: RecentTrip[] = []
      for (const tripDoc of recentTripsSnap.docs) {
        const tripData = tripDoc.data()

        // Get route info
        const routeDoc = await getDocs(query(collection(db, "routes"), where("__name__", "==", tripData.routeId)))
        const routeName = routeDoc.docs[0]?.data()?.shortName || "Ruta desconocida"

        // Get bus info
        const busDoc = await getDocs(query(collection(db, "buses"), where("__name__", "==", tripData.busId)))
        const busPlate = busDoc.docs[0]?.data()?.plateNumber || "Bus desconocido"

        trips.push({
          id: tripDoc.id,
          routeName,
          busPlate,
          startTime: tripData.startTime,
          createdAt: tripData.createdAt?.toDate() || new Date(),
        })
      }
      setRecentTrips(trips)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive"
      case "warning":
        return "secondary"
      case "success":
        return "default"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen del sistema de transporte TransiLoja</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatsCard
          title="Paradas"
          value={stats.totalStops}
          description="Total de paradas registradas"
          icon={MapPin}
          trend={{ value: 5.2, isPositive: true }}
        />

        <StatsCard
          title="Rutas"
          value={stats.totalRoutes}
          description="Líneas de transporte activas"
          icon={Route}
          trend={{ value: 2.1, isPositive: true }}
        />

        <StatsCard
          title="Buses"
          value={stats.totalBuses}
          description="Vehículos en la flota"
          icon={Bus}
          trend={{ value: 1.5, isPositive: true }}
        />

        <StatsCard
          title="Viajes"
          value={stats.totalTrips}
          description="Viajes programados"
          icon={Clock}
          trend={{ value: 8.3, isPositive: true }}
        />

        <StatsCard
          title="Buses en Vivo"
          value={stats.liveBuses}
          description="Buses transmitiendo ubicación"
          icon={Radio}
          trend={{ value: -2.4, isPositive: false }}
        />

        <StatsCard
          title="Calendarios"
          value={stats.totalCalendars}
          description="Horarios de servicio"
          icon={Calendar}
          trend={{ value: 0, isPositive: true }}
        />

        <StatsCard
          title="Usuarios"
          value={stats.totalUsers}
          description="Usuarios registrados"
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
        />

        <StatsCard
          title="Alertas Activas"
          value={stats.activeAlerts}
          description="Alertas del sistema"
          icon={AlertTriangle}
          trend={{ value: -15.2, isPositive: true }}
        />
      </div>

      {/* Map Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Vista General del Sistema
          </CardTitle>
          <CardDescription>Mapa interactivo con todas las paradas y rutas</CardDescription>
        </CardHeader>
        <CardContent>
          <InteractiveMap mode={{ type: "view-only" }} stops={stops} routes={routes} className="h-96" />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>Herramientas principales del sistema TransiLoja</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a 
              href="/dashboard/drivers"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Gestión de Conductores</h3>
                <p className="text-sm text-gray-500">Administrar conductores</p>
              </div>
            </a>
            
            <a 
              href="/dashboard/municipalities"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Configurar Municipios</h3>
                <p className="text-sm text-gray-500">Logos, colores, ubicación</p>
              </div>
            </a>
            
            <a 
              href="/dashboard/live-buses"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-amber-100 rounded-lg">
                <Radio className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium">Monitoreo en Vivo</h3>
                <p className="text-sm text-gray-500">Ubicación de buses</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Recientes
            </CardTitle>
            <CardDescription>Últimas alertas del sistema de transporte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-xs text-gray-500">
                        {alert.createdAt.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge variant={getAlertBadgeVariant(alert.type)}>{alert.type}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No hay alertas recientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Viajes Recientes
            </CardTitle>
            <CardDescription>Últimos viajes programados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTrips.length > 0 ? (
                recentTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {trip.routeName} - {trip.busPlate}
                      </p>
                      <p className="text-xs text-gray-500">
                        Inicio: {trip.startTime} | {trip.createdAt.toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <Badge variant="outline">Programado</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No hay viajes recientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>Indicadores clave de rendimiento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cobertura de Paradas</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                  <span className="text-sm text-gray-600">85%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Buses Activos</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "72%" }}></div>
                  </div>
                  <span className="text-sm text-gray-600">72%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Precisión de Horarios</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: "68%" }}></div>
                  </div>
                  <span className="text-sm text-gray-600">68%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Satisfacción de Usuarios</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: "91%" }}></div>
                  </div>
                  <span className="text-sm text-gray-600">91%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
