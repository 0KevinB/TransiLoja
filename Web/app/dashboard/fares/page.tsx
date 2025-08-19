"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, where, DocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  Clock,
  Route,
  Percent
} from "lucide-react"
import { toast } from "sonner"
import { Tarifa } from "@/lib/types"
import { DataImport } from "@/components/dashboard/data-import"
import { cleanObjectForFirebase, formatDateForInput, parseDateFromInput } from "@/lib/utils"

const ITEMS_PER_PAGE = 15

export default function FaresPage() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [rutas, setRutas] = useState<any[]>([])
  const [tarifaEditando, setTarifaEditando] = useState<Tarifa | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalTarifas, setTotalTarifas] = useState(0)
  const [ultimoDoc, setUltimoDoc] = useState<DocumentSnapshot | null>(null)
  const [hayMasPaginas, setHayMasPaginas] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")

  // Formulario
  const [formData, setFormData] = useState<Partial<Tarifa>>({
    nombre: "",
    descripcion: "",
    tipo: "regular",
    precio: undefined,
    moneda: "USD",
    descuento_porcentaje: 0,
    requiere_validacion: false,
    activa: true,
    rutas_aplicables: [],
    horarios_aplicables: [],
    fecha_inicio: new Date(),
    fecha_fin: undefined
  })

  useEffect(() => {
    cargarDatos(1, true)
  }, [filtroTipo, filtroEstado])

  const cargarDatos = useCallback(async (pagina: number = 1, resetear: boolean = false) => {
    try {
      setCargando(true)
      
      // Cargar rutas para el selector (solo una vez)
      if (rutas.length === 0) {
        const rutasSnap = await getDocs(collection(db, "routes"))
        const rutasData = rutasSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          shortName: doc.data().shortName
        }))
        setRutas(rutasData)
      }
      
      // Cargar tarifas con paginación
      let q = query(
        collection(db, "tarifas"),
        orderBy("createdAt", "desc")
      )

      // Aplicar filtros
      if (filtroTipo !== "todos") {
        q = query(q, where("tipo", "==", filtroTipo))
      }
      
      if (filtroEstado !== "todos") {
        const activa = filtroEstado === "activa"
        q = query(q, where("activa", "==", activa))
      }

      // Paginación
      q = query(q, limit(ITEMS_PER_PAGE + 1))
      
      if (pagina > 1 && ultimoDoc && !resetear) {
        q = query(q, startAfter(ultimoDoc))
      }

      const tarifasSnap = await getDocs(q)
      const docs = tarifasSnap.docs
      
      const hayMas = docs.length > ITEMS_PER_PAGE
      const tarifasData = docs.slice(0, ITEMS_PER_PAGE).map(doc => ({
        id_tarifa: doc.id,
        ...doc.data(),
        fecha_inicio: doc.data().fecha_inicio?.toDate() || new Date(),
        fecha_fin: doc.data().fecha_fin?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Tarifa[]
      
      if (resetear || pagina === 1) {
        setTarifas(tarifasData)
      } else {
        setTarifas(prev => [...prev, ...tarifasData])
      }
      
      setUltimoDoc(docs[Math.min(docs.length - 1, ITEMS_PER_PAGE - 1)])
      setHayMasPaginas(hayMas)
      setPaginaActual(pagina)
      
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast.error("Error al cargar los datos")
    } finally {
      setCargando(false)
    }
  }, [filtroTipo, filtroEstado, ultimoDoc, rutas.length])

  const abrirModal = (tarifa?: Tarifa) => {
    if (tarifa) {
      setTarifaEditando(tarifa)
      setFormData({
        nombre: tarifa.nombre,
        descripcion: tarifa.descripcion,
        tipo: tarifa.tipo,
        precio: tarifa.precio,
        moneda: tarifa.moneda,
        descuento_porcentaje: tarifa.descuento_porcentaje,
        requiere_validacion: tarifa.requiere_validacion,
        activa: tarifa.activa,
        rutas_aplicables: tarifa.rutas_aplicables,
        horarios_aplicables: tarifa.horarios_aplicables,
        fecha_inicio: tarifa.fecha_inicio,
        fecha_fin: tarifa.fecha_fin
      })
    } else {
      setTarifaEditando(null)
      setFormData({
        nombre: "",
        descripcion: "",
        tipo: "regular",
        precio: undefined,
        moneda: "USD",
        descuento_porcentaje: 0,
        requiere_validacion: false,
        activa: true,
        rutas_aplicables: [],
        horarios_aplicables: [],
        fecha_inicio: new Date(),
        fecha_fin: undefined
      })
    }
    setModalAbierto(true)
  }

  const guardarTarifa = async () => {
    try {
      setGuardando(true)

      if (!formData.nombre || formData.precio === undefined || formData.precio <= 0) {
        toast.error("Complete los campos obligatorios. El precio debe ser mayor a 0.")
        return
      }

      const ahora = new Date()
      
      // Crear objeto sin campos undefined
      const tarifaData: any = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        precio: formData.precio,
        moneda: formData.moneda,
        descuento_porcentaje: formData.descuento_porcentaje,
        requiere_validacion: formData.requiere_validacion,
        activa: formData.activa,
        rutas_aplicables: formData.rutas_aplicables || [],
        horarios_aplicables: formData.horarios_aplicables || [],
        fecha_inicio: new Date(formData.fecha_inicio || ahora),
        updatedAt: ahora
      }
      
      // Solo agregar fecha_fin si tiene un valor válido
      if (formData.fecha_fin) {
        tarifaData.fecha_fin = new Date(formData.fecha_fin)
      }

      if (tarifaEditando) {
        // Limpiar datos antes de actualizar
        const cleanData = cleanObjectForFirebase(tarifaData)
        await updateDoc(doc(db, "tarifas", tarifaEditando.id_tarifa), cleanData)
        toast.success("Tarifa actualizada exitosamente")
      } else {
        const nuevoId = `TARIFA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        tarifaData.id_tarifa = nuevoId
        tarifaData.createdAt = ahora
        
        // Limpiar datos antes de crear
        const cleanData = cleanObjectForFirebase(tarifaData)
        await setDoc(doc(db, "tarifas", nuevoId), cleanData)
        toast.success("Tarifa creada exitosamente")
      }

      setModalAbierto(false)
      cargarDatos(1, true)
    } catch (error) {
      console.error("Error guardando tarifa:", error)
      toast.error("Error al guardar la tarifa")
    } finally {
      setGuardando(false)
    }
  }

  const eliminarTarifa = async (tarifa: Tarifa) => {
    if (!confirm(`¿Está seguro de eliminar la tarifa "${tarifa.nombre}"?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, "tarifas", tarifa.id_tarifa))
      toast.success("Tarifa eliminada exitosamente")
      cargarDatos(1, true)
    } catch (error) {
      console.error("Error eliminando tarifa:", error)
      toast.error("Error al eliminar la tarifa")
    }
  }

  const obtenerColorTipo = (tipo: string) => {
    switch (tipo) {
      case "regular": return "bg-blue-100 text-blue-800"
      case "estudiante": return "bg-green-100 text-green-800"
      case "tercera_edad": return "bg-purple-100 text-purple-800"
      case "discapacidad": return "bg-orange-100 text-orange-800"
      case "especial": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const calcularPrecioFinal = (precio: number, descuento?: number) => {
    if (!descuento) return precio
    return precio * (1 - descuento / 100)
  }

  const tarifasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return tarifas
    
    const busquedaLower = busqueda.toLowerCase()
    return tarifas.filter(tarifa =>
      tarifa.nombre.toLowerCase().includes(busquedaLower) ||
      tarifa.tipo.toLowerCase().includes(busquedaLower) ||
      tarifa.descripcion?.toLowerCase().includes(busquedaLower)
    )
  }, [tarifas, busqueda])

  const toggleRutaAplicable = (rutaId: string) => {
    const rutasActuales = formData.rutas_aplicables || []
    if (rutasActuales.includes(rutaId)) {
      setFormData({
        ...formData,
        rutas_aplicables: rutasActuales.filter(id => id !== rutaId)
      })
    } else {
      setFormData({
        ...formData,
        rutas_aplicables: [...rutasActuales, rutaId]
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Tarifas</h1>
          <p className="text-gray-600">
            Administra las tarifas del sistema de transporte público
          </p>
        </div>
        <div className="flex gap-2">
          <DataImport tipoEntidad="tarifas" onImportComplete={() => cargarDatos(1, true)} />
          <Button onClick={() => abrirModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarifa
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por nombre, tipo o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Tarifa</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="estudiante">Estudiante</SelectItem>
                  <SelectItem value="tercera_edad">Tercera Edad</SelectItem>
                  <SelectItem value="discapacidad">Discapacidad</SelectItem>
                  <SelectItem value="especial">Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{tarifas.length}</p>
                <p className="text-gray-600">Total Tarifas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {tarifas.filter(t => t.activa).length}
                </p>
                <p className="text-gray-600">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Percent className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {tarifas.filter(t => t.descuento_porcentaje && t.descuento_porcentaje > 0).length}
                </p>
                <p className="text-gray-600">Con Descuento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Route className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {tarifas.filter(t => t.rutas_aplicables.length === 0).length}
                </p>
                <p className="text-gray-600">Todas las Rutas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {tarifas.filter(t => t.horarios_aplicables && t.horarios_aplicables.length > 0).length}
                </p>
                <p className="text-gray-600">Con Horarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Tarifas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tarifas</CardTitle>
          <CardDescription>
            {tarifasFiltradas.length} tarifa(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cargando && tarifas.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <div className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Información</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Rutas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarifasFiltradas.map((tarifa) => (
                  <TableRow key={tarifa.id_tarifa}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tarifa.nombre}</div>
                        {tarifa.descripcion && (
                          <div className="text-sm text-gray-500">
                            {tarifa.descripcion}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Desde: {tarifa.fecha_inicio.toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={obtenerColorTipo(tarifa.tipo)}>
                        {tarifa.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {tarifa.precio.toFixed(2)} {tarifa.moneda}
                        </div>
                        {tarifa.descuento_porcentaje && tarifa.descuento_porcentaje > 0 && (
                          <div className="text-sm text-green-600">
                            Final: {calcularPrecioFinal(tarifa.precio, tarifa.descuento_porcentaje).toFixed(2)} {tarifa.moneda}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tarifa.descuento_porcentaje && tarifa.descuento_porcentaje > 0 ? (
                        <Badge variant="secondary">
                          -{tarifa.descuento_porcentaje}%
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Sin descuento</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {tarifa.rutas_aplicables.length === 0 ? (
                          <span className="text-gray-500">Todas las rutas</span>
                        ) : (
                          <span>{tarifa.rutas_aplicables.length} ruta(s)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={tarifa.activa ? "default" : "secondary"}>
                          {tarifa.activa ? "Activa" : "Inactiva"}
                        </Badge>
                        {tarifa.requiere_validacion && (
                          <Badge variant="outline" className="text-xs">
                            Validación
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirModal(tarifa)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarTarifa(tarifa)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* Paginación */}
          {tarifasFiltradas.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {tarifasFiltradas.length} de {totalTarifas} tarifas
              </div>
              <div className="flex gap-2">
                {hayMasPaginas && (
                  <Button 
                    variant="outline" 
                    onClick={() => cargarDatos(paginaActual + 1)} 
                    disabled={cargando}
                  >
                    {cargando ? "Cargando..." : "Cargar más"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edición */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {tarifaEditando ? "Editar Tarifa" : "Nueva Tarifa"}
            </DialogTitle>
            <DialogDescription>
              Configure los detalles de la tarifa
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="font-medium">Información Básica</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Tarifa Regular"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Tarifa</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value) => setFormData({...formData, tipo: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="estudiante">Estudiante</SelectItem>
                      <SelectItem value="tercera_edad">Tercera Edad</SelectItem>
                      <SelectItem value="discapacidad">Discapacidad</SelectItem>
                      <SelectItem value="especial">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción de la tarifa"
                  rows={2}
                />
              </div>
            </div>

            {/* Precio y Descuentos */}
            <div className="space-y-4">
              <h3 className="font-medium">Precio y Descuentos</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio Base *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio || ''}
                    onChange={(e) => setFormData({...formData, precio: parseFloat(e.target.value) || undefined})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moneda">Moneda</Label>
                  <Select 
                    value={formData.moneda} 
                    onValueChange={(value) => setFormData({...formData, moneda: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dólar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="PEN">PEN - Sol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descuento">Descuento (%)</Label>
                  <Input
                    id="descuento"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.descuento_porcentaje}
                    onChange={(e) => setFormData({...formData, descuento_porcentaje: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              {formData.precio && formData.descuento_porcentaje && formData.descuento_porcentaje > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Precio final: {calcularPrecioFinal(formData.precio, formData.descuento_porcentaje).toFixed(2)} {formData.moneda}
                  </p>
                </div>
              )}
            </div>

            {/* Rutas Aplicables */}
            <div className="space-y-4">
              <h3 className="font-medium">Rutas Aplicables</h3>
              <p className="text-sm text-gray-500">
                Si no selecciona ninguna ruta, la tarifa se aplicará a todas las rutas
              </p>
              
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {rutas.map((ruta) => (
                  <div key={ruta.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ruta-${ruta.id}`}
                      checked={formData.rutas_aplicables?.includes(ruta.id) || false}
                      onCheckedChange={() => toggleRutaAplicable(ruta.id)}
                    />
                    <label 
                      htmlFor={`ruta-${ruta.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {ruta.shortName} - {ruta.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Fechas de Vigencia */}
            <div className="space-y-4">
              <h3 className="font-medium">Fechas de Vigencia</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formatDateForInput(formData.fecha_inicio)}
                    onChange={(e) => setFormData({
                      ...formData, 
                      fecha_inicio: parseDateFromInput(e.target.value) || new Date()
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha de Fin (opcional)</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={formatDateForInput(formData.fecha_fin)}
                    onChange={(e) => setFormData({
                      ...formData, 
                      fecha_fin: parseDateFromInput(e.target.value)
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Si no se especifica, la tarifa será válida indefinidamente
                  </p>
                </div>
              </div>
            </div>

            {/* Configuración */}
            <div className="space-y-4">
              <h3 className="font-medium">Configuración</h3>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="activa"
                  checked={formData.activa}
                  onCheckedChange={(checked) => setFormData({...formData, activa: checked})}
                />
                <Label htmlFor="activa">Tarifa activa</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="validacion"
                  checked={formData.requiere_validacion}
                  onCheckedChange={(checked) => setFormData({...formData, requiere_validacion: checked})}
                />
                <Label htmlFor="validacion">Requiere validación de identidad</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarTarifa} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}