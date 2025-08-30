"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, where, DocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Upload,
  Download,
  Star,
  Calendar,
  Phone,
  Mail
} from "lucide-react"
import { toast } from "sonner"
import { Conductor } from "@/lib/types"
import { DataImport } from "@/components/dashboard/data-import"

const ITEMS_PER_PAGE = 15

export default function DriversPage() {
  const [conductores, setConductores] = useState<Conductor[]>([])
  const [conductorEditando, setConductorEditando] = useState<Conductor | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalConductores, setTotalConductores] = useState(0)
  const [ultimoDoc, setUltimoDoc] = useState<DocumentSnapshot | null>(null)
  const [hayMasPaginas, setHayMasPaginas] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroLicencia, setFiltroLicencia] = useState<string>("todos")

  // Formulario
  const [formData, setFormData] = useState<Partial<Conductor>>({
    cedula: "",
    nombre: "",
    apellidos: "",
    telefono: "",
    email: "",
    direccion: "",
    tipo_licencia: "B",
    estado: "activo",
    experiencia_anos: 0,
    observaciones: ""
  })

  useEffect(() => {
    cargarConductores(1, undefined, true)
  }, [filtroEstado, filtroLicencia])

  const cargarConductores = useCallback(async (pagina: number = 1, buscar?: string, resetear: boolean = false) => {
    try {
      setCargando(true)
      
      let q = query(
        collection(db, "conductores"),
        orderBy("createdAt", "desc")
      )

      // Aplicar filtros
      if (filtroEstado !== "todos") {
        q = query(q, where("estado", "==", filtroEstado))
      }
      
      if (filtroLicencia !== "todos") {
        q = query(q, where("tipo_licencia", "==", filtroLicencia))
      }

      // Paginación
      q = query(q, limit(ITEMS_PER_PAGE + 1))
      
      if (pagina > 1 && ultimoDoc && !resetear) {
        q = query(q, startAfter(ultimoDoc))
      }

      const conductoresSnap = await getDocs(q)
      const docs = conductoresSnap.docs
      
      const hayMas = docs.length > ITEMS_PER_PAGE
      const conductoresData = docs.slice(0, ITEMS_PER_PAGE).map(doc => ({
        id_conductor: doc.id,
        ...doc.data(),
        fecha_nacimiento: doc.data().fecha_nacimiento?.toDate() || new Date(),
        fecha_licencia: doc.data().fecha_licencia?.toDate() || new Date(),
        fecha_vencimiento_licencia: doc.data().fecha_vencimiento_licencia?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Conductor[]
      
      if (resetear || pagina === 1) {
        setConductores(conductoresData)
      } else {
        setConductores(prev => [...prev, ...conductoresData])
      }
      
      setUltimoDoc(docs[Math.min(docs.length - 1, ITEMS_PER_PAGE - 1)])
      setHayMasPaginas(hayMas)
      setPaginaActual(pagina)
      
    } catch (error) {
      console.error("Error cargando conductores:", error)
      toast.error("Error al cargar los conductores")
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroLicencia, ultimoDoc])

  const abrirModal = (conductor?: Conductor) => {
    if (conductor) {
      setConductorEditando(conductor)
      setFormData({
        cedula: conductor.cedula,
        nombre: conductor.nombre,
        apellidos: conductor.apellidos,
        telefono: conductor.telefono,
        email: conductor.email,
        direccion: conductor.direccion,
        tipo_licencia: conductor.tipo_licencia,
        estado: conductor.estado,
        experiencia_anos: conductor.experiencia_anos,
        observaciones: conductor.observaciones
      })
    } else {
      setConductorEditando(null)
      setFormData({
        cedula: "",
        nombre: "",
        apellidos: "",
        telefono: "",
        email: "",
        direccion: "",
        tipo_licencia: "B",
        estado: "activo",
        experiencia_anos: 0,
        observaciones: ""
      })
    }
    setModalAbierto(true)
  }

  const guardarConductor = async () => {
    try {
      setGuardando(true)

      // Validaciones básicas
      if (!formData.cedula || !formData.nombre || !formData.apellidos || !formData.telefono) {
        toast.error("Complete los campos obligatorios")
        return
      }

      const ahora = new Date()
      const conductorData: Partial<Conductor> = {
        ...formData,
        fecha_nacimiento: new Date(formData.fecha_nacimiento || ahora),
        fecha_licencia: new Date(formData.fecha_licencia || ahora),
        fecha_vencimiento_licencia: new Date(formData.fecha_vencimiento_licencia || ahora),
        updatedAt: ahora
      }

      if (conductorEditando) {
        // Actualizar conductor existente
        await updateDoc(doc(db, "conductores", conductorEditando.id_conductor), conductorData)
        toast.success("Conductor actualizado exitosamente")
      } else {
        // Crear nuevo conductor
        const nuevoId = `COND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        conductorData.id_conductor = nuevoId
        conductorData.createdAt = ahora
        
        await setDoc(doc(db, "conductores", nuevoId), conductorData)
        toast.success("Conductor creado exitosamente")
      }

      setModalAbierto(false)
      cargarConductores(1, undefined, true)
    } catch (error) {
      console.error("Error guardando conductor:", error)
      toast.error("Error al guardar el conductor")
    } finally {
      setGuardando(false)
    }
  }

  const eliminarConductor = async (conductor: Conductor) => {
    if (!confirm(`¿Está seguro de eliminar al conductor ${conductor.nombre} ${conductor.apellidos}?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, "conductores", conductor.id_conductor))
      toast.success("Conductor eliminado exitosamente")
      cargarConductores(1, undefined, true)
    } catch (error) {
      console.error("Error eliminando conductor:", error)
      toast.error("Error al eliminar el conductor")
    }
  }

  const calcularEdad = (fechaNacimiento: Date): number => {
    const hoy = new Date()
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
    const mesActual = hoy.getMonth()
    const mesNacimiento = fechaNacimiento.getMonth()
    
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--
    }
    
    return edad
  }

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case "activo": return "bg-green-100 text-green-800"
      case "inactivo": return "bg-gray-100 text-gray-800"
      case "suspendido": return "bg-red-100 text-red-800"
      case "vacaciones": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const conductoresFiltrados = useMemo(() => {
    if (!busqueda.trim()) return conductores
    
    const busquedaLower = busqueda.toLowerCase()
    return conductores.filter(conductor =>
      conductor.nombre.toLowerCase().includes(busquedaLower) ||
      conductor.apellidos.toLowerCase().includes(busquedaLower) ||
      conductor.cedula.includes(busqueda) ||
      conductor.telefono.includes(busqueda)
    )
  }, [conductores, busqueda])

  const exportarCSV = () => {
    const headers = "Cédula,Nombre,Apellidos,Teléfono,Email,Tipo Licencia,Estado,Experiencia,Edad\n"
    const csvContent = conductores.map(conductor => 
      `${conductor.cedula},"${conductor.nombre}","${conductor.apellidos}",${conductor.telefono},"${conductor.email || ''}",${conductor.tipo_licencia},${conductor.estado},${conductor.experiencia_anos},${calcularEdad(conductor.fecha_nacimiento)}`
    ).join("\n")
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conductores_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Conductores</h1>
          <p className="text-gray-600">
            Administra la información de los conductores del sistema de transporte
          </p>
        </div>
        <div className="flex gap-2">
          <DataImport tipoEntidad="conductores" onImportComplete={() => cargarConductores(1, undefined, true)} />
          <Button variant="outline" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => abrirModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Conductor
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
                placeholder="Buscar por nombre, cédula o teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="vacaciones">Vacaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo Licencia</Label>
              <Select value={filtroLicencia} onValueChange={setFiltroLicencia}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="A">Tipo A</SelectItem>
                  <SelectItem value="B">Tipo B</SelectItem>
                  <SelectItem value="C">Tipo C</SelectItem>
                  <SelectItem value="D">Tipo D</SelectItem>
                  <SelectItem value="E">Tipo E</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{conductores.length}</p>
                <p className="text-gray-600">Total Conductores</p>
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
                  {conductores.filter(c => c.estado === "activo").length}
                </p>
                <p className="text-gray-600">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {conductores.filter(c => c.estado === "suspendido").length}
                </p>
                <p className="text-gray-600">Suspendidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {conductores.length > 0 ? 
                    (conductores.reduce((acc, c) => acc + (c.calificacion || 0), 0) / conductores.length).toFixed(1) 
                    : "0"}
                </p>
                <p className="text-gray-600">Calificación Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Conductores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Conductores</CardTitle>
          <CardDescription>
            {conductoresFiltrados.length} conductor(es) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cargando && conductores.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Información Personal</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Licencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Experiencia</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conductoresFiltrados.map((conductor) => (
                  <TableRow key={conductor.id_conductor}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {conductor.nombre} {conductor.apellidos}
                        </div>
                        <div className="text-sm text-gray-500">
                          CI: {conductor.cedula}
                        </div>
                        <div className="text-sm text-gray-500">
                          Edad: {calcularEdad(conductor.fecha_nacimiento)} años
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {conductor.telefono}
                        </div>
                        {conductor.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            {conductor.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline">Tipo {conductor.tipo_licencia}</Badge>
                        <div className="text-sm text-gray-500 mt-1">
                          Vence: {conductor.fecha_vencimiento_licencia.toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={obtenerColorEstado(conductor.estado)}>
                        {conductor.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{conductor.experiencia_anos} años</div>
                        {conductor.calificacion && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {conductor.calificacion.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirModal(conductor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarConductor(conductor)}
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
          {conductoresFiltrados.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {conductoresFiltrados.length} de {totalConductores} conductores
              </div>
              <div className="flex gap-2">
                {hayMasPaginas && (
                  <Button 
                    variant="outline" 
                    onClick={() => cargarConductores(paginaActual + 1)} 
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {conductorEditando ? "Editar Conductor" : "Nuevo Conductor"}
            </DialogTitle>
            <DialogDescription>
              Complete la información del conductor
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="font-medium">Información Personal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula}
                    onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="0987654321"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                    placeholder="Pérez García"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="conductor@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  placeholder="Dirección completa"
                  rows={2}
                />
              </div>
            </div>

            {/* Información Profesional */}
            <div className="space-y-4">
              <h3 className="font-medium">Información Profesional</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_licencia">Tipo de Licencia</Label>
                  <Select 
                    value={formData.tipo_licencia} 
                    onValueChange={(value) => setFormData({...formData, tipo_licencia: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Tipo A - Motocicletas</SelectItem>
                      <SelectItem value="B">Tipo B - Automóviles</SelectItem>
                      <SelectItem value="C">Tipo C - Camiones</SelectItem>
                      <SelectItem value="D">Tipo D - Buses</SelectItem>
                      <SelectItem value="E">Tipo E - Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select 
                    value={formData.estado} 
                    onValueChange={(value) => setFormData({...formData, estado: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="suspendido">Suspendido</SelectItem>
                      <SelectItem value="vacaciones">Vacaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experiencia">Años de Experiencia</Label>
                <Input
                  id="experiencia"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experiencia_anos}
                  onChange={(e) => setFormData({...formData, experiencia_anos: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  placeholder="Observaciones adicionales"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarConductor} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}