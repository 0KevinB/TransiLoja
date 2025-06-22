"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Route, Stop } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { InteractiveMap } from "@/components/map/interactive-map"
import { RouteIcon, Plus, Edit, Trash2, Search, Map, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const routeColors = [
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#008000",
  "#000080",
  "#800000",
  "#808000",
]

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [selectedStops, setSelectedStops] = useState<string[]>([])
  const [showMap, setShowMap] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    description: "",
    color: "#FF0000",
    textColor: "#FFFFFF",
    operatingStartTime: "06:00",
    operatingEndTime: "22:00",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [routesSnapshot, stopsSnapshot] = await Promise.all([
        getDocs(collection(db, "routes")),
        getDocs(collection(db, "stops")),
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

      // Fetch stops
      const stopsData: Stop[] = []
      stopsSnapshot.forEach((doc) => {
        const data = doc.data()
        stopsData.push({
          id: doc.id,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          lines: data.lines || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })

      setRoutes(routesData.sort((a, b) => a.shortName.localeCompare(b.shortName)))
      setStops(stopsData)
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

  const handleStopSelect = (stopId: string) => {
    setSelectedStops((prev) => {
      if (prev.includes(stopId)) {
        return prev.filter((id) => id !== stopId)
      } else {
        return [...prev, stopId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.shortName) {
      toast({
        title: "Error",
        description: "El nombre y nombre corto son obligatorios",
        variant: "destructive",
      })
      return
    }

    if (selectedStops.length < 2) {
      toast({
        title: "Error",
        description: "Selecciona al menos 2 paradas para la ruta",
        variant: "destructive",
      })
      return
    }

    try {
      const routeData = {
        name: formData.name,
        shortName: formData.shortName,
        description: formData.description,
        color: formData.color,
        textColor: formData.textColor,
        operatingStartTime: formData.operatingStartTime,
        operatingEndTime: formData.operatingEndTime,
        stopIds: selectedStops,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (editingRoute) {
        await updateDoc(doc(db, "routes", editingRoute.id), {
          ...routeData,
          createdAt: editingRoute.createdAt,
        })
        toast({
          title: "Éxito",
          description: "Ruta actualizada correctamente",
        })
      } else {
        await addDoc(collection(db, "routes"), routeData)
        toast({
          title: "Éxito",
          description: "Ruta creada correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingRoute(null)
      setSelectedStops([])
      setShowMap(false)
      setFormData({
        name: "",
        shortName: "",
        description: "",
        color: "#FF0000",
        textColor: "#FFFFFF",
        operatingStartTime: "06:00",
        operatingEndTime: "22:00",
      })
      fetchData()
    } catch (error) {
      console.error("Error saving route:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la ruta",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (route: Route) => {
    setEditingRoute(route)
    setFormData({
      name: route.name,
      shortName: route.shortName,
      description: route.description,
      color: route.color,
      textColor: route.textColor,
      operatingStartTime: route.operatingStartTime,
      operatingEndTime: route.operatingEndTime,
    })
    setSelectedStops(route.stopIds)
    setIsDialogOpen(true)
  }

  const handleDelete = async (routeId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta ruta?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "routes", routeId))
      toast({
        title: "Éxito",
        description: "Ruta eliminada correctamente",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting route:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la ruta",
        variant: "destructive",
      })
    }
  }

  const openDialog = () => {
    setEditingRoute(null)
    setSelectedStops([])
    setShowMap(false)
    setFormData({
      name: "",
      shortName: "",
      description: "",
      color: "#FF0000",
      textColor: "#FFFFFF",
      operatingStartTime: "06:00",
      operatingEndTime: "22:00",
    })
    setIsDialogOpen(true)
  }

  const filteredRoutes = routes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.shortName.toLowerCase().includes(searchTerm.toLowerCase()),
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
          <h1 className="text-3xl font-bold text-gray-900">Rutas</h1>
          <p className="text-gray-600">Gestiona las rutas del sistema de transporte</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialog} className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Ruta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>{editingRoute ? "Editar Ruta" : "Nueva Ruta"}</DialogTitle>
              <DialogDescription>
                {editingRoute ? "Modifica los datos de la ruta" : "Añade una nueva ruta al sistema"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shortName">Nombre corto</Label>
                      <Input
                        id="shortName"
                        value={formData.shortName}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                        placeholder="L1, 101"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Línea 1 - Centro - Terminal"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descripción de la ruta..."
                      rows={3}
                    />
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color">Color de la ruta</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <div className="flex flex-wrap gap-1">
                          {routeColors.slice(0, 6).map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="w-6 h-6 rounded border-2 border-gray-300"
                              style={{ backgroundColor: color }}
                              onClick={() => setFormData({ ...formData, color })}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="textColor">Color del texto</Label>
                      <div className="flex gap-2">
                        <Input
                          id="textColor"
                          type="color"
                          value={formData.textColor}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="w-6 h-6 rounded border-2 border-gray-300 bg-white"
                            onClick={() => setFormData({ ...formData, textColor: "#FFFFFF" })}
                          />
                          <button
                            type="button"
                            className="w-6 h-6 rounded border-2 border-gray-300 bg-black"
                            onClick={() => setFormData({ ...formData, textColor: "#000000" })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Vista previa</Label>
                    <div className="p-3 border rounded-md">
                      <Badge
                        style={{
                          backgroundColor: formData.color,
                          color: formData.textColor,
                          border: "none",
                        }}
                      >
                        {formData.shortName || "L1"}
                      </Badge>
                      <span className="ml-2 text-sm">{formData.name || "Nombre de la ruta"}</span>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formData.operatingStartTime} - {formData.operatingEndTime}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Paradas seleccionadas ({selectedStops.length})</Label>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                      {selectedStops.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay paradas seleccionadas</p>
                      ) : (
                        <div className="space-y-1">
                          {selectedStops.map((stopId, index) => {
                            const stop = stops.find((s) => s.id === stopId)
                            return (
                              <div key={stopId} className="text-sm">
                                {index + 1}. {stop?.name || "Parada no encontrada"}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button type="button" variant="outline" onClick={() => setShowMap(!showMap)} className="w-full">
                    <Map className="mr-2 h-4 w-4" />
                    {showMap ? "Ocultar Mapa" : "Seleccionar Paradas en Mapa"}
                  </Button>
                </div>

                {/* Map */}
                {showMap && (
                  <div className="space-y-2">
                    <Label>Seleccionar paradas para la ruta</Label>
                    <p className="text-sm text-gray-500">
                      Haz clic en las paradas para añadirlas a la ruta. El orden importa.
                    </p>
                    <InteractiveMap
                      mode={{ type: "create-route" }}
                      stops={stops}
                      routes={[]}
                      onRouteStopSelect={handleStopSelect}
                      selectedStops={selectedStops}
                      className="h-96"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingRoute ? "Actualizar" : "Crear"} Ruta
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Map View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Vista del Mapa
          </CardTitle>
          <CardDescription>Visualización geográfica de todas las rutas</CardDescription>
        </CardHeader>
        <CardContent>
          <InteractiveMap mode={{ type: "view-only" }} stops={stops} routes={routes} className="h-96" />
        </CardContent>
      </Card>

      {/* Routes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Rutas Registradas ({filteredRoutes.length})
          </CardTitle>
          <CardDescription>Administra las rutas del sistema de transporte público</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar rutas..."
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Paradas</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: route.color,
                          color: route.textColor,
                          border: "none",
                        }}
                      >
                        {route.shortName}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{route.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{route.stopIds.length} paradas</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {route.operatingStartTime} - {route.operatingEndTime}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {route.description || "Sin descripción"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(route)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(route.id)}
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

          {filteredRoutes.length === 0 && (
            <div className="text-center py-8">
              <RouteIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay rutas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No se encontraron rutas con ese nombre" : "Comienza creando una nueva ruta"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
