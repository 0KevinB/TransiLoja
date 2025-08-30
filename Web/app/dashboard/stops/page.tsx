"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Stop } from "@/lib/types"
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
import { InteractiveMap } from "@/components/map/interactive-map"
import { MapPin, Plus, Edit, Trash2, Search, Map } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StopsPage() {
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStop, setEditingStop] = useState<Stop | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    lat: "",
    lng: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchStops()
  }, [])

  const fetchStops = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "stops"))
      const stopsData: Stop[] = []
      querySnapshot.forEach((doc) => {
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
      setStops(stopsData.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error("Error fetching stops:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las paradas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMapStopAdd = (lat: number, lng: number) => {
    setTempCoords({ lat, lng })
    setFormData({
      ...formData,
      lat: lat.toString(),
      lng: lng.toString(),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.lat || !formData.lng) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    const lat = Number.parseFloat(formData.lat)
    const lng = Number.parseFloat(formData.lng)

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Error",
        description: "Las coordenadas deben ser números válidos",
        variant: "destructive",
      })
      return
    }

    try {
      const stopData = {
        name: formData.name,
        lat,
        lng,
        lines: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (editingStop) {
        await updateDoc(doc(db, "stops", editingStop.id), {
          ...stopData,
          createdAt: editingStop.createdAt,
        })
        toast({
          title: "Éxito",
          description: "Parada actualizada correctamente",
        })
      } else {
        await addDoc(collection(db, "stops"), stopData)
        toast({
          title: "Éxito",
          description: "Parada creada correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingStop(null)
      setShowMap(false)
      setTempCoords(null)
      setFormData({ name: "", lat: "", lng: "" })
      fetchStops()
    } catch (error) {
      console.error("Error saving stop:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la parada",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (stop: Stop) => {
    setEditingStop(stop)
    setFormData({
      name: stop.name,
      lat: stop.lat.toString(),
      lng: stop.lng.toString(),
    })
    setTempCoords({ lat: stop.lat, lng: stop.lng })
    setIsDialogOpen(true)
  }

  const handleDelete = async (stopId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta parada?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "stops", stopId))
      toast({
        title: "Éxito",
        description: "Parada eliminada correctamente",
      })
      fetchStops()
    } catch (error) {
      console.error("Error deleting stop:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la parada",
        variant: "destructive",
      })
    }
  }

  const openDialog = () => {
    setEditingStop(null)
    setFormData({ name: "", lat: "", lng: "" })
    setTempCoords(null)
    setShowMap(false)
    setIsDialogOpen(true)
  }

  const filteredStops = stops.filter((stop) => stop.name.toLowerCase().includes(searchTerm.toLowerCase()))

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
          <h1 className="text-3xl font-bold text-gray-900">Paradas</h1>
          <p className="text-gray-600">Gestiona las paradas del sistema de transporte</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialog} className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Parada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editingStop ? "Editar Parada" : "Nueva Parada"}</DialogTitle>
              <DialogDescription>
                {editingStop ? "Modifica los datos de la parada" : "Añade una nueva parada al sistema"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la parada</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Parque Central"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitud</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        placeholder="-3.99313"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitud</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                        placeholder="-79.20422"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowMap(!showMap)} className="flex-1">
                      <Map className="mr-2 h-4 w-4" />
                      {showMap ? "Ocultar Mapa" : "Seleccionar en Mapa"}
                    </Button>
                  </div>

                  {tempCoords && (
                    <div className="p-3 bg-sky-50 border border-sky-200 rounded-md">
                      <p className="text-sm font-medium text-sky-900">Coordenadas seleccionadas:</p>
                      <p className="text-xs text-sky-700">
                        Lat: {tempCoords.lat.toFixed(6)}, Lng: {tempCoords.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Map */}
                {showMap && (
                  <div className="space-y-2">
                    <Label>Seleccionar ubicación en el mapa</Label>
                    <InteractiveMap
                      mode={{ type: "add-stop" }}
                      stops={
                        tempCoords
                          ? [{ id: "temp", name: "Nueva parada", lat: tempCoords.lat, lng: tempCoords.lng, lines: [] }]
                          : []
                      }
                      routes={[]}
                      onStopAdd={handleMapStopAdd}
                      className="h-80"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingStop ? "Actualizar" : "Crear"} Parada
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
            <MapPin className="h-5 w-5" />
            Vista del Mapa
          </CardTitle>
          <CardDescription>Visualización geográfica de todas las paradas</CardDescription>
        </CardHeader>
        <CardContent>
          <InteractiveMap mode={{ type: "view-only" }} stops={stops} routes={[]} className="h-96" />
        </CardContent>
      </Card>

      {/* Search and Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Paradas Registradas ({filteredStops.length})
          </CardTitle>
          <CardDescription>Administra las paradas del sistema de transporte público</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar paradas..."
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
                  <TableHead>Coordenadas</TableHead>
                  <TableHead>Líneas</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStops.map((stop) => (
                  <TableRow key={stop.id}>
                    <TableCell className="font-medium">{stop.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{stop.lines.length} líneas</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {stop.createdAt.toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(stop)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(stop.id)}
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

          {filteredStops.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay paradas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No se encontraron paradas con ese nombre" : "Comienza creando una nueva parada"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
