"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Route, Users, AlertTriangle, TrendingUp, Clock, Radio } from "lucide-react"

interface DashboardStats {
  totalStops: number
  totalRoutes: number
  totalUsers: number
  activeAlerts: number
  liveBuses: number
  totalTrips: number
}

interface RecentAlert {
  id: string
  title: string
  type: "info" | "warning" | "error" | "success"
  createdAt: Date
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStops: 0,
    totalRoutes: 0,
    totalUsers: 0,
    activeAlerts: 0,
    liveBuses: 0,
    totalTrips: 0,
  })
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const [stopsSnap, routesSnap, usersSnap, alertsSnap, busesSnap, tripsSnap] = await Promise.all([
          getDocs(collection(db, "stops")),
          getDocs(collection(db, "routes")),
          getDocs(collection(db, "users")),
          getDocs(query(collection(db, "alerts"), where("isActive", "==", true))),
          getDocs(collection(db, "liveBuses")),
          getDocs(collection(db, "trips")),
        ])

        setStats({
          totalStops: stopsSnap.size,
          totalRoutes: routesSnap.size,
          totalUsers: usersSnap.size,
          activeAlerts: alertsSnap.size,
          liveBuses: busesSnap.size,
          totalTrips: tripsSnap.size,
        })

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
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
          {[...Array(6)].map((_, i) => (
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
