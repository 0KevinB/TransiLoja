"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Calendar, Route } from "@/lib/types"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Plus, Edit, Trash2, Search, Clock, RouteIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const daysOfWeek = [
  { key: "monday", label: "Lunes", short: "L" },
  { key: "tuesday", label: "Martes", short: "M" },
  { key: "wednesday", label: "Miércoles", short: "X" },
  { key: "thursday", label: "Jueves", short: "J" },
  { key: "friday", label: "Viernes", short: "V" },
  { key: "saturday", label: "Sábado", short: "S" },
  { key: "sunday", label: "Domingo", short: "D" },
]

export default function CalendarsPage() {
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    routeId: "general", // Updated default value
    operatingStartTime: "06:00",
    operatingEndTime: "22:00",
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    startDate: "",
    endDate: "",
    holidays: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [calendarsSnapshot, routesSnapshot] = await Promise.all([
        getDocs(collection(db, "calendars")),
        getDocs(collection(db, "routes")),
      ])

      // Fetch calendars
      const calendarsData: Calendar[] = []
      calendarsSnapshot.forEach((doc) => {
        const data = doc.data()
        calendarsData.push({
          id: doc.id,
          name: data.name,
          routeId: data.routeId,
          operatingStartTime: data.operatingStartTime || "06:00",
          operatingEndTime: data.operatingEndTime || "22:00",
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

      setCalendars(calendarsData.sort((a, b) => a.name.localeCompare(b.name)))
      setRoutes(routesData)

      // Crear calendarios por defecto si no existen
      if (calendarsData.length === 0 && routesData.length > 0) {
        await createDefaultCalendars(routesData)
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

  const createDefaultCalendars = async (routes: Route[]) => {
    const defaultCalendars = routes.slice(0, 3).map((route, index) => ({
      name: `Horario ${route.shortName}`,
      routeId: route.id,
      operatingStartTime: index === 0 ? "06:00" : index === 1 ? "06:30" : "07:00",
      operatingEndTime: index === 0 ? "19:30" : index === 1 ? "18:30" : "20:00",
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: index < 2, // Solo las primeras 2 rutas operan sábados
      sunday: false,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      holidays: ["2024-01-01", "2024-12-25"], // Año Nuevo y Navidad
    }))

    try {
      const promises = defaultCalendars.map((calendar) => addDoc(collection(db, "calendars"), calendar))
      await Promise.all(promises)
      toast({
        title: "Calendarios creados",
        description: "Se crearon calendarios específicos por ruta",
      })
      fetchData()
    } catch (error) {
      console.error("Error creating calendars:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "El nombre y las fechas son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const calendarData = {
        name: formData.name,
        routeId: formData.routeId || undefined,
        operatingStartTime: formData.operatingStartTime,
        operatingEndTime: formData.operatingEndTime,
        monday: formData.monday,
        tuesday: formData.tuesday,
        wednesday: formData.wednesday,
        thursday: formData.thursday,
        friday: formData.friday,
        saturday: formData.saturday,
        sunday: formData.sunday,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        holidays: formData.holidays
          .split(",")
          .map((h) => h.trim())
          .filter((h) => h),
      }

      if (editingCalendar) {
        await updateDoc(doc(db, "calendars", editingCalendar.id), calendarData)
        toast({
          title: "Éxito",
          description: "Calendario actualizado correctamente",
        })
      } else {
        await addDoc(collection(db, "calendars"), calendarData)
        toast({
          title: "Éxito",
          description: "Calendario creado correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingCalendar(null)
      setFormData({
        name: "",
        routeId: "general", // Updated default value
        operatingStartTime: "06:00",
        operatingEndTime: "22:00",
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        startDate: "",
        endDate: "",
        holidays: "",
      })
      fetchData()
    } catch (error) {
      console.error("Error saving calendar:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el calendario",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (calendar: Calendar) => {
    setEditingCalendar(calendar)
    setFormData({
      name: calendar.name,
      routeId: calendar.routeId || "general", // Updated default value
      operatingStartTime: calendar.operatingStartTime,
      operatingEndTime: calendar.operatingEndTime,
      monday: calendar.monday,
      tuesday: calendar.tuesday,
      wednesday: calendar.wednesday,
      thursday: calendar.thursday,
      friday: calendar.friday,
      saturday: calendar.saturday,
      sunday: calendar.sunday,
      startDate: calendar.startDate.toISOString().slice(0, 10),
      endDate: calendar.endDate.toISOString().slice(0, 10),
      holidays: calendar.holidays.join(", "),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (calendarId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este calendario?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "calendars", calendarId))
      toast({
        title: "Éxito",
        description: "Calendario eliminado correctamente",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting calendar:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el calendario",
        variant: "destructive",
      })
    }
  }

  const getRouteInfo = (routeId?: string) => {
    if (!routeId || routeId === "general") return "General"
    const route = routes.find((r) => r.id === routeId)
    return route ? route.shortName : "Ruta desconocida"
  }

  const getRouteColor = (routeId?: string) => {
    if (!routeId || routeId === "general") return "#6B7280"
    const route = routes.find((r) => r.id === routeId)
    return route?.color || "#6B7280"
  }

  const getCalendarType = (calendar: Calendar) => {
    const weekdays = calendar.monday && calendar.tuesday && calendar.wednesday && calendar.thursday && calendar.friday
    const weekends = calendar.saturday && calendar.sunday
    const noWeekends = !calendar.saturday && !calendar.sunday

    if (weekdays && noWeekends) return { type: "Días Laborables", color: "bg-blue-100 text-blue-800" }
    if (!weekdays && weekends) return { type: "Fines de Semana", color: "bg-green-100 text-green-800" }
    if (weekdays && weekends) return { type: "Todos los Días", color: "bg-purple-100 text-purple-800" }
    return { type: "Personalizado", color: "bg-gray-100 text-gray-800" }
  }

  const filteredCalendars = calendars.filter((calendar) =>
    calendar.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Calendarios por Ruta</h1>
          <p className="text-gray-600">Define horarios específicos para cada línea de transporte</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Calendario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCalendar ? "Editar Calendario" : "Nuevo Calendario"}</DialogTitle>
              <DialogDescription>
                {editingCalendar ? "Modifica el calendario de servicio" : "Crea un nuevo calendario de servicio"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del calendario</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Horario Línea 5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routeId">Ruta específica (opcional)</Label>
                  <Select
                    value={formData.routeId}
                    onValueChange={(value) => setFormData({ ...formData, routeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ruta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General (todas las rutas)</SelectItem>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operatingStartTime">Hora de inicio</Label>
                  <Input
                    id="operatingStartTime"
                    type="time"
                    value={formData.operatingStartTime}
                    onChange={(e) => setFormData({ ...formData, operatingStartTime: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatingEndTime">Hora de fin</Label>
                  <Input
                    id="operatingEndTime"
                    type="time"
                    value={formData.operatingEndTime}
                    onChange={(e) => setFormData({ ...formData, operatingEndTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Días de operación</Label>
                <div className="grid grid-cols-2 gap-3">
                  {daysOfWeek.map((day) => (
                    <div key={day.key} className="flex items-center justify-between">
                      <Label htmlFor={day.key}>{day.label}</Label>
                      <Switch
                        id={day.key}
                        checked={formData[day.key as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => setFormData({ ...formData, [day.key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="holidays">Días festivos (opcional)</Label>
                <Textarea
                  id="holidays"
                  value={formData.holidays}
                  onChange={(e) => setFormData({ ...formData, holidays: e.target.value })}
                  placeholder="2024-01-01, 2024-12-25 (formato YYYY-MM-DD, separados por comas)"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Fechas en las que no habrá servicio, formato YYYY-MM-DD separadas por comas
                </p>
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingCalendar ? "Actualizar" : "Crear"} Calendario
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
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Calendarios</p>
                <p className="text-2xl font-bold text-gray-900">{calendars.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <RouteIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rutas con Horario</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(calendars.filter((c) => c.routeId).map((c) => c.routeId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Calendarios Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calendars.filter((c) => c.endDate > new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Días Festivos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calendars.reduce((total, cal) => total + cal.holidays.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendars List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendarios de Servicio ({filteredCalendars.length})
          </CardTitle>
          <CardDescription>Horarios específicos por ruta y días de operación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar calendarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Horario de Operación</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Días de Operación</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalendars.map((calendar) => {
                  const calendarType = getCalendarType(calendar)
                  return (
                    <TableRow key={calendar.id}>
                      <TableCell className="font-medium">{calendar.name}</TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: getRouteColor(calendar.routeId),
                            color: "#FFFFFF",
                          }}
                        >
                          {getRouteInfo(calendar.routeId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {calendar.operatingStartTime} - {calendar.operatingEndTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={calendarType.color}>{calendarType.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {daysOfWeek.map((day) => (
                            <Badge
                              key={day.key}
                              variant={calendar[day.key as keyof Calendar] ? "default" : "outline"}
                              className="text-xs w-6 h-6 p-0 flex items-center justify-center"
                            >
                              {day.short}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <div>Desde: {calendar.startDate.toLocaleDateString("es-ES")}</div>
                          <div>Hasta: {calendar.endDate.toLocaleDateString("es-ES")}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(calendar)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(calendar.id)}
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

          {filteredCalendars.length === 0 && (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay calendarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No se encontraron calendarios con ese nombre" : "Comienza creando un nuevo calendario"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
