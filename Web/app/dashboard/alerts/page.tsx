"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Alert, Route } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Search,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  RouteIcon,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const alertTypes = [
  { value: "info", label: "Información", icon: Info, color: "bg-blue-100 text-blue-800" },
  { value: "warning", label: "Advertencia", icon: AlertCircle, color: "bg-yellow-100 text-yellow-800" },
  { value: "error", label: "Error", icon: XCircle, color: "bg-red-100 text-red-800" },
  { value: "success", label: "Éxito", icon: CheckCircle, color: "bg-green-100 text-green-800" },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "info" as "info" | "warning" | "error" | "success",
    affectedRoutes: "",
    affectedStops: "",
    alternativeRoute: "",
    startDate: "",
    endDate: "",
    isActive: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [alertsSnapshot, routesSnapshot] = await Promise.all([
        getDocs(collection(db, "alerts")),
        getDocs(collection(db, "routes")),
      ])

      // Fetch alerts
      const alertsData: Alert[] = []
      alertsSnapshot.forEach((doc) => {
        const data = doc.data()
        alertsData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          type: data.type,
          affectedRoutes: data.affectedRoutes || [],
          affectedStops: data.affectedStops || [],
          alternativeRoute: data.alternativeRoute,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
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

      setAlerts(alertsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "El título y descripción son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const alertData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        affectedRoutes: formData.affectedRoutes
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        affectedStops: formData.affectedStops
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        alternativeRoute: formData.alternativeRoute || undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: formData.isActive,
        createdAt: new Date(),
      }

      if (editingAlert) {
        await updateDoc(doc(db, "alerts", editingAlert.id), {
          ...alertData,
          createdAt: editingAlert.createdAt,
        })
        toast({
          title: "Éxito",
          description: "Alerta actualizada correctamente",
        })
      } else {
        await addDoc(collection(db, "alerts"), alertData)
        toast({
          title: "Éxito",
          description: "Alerta creada correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingAlert(null)
      setFormData({
        title: "",
        description: "",
        type: "info",
        affectedRoutes: "",
        affectedStops: "",
        alternativeRoute: "",
        startDate: "",
        endDate: "",
        isActive: true,
      })
      fetchData()
    } catch (error) {
      console.error("Error saving alert:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la alerta",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert)
    setFormData({
      title: alert.title,
      description: alert.description,
      type: alert.type,
      affectedRoutes: alert.affectedRoutes.join(", "),
      affectedStops: alert.affectedStops.join(", "),
      alternativeRoute: alert.alternativeRoute || "",
      startDate: alert.startDate.toISOString().slice(0, 16),
      endDate: alert.endDate.toISOString().slice(0, 16),
      isActive: alert.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (alertId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta alerta?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "alerts", alertId))
      toast({
        title: "Éxito",
        description: "Alerta eliminada correctamente",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting alert:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la alerta",
        variant: "destructive",
      })
    }
  }

  const toggleAlertStatus = async (alertId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "alerts", alertId), {
        isActive: !currentStatus,
      })
      toast({
        title: "Éxito",
        description: `Alerta ${!currentStatus ? "activada" : "desactivada"} correctamente`,
      })
      fetchData()
    } catch (error) {
      console.error("Error updating alert status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la alerta",
        variant: "destructive",
      })
    }
  }

  const getAlertTypeInfo = (type: string) => {
    return alertTypes.find((t) => t.value === type) || alertTypes[0]
  }

  const getRouteInfo = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    return route ? route.shortName : routeId
  }

  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()),
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
          <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-600">Gestiona las alertas del sistema de transporte</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Alerta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAlert ? "Editar Alerta" : "Nueva Alerta"}</DialogTitle>
              <DialogDescription>
                {editingAlert ? "Modifica los datos de la alerta" : "Crea una nueva alerta para el sistema"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título de la alerta"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de alerta</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {alertTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada de la alerta..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="affectedRoutes">Rutas afectadas</Label>
                  <Input
                    id="affectedRoutes"
                    value={formData.affectedRoutes}
                    onChange={(e) => setFormData({ ...formData, affectedRoutes: e.target.value })}
                    placeholder="L1, L2, L3 (separadas por comas)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affectedStops">Paradas afectadas</Label>
                  <Input
                    id="affectedStops"
                    value={formData.affectedStops}
                    onChange={(e) => setFormData({ ...formData, affectedStops: e.target.value })}
                    placeholder="Parada 1, Parada 2 (separadas por comas)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternativeRoute">Ruta alternativa (opcional)</Label>
                <Select
                  value={formData.alternativeRoute}
                  onValueChange={(value) => setFormData({ ...formData, alternativeRoute: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ruta alternativa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin ruta alternativa</SelectItem>
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
                {formData.alternativeRoute && (
                  <p className="text-xs text-gray-500">
                    Esta ruta se sugerirá como alternativa a los usuarios afectados
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de inicio</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de fin</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Alerta activa</Label>
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                  {editingAlert ? "Actualizar" : "Crear"} Alerta
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas del Sistema ({filteredAlerts.length})
          </CardTitle>
          <CardDescription>Administra las alertas y notificaciones del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar alertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Ruta Alternativa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => {
                  const typeInfo = getAlertTypeInfo(alert.type)
                  const Icon = typeInfo.icon

                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge className={typeInfo.color}>
                          <Icon className="mr-1 h-3 w-3" />
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{alert.title}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">{alert.description}</TableCell>
                      <TableCell>
                        {alert.alternativeRoute ? (
                          <div className="flex items-center gap-2">
                            <RouteIcon className="h-3 w-3" />
                            <Badge variant="outline">{getRouteInfo(alert.alternativeRoute)}</Badge>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin alternativa</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alert.isActive}
                            onCheckedChange={() => toggleAlertStatus(alert.id, alert.isActive)}
                            size="sm"
                          />
                          <span className="text-sm">{alert.isActive ? "Activa" : "Inactiva"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div>
                          <div>Inicio: {alert.startDate.toLocaleDateString("es-ES")}</div>
                          <div>Fin: {alert.endDate.toLocaleDateString("es-ES")}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(alert)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(alert.id)}
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

          {filteredAlerts.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay alertas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No se encontraron alertas con ese término" : "Comienza creando una nueva alerta"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
