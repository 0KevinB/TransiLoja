"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Bus, Route } from "@/lib/types"
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
import { Switch } from "@/components/ui/switch"
import { BusIcon, Plus, Edit, Trash2, Search, Wifi, Accessibility, Snowflake, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock data for realistic bus information
const mockBusModels = [
  "Mercedes-Benz Citaro",
  "Volvo 7900",
  "Scania Citywide",
  "MAN Lion's City",
  "Iveco Urbanway",
  "BYD K9",
  "Yutong E12",
  "King Long XMQ6127",
]

const generateMockBuses = (count: number): Omit<Bus, "id" | "createdAt" | "updatedAt">[] => {
  const buses = []
  for (let i = 1; i <= count; i++) {
    const plateNumber = `LOJ-${String(i).padStart(3, "0")}`
    const model = mockBusModels[Math.floor(Math.random() * mockBusModels.length)]
    const year = 2015 + Math.floor(Math.random() * 9) // 2015-2023
    const capacity = 40 + Math.floor(Math.random() * 41) // 40-80 passengers

    buses.push({
      plateNumber,
      model,
      year,
      capacity,
      status: Math.random() > 0.1 ? "active" : Math.random() > 0.5 ? "maintenance" : "retired",
      features: {
        airConditioning: Math.random() > 0.3,
        wheelchair: Math.random() > 0.4,
        wifi: Math.random() > 0.6,
        gps: Math.random() > 0.2,
      },
    })
  }
  return buses
}

export default function BusesPage() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBus, setEditingBus] = useState<Bus | null>(null)
  const [formData, setFormData] = useState({
    plateNumber: "",
    model: "",
    year: new Date().getFullYear(),
    capacity: 50,
    status: "active" as "active" | "maintenance" | "retired",
    routeId: "",
    features: {
      airConditioning: false,
      wheelchair: false,
      wifi: false,
      gps: true,
    },
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [busesSnapshot, routesSnapshot] = await Promise.all([
        getDocs(collection(db, "buses")),
        getDocs(collection(db, "routes")),
      ])

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
          features: data.features || {
            airConditioning: false,
            wheelchair: false,
            wifi: false,
            gps: false,
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

      // If no buses exist, create mock data
      if (busesData.length === 0) {
        await createMockBuses()
        return
      }

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

      setBuses(busesData.sort((a, b) => a.plateNumber.localeCompare(b.plateNumber)))
      setRoutes(routesData)
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

  const createMockBuses = async () => {
    try {
      const mockBuses = generateMockBuses(15)
      const promises = mockBuses.map((bus) =>
        addDoc(collection(db, "buses"), {
          ...bus,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      )
      await Promise.all(promises)
      toast({
        title: "Datos iniciales creados",
        description: "Se han creado 15 buses de ejemplo",
      })
      fetchData()
    } catch (error) {
      console.error("Error creating mock buses:", error)
      toast({
        title: "Error",
        description: "No se pudieron crear los datos de ejemplo",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.plateNumber || !formData.model) {
      toast({
        title: "Error",
        description: "La placa y modelo son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const busData = {
        plateNumber: formData.plateNumber,
        model: formData.model,
        year: formData.year,
        capacity: formData.capacity,
        status: formData.status,
        routeId: formData.routeId || undefined,
        features: formData.features,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (editingBus) {
        await updateDoc(doc(db, "buses", editingBus.id), {
          ...busData,
          createdAt: editingBus.createdAt,
        })
        toast({
          title: "Éxito",
          description: "Bus actualizado correctamente",
        })
      } else {
        await addDoc(collection(db, "buses"), busData)
        toast({
          title: "Éxito",
          description: "Bus creado correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingBus(null)
      setFormData({
        plateNumber: "",
        model: "",
        year: new Date().getFullYear(),
        capacity: 50,
        status: "active",
        routeId: "",
        features: {
          airConditioning: false,
          wheelchair: false,
          wifi: false,
          gps: true,
        },
      })
      fetchData()
    } catch (error) {
      console.error("Error saving bus:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el bus",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (bus: Bus) => {
    setEditingBus(bus)
    setFormData({
      plateNumber: bus.plateNumber,
      model: bus.model,
      year: bus.year,
      capacity: bus.capacity,
      status: bus.status,
      routeId: bus.routeId || "",
      features: bus.features,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (busId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este bus?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "buses", busId))
      toast({
        title: "Éxito",
        description: "Bus eliminado correctamente",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting bus:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el bus",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Mantenimiento</Badge>
      case "retired":
        return <Badge className="bg-red-100 text-red-800">Retirado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRouteInfo = (routeId?: string) => {
    if (!routeId) return "Sin asignar"
    const route = routes.find((r) => r.id === routeId)
    return route ? route.shortName : "Ruta no encontrada"
  }

  const filteredBuses = buses.filter(
    (bus) =>
      bus.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase()),
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
          <h1 className="text-3xl font-bold text-gray-900">Flota de Buses</h1>
          <p className="text-gray-600">Gestiona los vehículos del sistema de transporte</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Bus
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBus ? "Editar Bus" : "Nuevo Bus"}</DialogTitle>
              <DialogDescription>
                {editingBus ? "Modifica los datos del bus" : "Añade un nuevo bus a la flota"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">Placa</Label>
                  <Input
                    id="plateNumber"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    placeholder="LOJ-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Select value={formData.model} onValueChange={(value) => setFormData({ ...formData, model: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockBusModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Año</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2000"
                    max="2030"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidad</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="20"
                    max="100"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      <SelectItem value="retired">Retirado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="routeId">Ruta asignada (opcional)</Label>
                <Select
                  value={formData.routeId}
                  onValueChange={(value) => setFormData({ ...formData, routeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.shortName} - {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Características</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Snowflake className="h-4 w-4" />
                      <span className="text-sm">Aire acondicionado</span>
                    </div>
                    <Switch
                      checked={formData.features.airConditioning}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          features: { ...formData.features, airConditioning: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Accessibility className="h-4 w-4" />
                      <span className="text-sm">Acceso para sillas de ruedas</span>
                    </div>
                    <Switch
                      checked={formData.features.wheelchair}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          features: { ...formData.features, wheelchair: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      <span className="text-sm">WiFi</span>
                    </div>
                    <Switch
                      checked={formData.features.wifi}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          features: { ...formData.features, wifi: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      <span className="text-sm">GPS</span>
                    </div>
                    <Switch
                      checked={formData.features.gps}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          features: { ...formData.features, gps: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingBus ? "Actualizar" : "Crear"} Bus
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
              <BusIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Buses Activos</p>
                <p className="text-2xl font-bold text-gray-900">{buses.filter((b) => b.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BusIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Mantenimiento</p>
                <p className="text-2xl font-bold text-gray-900">
                  {buses.filter((b) => b.status === "maintenance").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BusIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Retirados</p>
                <p className="text-2xl font-bold text-gray-900">{buses.filter((b) => b.status === "retired").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BusIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Capacidad Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {buses.reduce((total, bus) => total + bus.capacity, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BusIcon className="h-5 w-5" />
            Flota de Buses ({filteredBuses.length})
          </CardTitle>
          <CardDescription>Administra los vehículos del sistema de transporte público</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por placa o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Características</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">{bus.plateNumber}</TableCell>
                    <TableCell>{bus.model}</TableCell>
                    <TableCell>{bus.year}</TableCell>
                    <TableCell>{bus.capacity} pasajeros</TableCell>
                    <TableCell>{getStatusBadge(bus.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRouteInfo(bus.routeId)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {bus.features.airConditioning && (
                          <Snowflake className="h-4 w-4 text-blue-500" title="Aire acondicionado" />
                        )}
                        {bus.features.wheelchair && (
                          <Accessibility className="h-4 w-4 text-green-500" title="Accesible" />
                        )}
                        {bus.features.wifi && <Wifi className="h-4 w-4 text-purple-500" title="WiFi" />}
                        {bus.features.gps && <Navigation className="h-4 w-4 text-orange-500" title="GPS" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(bus)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(bus.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBuses.length === 0 && (
            <div className="text-center py-8">
              <BusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay buses</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No se encontraron buses con ese criterio" : "Comienza añadiendo un nuevo bus"}
              </p>
              {buses.length === 0 && (
                <Button onClick={createMockBuses} className="mt-4 bg-sky-500 hover:bg-sky-600">
                  Crear datos de ejemplo
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
