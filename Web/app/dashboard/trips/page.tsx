"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Trip, Route, Bus, Calendar } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Plus, Edit, Trash2, Search, BusIcon, RouteIcon, CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Datos mock para conductores
const mockDrivers = [
  { id: "driver_1", name: "Carlos Mendoza", license: "EC-001234", experience: 8 },
  { id: "driver_2", name: "María González", license: "EC-005678", experience: 5 },
  { id: "driver_3", name: "Luis Rodríguez", license: "EC-009012", experience: 12 },
  { id: "driver_4", name: "Ana Jiménez", license: "EC-003456", experience: 3 },
  { id: "driver_5", name: "Pedro Vargas", license: "EC-007890", experience: 15 },
  { id: "driver_6", name: "Carmen Silva", license: "EC-001122", experience: 7 },
]

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [formData, setFormData] = useState({
    routeId: "",
    busId: "",
    calendarId: "",
    driverId: "",
    headsign: "",
    direction: 0 as 0 | 1,
    startTime: "06:00:00",
    endTime: "22:00:00",
    frequency: 15, // minutos
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tripsSnapshot, routesSnapshot, busesSnapshot, calendarsSnapshot] = await Promise.all([
        getDocs(collection(db, "trips")),
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "buses")),
        getDocs(collection(db, "calendars")),
      ])

      // Fetch trips
      const tripsData: Trip[] = []
      tripsSnapshot.forEach((doc) => {
        const data = doc.data()
        tripsData.push({
          id: doc.id,
          routeId: data.routeId,
          busId: data.busId,
          calendarId: data.calendarId,
          headsign: data.headsign,
          direction: data.direction,
          startTime: data.startTime,
          endTime: data.endTime,
          frequency: data.frequency,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

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

      // Fetch calendars
      const calendarsData: Calendar[] = []
      calendarsSnapshot.forEach((doc) => {
        const data = doc.data()
        calendarsData.push({
          id: doc.id,
          name: data.name,
          monday: data.monday,
          tuesday: data.tuesday,
          wednesday: data.wednesday,
          thursday: data.thursday,
          friday: data.friday,
          saturday: data.saturday,
          sunday: data.sunday,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          holidays: data.holidays || [],
        })
      })

      setTrips(tripsData.sort((a, b) => a.startTime.localeCompare(b.startTime)))
      setRoutes(routesData)
      setBuses(busesData)
      setCalendars(calendarsData)

      // Crear calendarios por defecto si no existen
      if (calendarsData.length === 0) {
        await createDefaultCalendars()
      }
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

  const createDefaultCalendars = async () => {
    const defaultCalendars = [
      {
        name: "Días Laborables",
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        holidays: ["2024-01-01", "2024-12-25"], // Año Nuevo y Navidad
      },
      {
        name: "Fines de Semana",
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: true,
        sunday: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        holidays: [],
      },
      {
        name: "Todos los Días",
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        holidays: [],
      },
    ]

    try {
      const promises = defaultCalendars.map((calendar) => addDoc(collection(db, "calendars"), calendar))
      await Promise.all(promises)
      toast({
        title: "Calendarios creados",
        description: "Se crearon los calendarios por defecto",
      })
      fetchData()
    } catch (error) {
      console.error("Error creating calendars:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.routeId || !formData.busId || !formData.calendarId || !formData.driverId) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const tripData = {
        routeId: formData.routeId,
        busId: formData.busId,
        calendarId: formData.calendarId,
        driverId: formData.driverId,
        headsign: formData.headsign,
        direction: formData.direction,
        startTime: formData.startTime,
        endTime: formData.endTime,
        frequency: formData.frequency,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (editingTrip) {
        await updateDoc(doc(db, "trips", editingTrip.id), {
          ...tripData,
          createdAt: editingTrip.createdAt,
        })
        toast({
          title: "Éxito",
          description: "Viaje actualizado correctamente",
        })
      } else {
        await addDoc(collection(db, "trips"), tripData)
        toast({
          title: "Éxito",
          description: "Viaje creado correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingTrip(null)
      setFormData({
        routeId: "",
        busId: "",
        calendarId: "",
        driverId: "",
        headsign: "",
        direction: 0,
        startTime: "06:00:00",
        endTime: "22:00:00",
        frequency: 15,
      })
      fetchData()
    } catch (error) {
      console.error("Error saving trip:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el viaje",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip)
    setFormData({
      routeId: trip.routeId,
      busId: trip.busId,
      calendarId: trip.calendarId,
      driverId: (trip as any).driverId || "",
      headsign: trip.headsign,
      direction: trip.direction,
      startTime: trip.startTime,
      endTime: trip.endTime,
      frequency: trip.frequency || 15,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (tripId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este viaje?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "trips", tripId))
      toast({
        title: "Éxito",
        description: "Viaje eliminado correctamente",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting trip:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el viaje",
        variant: "destructive",
      })
    }
  }

  const getRouteInfo = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    return route ? route.shortName : "Ruta desconocida"
  }

  const getBusInfo = (busId: string) => {
    const bus = buses.find((b) => b.id === busId)
    return bus ? bus.plateNumber : "Bus desconocido"
  }

  const getCalendarInfo = (calendarId: string) => {
    const calendar = calendars.find((c) => c.id === calendarId)
    return calendar ? calendar.name : "Calendario desconocido"
  }

  const getDriverInfo = (driverId: string) => {
    const driver = mockDrivers.find((d) => d.id === driverId)
    return driver ? driver.name : "Conductor desconocido"
  }

  const getAvailableBuses = (routeId: string) => {
    return buses.filter((bus) => bus.status === "active" && (!bus.routeId || bus.routeId === routeId))
  }

  const filteredTrips = trips.filter((trip) => {
    const route = routes.find((r) => r.id === trip.routeId)
    const bus = buses.find((b) => b.id === trip.busId)
    return (
      route?.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.headsign.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

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
          <h1 className="text-3xl font-bold text-gray-900">Viajes</h1>
          <p className="text-gray-600">Coordina conductores, buses y horarios</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Viaje
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTrip ? "Editar Viaje" : "Nuevo Viaje"}</DialogTitle>
              <DialogDescription>
                {editingTrip ? "Modifica los datos del viaje" : "Programa un nuevo viaje"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="routeId">Ruta</Label>
                  <Select
                    value={formData.routeId}
                    onValueChange={(value) => setFormData({ ...formData, routeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ruta" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: route.color }} />
                            {route.shortName} - {route.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="busId">Bus</Label>
                  <Select value={formData.busId} onValueChange={(value) => setFormData({ ...formData, busId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableBuses(formData.routeId).map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.plateNumber} - {bus.model} ({bus.capacity} pasajeros)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driverId">Conductor</Label>
                  <Select
                    value={formData.driverId}
                    onValueChange={(value) => setFormData({ ...formData, driverId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar conductor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} - {driver.license} ({driver.experience} años exp.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calendarId">Calendario</Label>
                  <Select
                    value={formData.calendarId}
                    onValueChange={(value) => setFormData({ ...formData, calendarId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar calendario" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          {calendar.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headsign">Destino/Letrero</Label>
                <Input
                  id="headsign"
                  value={formData.headsign}
                  onChange={(e) => setFormData({ ...formData, headsign: e.target.value })}
                  placeholder="Ej: Terminal Terrestre"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="direction">Dirección</Label>
                  <Select
                    value={formData.direction.toString()}
                    onValueChange={(value) => setFormData({ ...formData, direction: Number.parseInt(value) as 0 | 1 })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Ida</SelectItem>
                      <SelectItem value="1">Vuelta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora de Inicio</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime.slice(0, 5)}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value + ":00" })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora de Fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime.slice(0, 5)}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value + ":00" })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frecuencia (minutos)</Label>
                <Input
                  id="frequency"
                  type="number"
                  min="5"
                  max="60"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: Number.parseInt(e.target.value) })}
                  placeholder="15"
                  required
                />
                <p className="text-xs text-gray-500">Tiempo entre salidas de buses en la misma ruta</p>
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingTrip ? "Actualizar" : "Crear"} Viaje
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Viajes</p>
                <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <RouteIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rutas Activas</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(trips.map((t) => t.routeId)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BusIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Buses en Servicio</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(trips.map((t) => t.busId)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Frecuencia Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.length > 0
                    ? Math.round(trips.reduce((sum, trip) => sum + (trip.frequency || 15), 0) / trips.length)
                    : 0}{" "}
                  min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trips List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Viajes Programados ({filteredTrips.length})
          </CardTitle>
          <CardDescription>Gestiona los viajes y asignaciones de conductores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar viajes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Calendario</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => {
                  const route = routes.find((r) => r.id === trip.routeId)
                  return (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: route?.color || "#3B82F6",
                            color: route?.textColor || "#FFFFFF",
                          }}
                        >
                          {getRouteInfo(trip.routeId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{getBusInfo(trip.busId)}</TableCell>
                      <TableCell>{getDriverInfo((trip as any).driverId)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {trip.headsign}
                          <Badge variant="outline" className="text-xs">
                            {trip.direction === 0 ? "Ida" : "Vuelta"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {trip.startTime.slice(0, 5)} - {trip.endTime.slice(0, 5)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{trip.frequency || 15} min</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{getCalendarInfo(trip.calendarId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(trip)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(trip.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredTrips.length === 0 && (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay viajes</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No se encontraron viajes con ese criterio" : "Comienza programando un nuevo viaje"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
