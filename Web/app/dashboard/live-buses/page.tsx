"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { LiveBus, Route, Bus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InteractiveMap } from "@/components/map/interactive-map"
import { Radio, Play, Pause, RotateCcw, MapPin, Clock, Gauge, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Simulación de buses en vivo
const SIMULATION_INTERVAL = 3000 // 3 segundos para mejor visualización
const NORMAL_SPEED = 30 // km/h
const RUSH_HOUR_SPEED = 15 // km/h durante horas pico
const STOP_DURATION = 10000 // 10 segundos en cada parada (reducido para demo)

// Horas pico en Loja (formato 24h)
const RUSH_HOURS = [
  { start: 7, end: 9 }, // Mañana
  { start: 12, end: 14 }, // Almuerzo
  { start: 17, end: 19 }, // Tarde
]

interface SimulatedBus extends LiveBus {
  routeStops: string[]
  currentStopIndex: number
  isAtStop: boolean
  stopArrivalTime?: Date
  direction: 0 | 1 // 0 = ida, 1 = vuelta
}

export default function LiveBusesPage() {
  const [liveBuses, setLiveBuses] = useState<SimulatedBus[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [stops, setStops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [selectedBus, setSelectedBus] = useState<string | null>(null)
  const [selectedRouteForSim, setSelectedRouteForSim] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (simulationRunning) {
      interval = setInterval(updateBusPositions, SIMULATION_INTERVAL)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [simulationRunning, liveBuses])

  const fetchData = async () => {
    try {
      const [routesSnapshot, busesSnapshot, stopsSnapshot, liveBusesSnapshot] = await Promise.all([
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "buses")),
        getDocs(collection(db, "stops")),
        getDocs(collection(db, "liveBuses")),
      ])

      // Fetch routes
      const routesData: Route[] = []
      routesSnapshot.forEach((doc) => {
        const data = doc.data()
        routesData.push({
          id: doc.id,
          name: data.name,
          shortName: data.shortName,
          description: data.description,
          color: data.color,
          textColor: data.textColor,
          operatingStartTime: data.operatingStartTime,
          operatingEndTime: data.operatingEndTime,
          stopIds: data.stopIds || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

      // Fetch buses
      const busesData: Bus[] = []
      busesSnapshot.forEach((doc) => {
        const data = doc.data()
        busesData.push({
          id: doc.id,
          plateNumber: data.plateNumber,
          model: data.model,
          year: data.year,
          capacity: data.capacity,
          status: data.status,
          routeId: data.routeId,
          features: data.features,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

      // Fetch stops
      const stopsData: any[] = []
      stopsSnapshot.forEach((doc) => {
        const data = doc.data()
        stopsData.push({
          id: doc.id,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          lines: data.lines || [],
        })
      })

      // Fetch existing live buses
      const liveBusesData: SimulatedBus[] = []
      liveBusesSnapshot.forEach((doc) => {
        const data = doc.data()
        const route = routesData.find((r) => r.id === data.routeId)
        liveBusesData.push({
          id: doc.id,
          busId: data.busId,
          routeId: data.routeId,
          tripId: data.tripId || "",
          lat: data.lat,
          lng: data.lng,
          bearing: data.bearing || 0,
          speed: data.speed || 0,
          timestamp: data.timestamp?.toDate() || new Date(),
          status: data.status,
          nextStopId: data.nextStopId,
          delay: data.delay || 0,
          routeStops: route?.stopIds || [],
          currentStopIndex: data.currentStopIndex || 0,
          isAtStop: data.isAtStop || false,
          stopArrivalTime: data.stopArrivalTime?.toDate(),
          direction: data.direction || 0,
        })
      })

      setRoutes(routesData)
      setBuses(busesData)
      setStops(stopsData)
      setLiveBuses(liveBusesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createBusForRoute = async (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    if (!route || route.stopIds.length === 0) {
      toast({
        title: "Error",
        description: "La ruta seleccionada no tiene paradas configuradas",
        variant: "destructive",
      })
      return
    }

    // Buscar un bus disponible para esta ruta
    const availableBus = buses.find((b) => b.status === "active" && (!b.routeId || b.routeId === routeId))
    if (!availableBus) {
      toast({
        title: "Error",
        description: "No hay buses disponibles para esta ruta",
        variant: "destructive",
      })
      return
    }

    const firstStop = stops.find((s) => s.id === route.stopIds[0])
    if (!firstStop) {
      toast({
        title: "Error",
        description: "No se encontró la primera parada de la ruta",
        variant: "destructive",
      })
      return
    }

    const newBus: Omit<SimulatedBus, "id"> = {
      busId: availableBus.id,
      routeId: route.id,
      tripId: `trip_${Date.now()}`,
      lat: firstStop.lat,
      lng: firstStop.lng,
      bearing: 0,
      speed: 0,
      timestamp: new Date(),
      status: "stopped",
      nextStopId: route.stopIds[1] || route.stopIds[0],
      delay: 0,
      routeStops: route.stopIds,
      currentStopIndex: 0,
      isAtStop: true,
      stopArrivalTime: new Date(),
      direction: 0,
    }

    try {
      const docRef = await addDoc(collection(db, "liveBuses"), newBus)
      setLiveBuses((prev) => [...prev, { ...newBus, id: docRef.id }])
      toast({
        title: "Bus agregado",
        description: `Bus ${availableBus.plateNumber} agregado a la ruta ${route.shortName}`,
      })
    } catch (error) {
      console.error("Error creating bus:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el bus simulado",
        variant: "destructive",
      })
    }
  }

  const isRushHour = () => {
    const now = new Date()
    const hour = now.getHours()
    return RUSH_HOURS.some((rush) => hour >= rush.start && hour < rush.end)
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c * 1000 // Retorna en metros
  }

  const updateBusPositions = async () => {
    const updatedBuses = [...liveBuses]
    const now = new Date()
    const currentSpeed = isRushHour() ? RUSH_HOUR_SPEED : NORMAL_SPEED
    const speedMps = (currentSpeed * 1000) / 3600 // Convertir km/h a m/s

    for (let i = 0; i < updatedBuses.length; i++) {
      const bus = updatedBuses[i]
      const route = routes.find((r) => r.id === bus.routeId)
      if (!route || bus.routeStops.length === 0) continue

      // Si está en una parada, verificar si debe salir
      if (bus.isAtStop && bus.stopArrivalTime) {
        const timeAtStop = now.getTime() - bus.stopArrivalTime.getTime()
        if (timeAtStop >= STOP_DURATION) {
          // Salir de la parada
          bus.isAtStop = false
          bus.stopArrivalTime = undefined
          bus.status = "in_transit"

          // Avanzar al siguiente índice de parada
          if (bus.direction === 0) {
            // Ida
            if (bus.currentStopIndex < bus.routeStops.length - 1) {
              bus.currentStopIndex++
            } else {
              // Cambiar dirección
              bus.direction = 1
              bus.currentStopIndex = bus.routeStops.length - 2
            }
          } else {
            // Vuelta
            if (bus.currentStopIndex > 0) {
              bus.currentStopIndex--
            } else {
              // Cambiar dirección
              bus.direction = 0
              bus.currentStopIndex = 1
            }
          }

          bus.nextStopId = bus.routeStops[bus.currentStopIndex]
        }
        continue
      }

      // Mover hacia la siguiente parada
      const nextStop = stops.find((s) => s.id === bus.nextStopId)
      if (!nextStop) continue

      const distance = calculateDistance(bus.lat, bus.lng, nextStop.lat, nextStop.lng)
      const distanceToMove = speedMps * (SIMULATION_INTERVAL / 1000) // Distancia en metros

      if (distance <= 50) {
        // Llegó a la parada
        bus.lat = nextStop.lat
        bus.lng = nextStop.lng
        bus.isAtStop = true
        bus.stopArrivalTime = now
        bus.status = "stopped"
        bus.speed = 0
      } else {
        // Mover hacia la parada
        const ratio = Math.min(distanceToMove / distance, 1)
        const newLat = bus.lat + (nextStop.lat - bus.lat) * ratio
        const newLng = bus.lng + (nextStop.lng - bus.lng) * ratio

        bus.lat = newLat
        bus.lng = newLng
        bus.speed = currentSpeed
        bus.bearing = Math.atan2(nextStop.lng - bus.lng, nextStop.lat - bus.lat) * (180 / Math.PI)
      }

      bus.timestamp = now

      // Actualizar en Firebase
      try {
        await updateDoc(doc(db, "liveBuses", bus.id), {
          lat: bus.lat,
          lng: bus.lng,
          bearing: bus.bearing,
          speed: bus.speed,
          timestamp: bus.timestamp,
          status: bus.status,
          nextStopId: bus.nextStopId,
          currentStopIndex: bus.currentStopIndex,
          isAtStop: bus.isAtStop,
          stopArrivalTime: bus.stopArrivalTime,
          direction: bus.direction,
        })
      } catch (error) {
        console.error("Error updating bus position:", error)
      }
    }

    setLiveBuses(updatedBuses)
  }

  const toggleSimulation = () => {
    setSimulationRunning(!simulationRunning)
    toast({
      title: simulationRunning ? "Simulación pausada" : "Simulación iniciada",
      description: simulationRunning ? "Los buses se han detenido" : "Los buses comenzaron a moverse",
    })
  }

  const resetSimulation = async () => {
    try {
      // Eliminar todos los buses en vivo
      const promises = liveBuses.map((bus) => deleteDoc(doc(db, "liveBuses", bus.id)))
      await Promise.all(promises)

      setLiveBuses([])
      setSimulationRunning(false)

      toast({
        title: "Simulación reiniciada",
        description: "Todos los buses han sido eliminados",
      })
    } catch (error) {
      console.error("Error resetting simulation:", error)
      toast({
        title: "Error",
        description: "No se pudo reiniciar la simulación",
        variant: "destructive",
      })
    }
  }

  const getBusInfo = (busId: string) => {
    const bus = buses.find((b) => b.id === busId)
    return bus ? `${bus.plateNumber} (${bus.model})` : "Bus desconocido"
  }

  const getRouteInfo = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    return route ? route.shortName : "Ruta desconocida"
  }

  const getStatusBadge = (status: string, isAtStop: boolean) => {
    if (isAtStop) {
      return <Badge className="bg-yellow-100 text-yellow-800">En Parada</Badge>
    }

    switch (status) {
      case "in_transit":
        return <Badge className="bg-green-100 text-green-800">En Tránsito</Badge>
      case "stopped":
        return <Badge className="bg-red-100 text-red-800">Detenido</Badge>
      case "maintenance":
        return <Badge className="bg-gray-100 text-gray-800">Mantenimiento</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Preparar datos para el mapa - mostrar buses como puntos especiales
  const busesForMap = liveBuses.map((bus) => ({
    id: bus.id,
    name: `🚌 ${getBusInfo(bus.busId)} - ${getRouteInfo(bus.routeId)}`,
    lat: bus.lat,
    lng: bus.lng,
    lines: [getRouteInfo(bus.routeId)],
    isBus: true,
    status: bus.status,
    isAtStop: bus.isAtStop,
    speed: bus.speed,
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded" />
        <div className="h-64 bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buses en Vivo</h1>
          <p className="text-gray-600">Simulación visual de buses recorriendo rutas</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={toggleSimulation}
            variant={simulationRunning ? "destructive" : "default"}
            className="bg-sky-500 hover:bg-sky-600"
          >
            {simulationRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {simulationRunning ? "Pausar" : "Iniciar"} Simulación
          </Button>
          <Button onClick={resetSimulation} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar
          </Button>
        </div>
      </div>

      {/* Add Bus Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Bus a Ruta
          </CardTitle>
          <CardDescription>Selecciona una ruta para simular un bus recorriéndola</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Seleccionar Ruta</label>
              <Select value={selectedRouteForSim} onValueChange={setSelectedRouteForSim}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige una ruta para simular" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: route.color }} />
                        {route.shortName} - {route.name} ({route.stopIds.length} paradas)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => selectedRouteForSim && createBusForRoute(selectedRouteForSim)}
              disabled={!selectedRouteForSim}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Bus
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Radio className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Buses Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {liveBuses.filter((b) => b.status === "in_transit").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Paradas</p>
                <p className="text-2xl font-bold text-gray-900">{liveBuses.filter((b) => b.isAtStop).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Gauge className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Velocidad Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {liveBuses.length > 0
                    ? Math.round(liveBuses.reduce((sum, bus) => sum + bus.speed, 0) / liveBuses.length)
                    : 0}{" "}
                  km/h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hora Pico</p>
                <p className="text-2xl font-bold text-gray-900">{isRushHour() ? "SÍ" : "NO"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Mapa en Tiempo Real
            <Badge variant={simulationRunning ? "default" : "secondary"} className="ml-2">
              {simulationRunning ? "Activo" : "Pausado"}
            </Badge>
            {liveBuses.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {liveBuses.length} buses simulados
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Visualización en tiempo real de buses recorriendo sus rutas. Los buses aparecen como 🚌 en el mapa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InteractiveMap
            mode={{ type: "view-only" }}
            stops={[...stops, ...busesForMap]}
            routes={routes}
            className="h-96"
          />
        </CardContent>
      </Card>

      {/* Buses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Estado de Buses ({liveBuses.length})
          </CardTitle>
          <CardDescription>Información detallada de cada bus en tiempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Velocidad</TableHead>
                  <TableHead>Próxima Parada</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Última Actualización</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveBuses.map((bus) => {
                  const nextStop = stops.find((s) => s.id === bus.nextStopId)
                  return (
                    <TableRow
                      key={bus.id}
                      className={selectedBus === bus.id ? "bg-sky-50" : ""}
                      onClick={() => setSelectedBus(selectedBus === bus.id ? null : bus.id)}
                    >
                      <TableCell className="font-medium">{getBusInfo(bus.busId)}</TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: routes.find((r) => r.id === bus.routeId)?.color || "#3B82F6",
                            color: routes.find((r) => r.id === bus.routeId)?.textColor || "#FFFFFF",
                          }}
                        >
                          {getRouteInfo(bus.routeId)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(bus.status, bus.isAtStop)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          {bus.speed} km/h
                        </div>
                      </TableCell>
                      <TableCell>{nextStop?.name || "Desconocida"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{bus.direction === 0 ? "Ida" : "Vuelta"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {bus.timestamp.toLocaleTimeString("es-ES")}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {liveBuses.length === 0 && (
            <div className="text-center py-8">
              <Radio className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay buses en simulación</h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona una ruta arriba y haz clic en "Agregar Bus" para comenzar la simulación
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
