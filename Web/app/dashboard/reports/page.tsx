"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Bus,
  Route,
  DollarSign,
  Calendar,
  Download,
  FileText,
  PieChart,
  Activity
} from "lucide-react"
import { toast } from "sonner"
import type { Bus, Route as RouteType, Trip, Conductor, Tarifa } from "@/lib/types"

interface ReportData {
  buses: Bus[]
  routes: RouteType[]
  trips: Trip[]
  conductores: Conductor[]
  tarifas: Tarifa[]
}

interface FleetStats {
  totalBuses: number
  activeBuses: number
  maintenanceBuses: number
  retiredBuses: number
  totalCapacity: number
  averageAge: number
  busesWithDrivers: number
  busesWithRoutes: number
}

interface RouteStats {
  totalRoutes: number
  routesWithBuses: number
  averageTripsPerRoute: number
  totalTrips: number
  activeFares: number
}

interface OperationalStats {
  totalConductores: number
  activeConductores: number
  averageExperience: number
  totalScheduledTrips: number
  routeCoverage: number
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData>({
    buses: [],
    routes: [],
    trips: [],
    conductores: [],
    tarifas: []
  })
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [reportType, setReportType] = useState("general")
  const [selectedRoute, setSelectedRoute] = useState("all")

  useEffect(() => {
    loadReportData()
  }, [])

  const loadReportData = async () => {
    try {
      setLoading(true)
      
      const [busesSnap, routesSnap, tripsSnap, conductoresSnap, tarifasSnap] = await Promise.all([
        getDocs(collection(db, "buses")),
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "trips")),
        getDocs(collection(db, "conductores")),
        getDocs(collection(db, "tarifas"))
      ])

      const buses: Bus[] = busesSnap.docs.map(doc => ({
        id: doc.id,
        plateNumber: doc.data().plateNumber || "",
        model: doc.data().model || "",
        year: doc.data().year || new Date().getFullYear(),
        capacity: doc.data().capacity || 40,
        status: doc.data().status || "active",
        routeId: doc.data().routeId,
        conductorId: doc.data().conductorId,
        features: doc.data().features || {},
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }))

      const routes: RouteType[] = routesSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || "",
        shortName: doc.data().shortName || "",
        description: doc.data().description || "",
        color: doc.data().color || "#3B82F6",
        textColor: doc.data().textColor || "#FFFFFF",
        operatingStartTime: doc.data().operatingStartTime || "06:00",
        operatingEndTime: doc.data().operatingEndTime || "22:00",
        stopIds: doc.data().stopIds || [],
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }))

      const trips: Trip[] = tripsSnap.docs.map(doc => ({
        id: doc.id,
        routeId: doc.data().routeId || "",
        busId: doc.data().busId || "",
        calendarId: doc.data().calendarId || "",
        headsign: doc.data().headsign || "",
        direction: doc.data().direction || 0,
        startTime: doc.data().startTime || "",
        endTime: doc.data().endTime || "",
        frequency: doc.data().frequency || 15,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }))

      const conductores: Conductor[] = conductoresSnap.docs.map(doc => ({
        id_conductor: doc.id,
        cedula: doc.data().cedula || "",
        nombre: doc.data().nombre || "",
        apellidos: doc.data().apellidos || "",
        fecha_nacimiento: doc.data().fecha_nacimiento?.toDate() || new Date(),
        telefono: doc.data().telefono || "",
        email: doc.data().email,
        direccion: doc.data().direccion,
        fecha_licencia: doc.data().fecha_licencia?.toDate() || new Date(),
        fecha_vencimiento_licencia: doc.data().fecha_vencimiento_licencia?.toDate() || new Date(),
        tipo_licencia: doc.data().tipo_licencia || "B",
        estado: doc.data().estado || "activo",
        foto_url: doc.data().foto_url,
        experiencia_anos: doc.data().experiencia_anos || 0,
        calificacion: doc.data().calificacion,
        observaciones: doc.data().observaciones,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }))

      const tarifas: Tarifa[] = tarifasSnap.docs.map(doc => ({
        id_tarifa: doc.id,
        nombre: doc.data().nombre || "",
        descripcion: doc.data().descripcion,
        tipo: doc.data().tipo || "regular",
        precio: doc.data().precio || 0,
        moneda: doc.data().moneda || "USD",
        descuento_porcentaje: doc.data().descuento_porcentaje,
        requiere_validacion: doc.data().requiere_validacion || false,
        activa: doc.data().activa || true,
        fecha_inicio: doc.data().fecha_inicio?.toDate() || new Date(),
        fecha_fin: doc.data().fecha_fin?.toDate(),
        rutas_aplicables: doc.data().rutas_aplicables || [],
        horarios_aplicables: doc.data().horarios_aplicables || [],
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }))

      setData({ buses, routes, trips, conductores, tarifas })
      
    } catch (error) {
      console.error("Error loading report data:", error)
      toast.error("Error al cargar los datos del reporte")
    } finally {
      setLoading(false)
    }
  }

  const fleetStats = useMemo((): FleetStats => {
    const currentYear = new Date().getFullYear()
    
    return {
      totalBuses: data.buses.length,
      activeBuses: data.buses.filter(b => b.status === "active").length,
      maintenanceBuses: data.buses.filter(b => b.status === "maintenance").length,
      retiredBuses: data.buses.filter(b => b.status === "retired").length,
      totalCapacity: data.buses.reduce((sum, bus) => sum + bus.capacity, 0),
      averageAge: data.buses.length > 0 
        ? Math.round(data.buses.reduce((sum, bus) => sum + (currentYear - bus.year), 0) / data.buses.length)
        : 0,
      busesWithDrivers: data.buses.filter(b => b.conductorId).length,
      busesWithRoutes: data.buses.filter(b => b.routeId).length,
    }
  }, [data.buses])

  const routeStats = useMemo((): RouteStats => {
    const routesWithBuses = new Set(data.buses.filter(b => b.routeId).map(b => b.routeId)).size
    
    return {
      totalRoutes: data.routes.length,
      routesWithBuses,
      averageTripsPerRoute: data.routes.length > 0 
        ? Math.round(data.trips.length / data.routes.length * 100) / 100
        : 0,
      totalTrips: data.trips.length,
      activeFares: data.tarifas.filter(t => t.activa).length,
    }
  }, [data.routes, data.trips, data.buses, data.tarifas])

  const operationalStats = useMemo((): OperationalStats => {
    const activeConductores = data.conductores.filter(c => c.estado === "activo")
    
    return {
      totalConductores: data.conductores.length,
      activeConductores: activeConductores.length,
      averageExperience: activeConductores.length > 0
        ? Math.round(activeConductores.reduce((sum, c) => sum + c.experiencia_anos, 0) / activeConductores.length * 100) / 100
        : 0,
      totalScheduledTrips: data.trips.length,
      routeCoverage: data.routes.length > 0 
        ? Math.round((routeStats.routesWithBuses / data.routes.length) * 100)
        : 0
    }
  }, [data.conductores, data.trips, data.routes, routeStats.routesWithBuses])

  const exportReport = (format: "csv" | "json") => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: { from: dateFrom, to: dateTo },
      fleetStats,
      routeStats,
      operationalStats,
      rawData: reportType === "detailed" ? data : {}
    }

    if (format === "json") {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte-transportes-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } else {
      // CSV export - simplified version
      const csvData = [
        ["Métrica", "Valor"],
        ["Total Buses", fleetStats.totalBuses],
        ["Buses Activos", fleetStats.activeBuses],
        ["Buses en Mantenimiento", fleetStats.maintenanceBuses],
        ["Capacidad Total", fleetStats.totalCapacity],
        ["Edad Promedio", fleetStats.averageAge],
        ["Total Rutas", routeStats.totalRoutes],
        ["Rutas con Buses", routeStats.routesWithBuses],
        ["Total Viajes", routeStats.totalTrips],
        ["Conductores Activos", operationalStats.activeConductores],
        ["Experiencia Promedio", operationalStats.averageExperience],
        ["Cobertura de Rutas (%)", operationalStats.routeCoverage]
      ]
      
      const csvContent = csvData.map(row => row.join(",")).join("\\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte-transportes-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
    
    toast.success(`Reporte exportado en formato ${format.toUpperCase()}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes del Sistema</h1>
          <p className="text-gray-600">
            Análisis y estadísticas del sistema de transporte público
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => exportReport("json")}>
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuración del Reporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="detailed">Detallado</SelectItem>
                  <SelectItem value="operational">Operacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ruta Específica</Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las rutas</SelectItem>
                  {data.routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.shortName} - {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen General</TabsTrigger>
          <TabsTrigger value="fleet">Flota de Vehículos</TabsTrigger>
          <TabsTrigger value="operations">Operaciones</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Bus className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{fleetStats.totalBuses}</p>
                    <p className="text-gray-600">Total Buses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Route className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{routeStats.totalRoutes}</p>
                    <p className="text-gray-600">Total Rutas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{operationalStats.activeConductores}</p>
                    <p className="text-gray-600">Conductores Activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{routeStats.totalTrips}</p>
                    <p className="text-gray-600">Viajes Programados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Estado de la Flota</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Buses Activos</span>
                    <Badge className="bg-green-100 text-green-800">
                      {fleetStats.activeBuses}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>En Mantenimiento</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {fleetStats.maintenanceBuses}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Retirados</span>
                    <Badge className="bg-red-100 text-red-800">
                      {fleetStats.retiredBuses}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Capacidad Total</span>
                    <span className="font-medium">{fleetStats.totalCapacity} pasajeros</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eficiencia Operacional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Cobertura de Rutas</span>
                    <Badge variant="secondary">
                      {operationalStats.routeCoverage}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Buses con Conductor</span>
                    <span className="font-medium">{fleetStats.busesWithDrivers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Experiencia Promedio</span>
                    <span className="font-medium">{operationalStats.averageExperience} años</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Edad Promedio Flota</span>
                    <span className="font-medium">{fleetStats.averageAge} años</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fleet">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análisis Detallado de la Flota</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Año</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ruta Asignada</TableHead>
                      <TableHead>Conductor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.buses.slice(0, 10).map((bus) => (
                      <TableRow key={bus.id}>
                        <TableCell className="font-medium">{bus.plateNumber}</TableCell>
                        <TableCell>{bus.model}</TableCell>
                        <TableCell>{bus.year}</TableCell>
                        <TableCell>{bus.capacity}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              bus.status === "active" ? "bg-green-100 text-green-800" :
                              bus.status === "maintenance" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }
                          >
                            {bus.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {bus.routeId ? 
                            data.routes.find(r => r.id === bus.routeId)?.shortName || "N/A" : 
                            "Sin asignar"
                          }
                        </TableCell>
                        <TableCell>
                          {bus.conductorId ? 
                            (() => {
                              const conductor = data.conductores.find(c => c.id_conductor === bus.conductorId)
                              return conductor ? `${conductor.nombre} ${conductor.apellidos}` : "N/A"
                            })() :
                            "Sin asignar"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Conductores por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['activo', 'inactivo', 'suspendido', 'vacaciones'].map(estado => {
                      const count = data.conductores.filter(c => c.estado === estado).length
                      return (
                        <div key={estado} className="flex justify-between">
                          <span className="capitalize">{estado}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Viajes por Ruta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.routes.slice(0, 5).map(route => {
                      const tripCount = data.trips.filter(t => t.routeId === route.id).length
                      return (
                        <div key={route.id} className="flex justify-between">
                          <span>{route.shortName}</span>
                          <Badge variant="secondary">{tripCount}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Experiencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: "0-2 años", min: 0, max: 2 },
                      { label: "3-5 años", min: 3, max: 5 },
                      { label: "6-10 años", min: 6, max: 10 },
                      { label: "10+ años", min: 11, max: 100 }
                    ].map(range => {
                      const count = data.conductores.filter(c => 
                        c.experiencia_anos >= range.min && c.experiencia_anos <= range.max
                      ).length
                      return (
                        <div key={range.label} className="flex justify-between">
                          <span>{range.label}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tarifas Activas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Descuento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.tarifas.filter(t => t.activa).map((tarifa) => (
                        <TableRow key={tarifa.id_tarifa}>
                          <TableCell>{tarifa.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tarifa.tipo}</Badge>
                          </TableCell>
                          <TableCell>{tarifa.precio.toFixed(2)} {tarifa.moneda}</TableCell>
                          <TableCell>
                            {tarifa.descuento_porcentaje ? 
                              `${tarifa.descuento_porcentaje}%` : 
                              "Sin descuento"
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen Financiero</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Tarifas Activas</span>
                      <Badge>{data.tarifas.filter(t => t.activa).length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio Promedio</span>
                      <span>
                        {data.tarifas.length > 0 ? 
                          (data.tarifas.reduce((sum, t) => sum + t.precio, 0) / data.tarifas.length).toFixed(2) :
                          "0.00"
                        } USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tarifas con Descuento</span>
                      <Badge variant="secondary">
                        {data.tarifas.filter(t => t.descuento_porcentaje && t.descuento_porcentaje > 0).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Rutas Cubiertas</span>
                      <span>
                        {data.routes.length > 0 ? 
                          Math.round((routeStats.routesWithBuses / data.routes.length) * 100) :
                          0
                        }%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}