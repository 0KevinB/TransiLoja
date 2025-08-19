"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, where, DocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  MapPin,
  Palette,
  Settings,
  Smartphone,
  Upload,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { Municipio } from "@/lib/types"

const ITEMS_PER_PAGE = 10

export default function MunicipalitiesPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [municipioEditando, setMunicipioEditando] = useState<Municipio | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalMunicipios, setTotalMunicipios] = useState(0)
  const [ultimoDoc, setUltimoDoc] = useState<DocumentSnapshot | null>(null)
  const [hayMasPaginas, setHayMasPaginas] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroPais, setFiltroPais] = useState<string>("todos")

  // Formulario
  const [formData, setFormData] = useState<Partial<Municipio>>({
    nombre: "",
    codigo_postal: "",
    provincia: "",
    pais: "Ecuador",
    coordenadas_centro: { lat: -3.99313, lng: -79.20422 },
    zoom_defecto: 14,
    configuracion_visual: {
      color_primario: "#0ea5e9",
      color_secundario: "#64748b",
      color_acento: "#10b981",
      tema_oscuro_disponible: true
    },
    configuracion_tecnica: {
      radio_busqueda_metros: 500,
      tiempo_maximo_caminata_seg: 600,
      tiempo_maximo_espera_seg: 1800,
      precision_gps_metros: 10,
      intervalo_actualizacion_seg: 30
    },
    configuracion_mapa: {
      estilo_mapa: "OpenStreetMap",
      mostrar_trafico: false,
      mostrar_satelite: true,
      capas_adicionales: []
    },
    informacion_contacto: {},
    configuracion_app: {
      nombre_app: "TransiLoja"
    },
    activo: true
  })

  useEffect(() => {
    cargarMunicipios(1, true)
  }, [filtroEstado, filtroPais])

  const cargarMunicipios = useCallback(async (pagina: number = 1, resetear: boolean = false) => {
    try {
      setCargando(true)
      
      let q = query(
        collection(db, "municipios"),
        orderBy("createdAt", "desc")
      )

      // Aplicar filtros
      if (filtroEstado !== "todos") {
        const activo = filtroEstado === "activo"
        q = query(q, where("activo", "==", activo))
      }
      
      if (filtroPais !== "todos") {
        q = query(q, where("pais", "==", filtroPais))
      }

      // Paginación
      q = query(q, limit(ITEMS_PER_PAGE + 1))
      
      if (pagina > 1 && ultimoDoc && !resetear) {
        q = query(q, startAfter(ultimoDoc))
      }

      const municipiosSnap = await getDocs(q)
      const docs = municipiosSnap.docs
      
      const hayMas = docs.length > ITEMS_PER_PAGE
      const municipiosData = docs.slice(0, ITEMS_PER_PAGE).map(doc => ({
        id_municipio: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Municipio[]
      
      if (resetear || pagina === 1) {
        setMunicipios(municipiosData)
      } else {
        setMunicipios(prev => [...prev, ...municipiosData])
      }
      
      setUltimoDoc(docs[Math.min(docs.length - 1, ITEMS_PER_PAGE - 1)])
      setHayMasPaginas(hayMas)
      setPaginaActual(pagina)
      
    } catch (error) {
      console.error("Error cargando municipios:", error)
      toast.error("Error al cargar los municipios")
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, filtroPais, ultimoDoc])

  const abrirModal = (municipio?: Municipio) => {
    if (municipio) {
      setMunicipioEditando(municipio)
      setFormData(municipio)
    } else {
      setMunicipioEditando(null)
      setFormData({
        nombre: "",
        codigo_postal: "",
        provincia: "",
        pais: "Ecuador",
        coordenadas_centro: { lat: -3.99313, lng: -79.20422 },
        zoom_defecto: 14,
        configuracion_visual: {
          color_primario: "#0ea5e9",
          color_secundario: "#64748b",
          color_acento: "#10b981",
          tema_oscuro_disponible: true
        },
        configuracion_tecnica: {
          radio_busqueda_metros: 500,
          tiempo_maximo_caminata_seg: 600,
          tiempo_maximo_espera_seg: 1800,
          precision_gps_metros: 10,
          intervalo_actualizacion_seg: 30
        },
        configuracion_mapa: {
          estilo_mapa: "OpenStreetMap",
          mostrar_trafico: false,
          mostrar_satelite: true,
          capas_adicionales: []
        },
        informacion_contacto: {},
        configuracion_app: {
          nombre_app: `Transi${formData.nombre || "Ciudad"}`
        },
        activo: true
      })
    }
    setModalAbierto(true)
  }

  const guardarMunicipio = async () => {
    try {
      setGuardando(true)

      if (!formData.nombre || !formData.provincia) {
        toast.error("Complete los campos obligatorios")
        return
      }

      const ahora = new Date()
      const municipioData: Partial<Municipio> = {
        ...formData,
        updatedAt: ahora
      }

      if (municipioEditando) {
        await updateDoc(doc(db, "municipios", municipioEditando.id_municipio), municipioData)
        toast.success("Municipio actualizado exitosamente")
      } else {
        const nuevoId = formData.nombre?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || `municipio_${Date.now()}`
        municipioData.id_municipio = nuevoId
        municipioData.createdAt = ahora
        
        await setDoc(doc(db, "municipios", nuevoId), municipioData)
        toast.success("Municipio creado exitosamente")
      }

      setModalAbierto(false)
      cargarMunicipios(1, true)
    } catch (error) {
      console.error("Error guardando municipio:", error)
      toast.error("Error al guardar el municipio")
    } finally {
      setGuardando(false)
    }
  }

  const eliminarMunicipio = async (municipio: Municipio) => {
    if (!confirm(`¿Está seguro de eliminar el municipio "${municipio.nombre}"?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, "municipios", municipio.id_municipio))
      toast.success("Municipio eliminado exitosamente")
      cargarMunicipios(1, true)
    } catch (error) {
      console.error("Error eliminando municipio:", error)
      toast.error("Error al eliminar el municipio")
    }
  }

  const actualizarFormData = (path: string, value: any) => {
    const keys = path.split('.')
    const newFormData = { ...formData }
    let current: any = newFormData

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current[keys[i]] = { ...current[keys[i]] }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setFormData(newFormData)
  }

  const municipiosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return municipios
    
    const busquedaLower = busqueda.toLowerCase()
    return municipios.filter(municipio =>
      municipio.nombre.toLowerCase().includes(busquedaLower) ||
      municipio.provincia.toLowerCase().includes(busquedaLower) ||
      municipio.pais.toLowerCase().includes(busquedaLower)
    )
  }, [municipios, busqueda])

  const paisesUnicos = useMemo(() => {
    const paises = [...new Set(municipios.map(m => m.pais))]
    return paises.sort()
  }, [municipios])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Municipios</h1>
          <p className="text-gray-600">
            Configure los municipios y ciudades del sistema de transporte
          </p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Municipio
        </Button>
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
                placeholder="Buscar por nombre, provincia o país..."
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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={filtroPais} onValueChange={setFiltroPais}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {paisesUnicos.map(pais => (
                    <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                  ))}
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
              <Globe className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{municipios.length}</p>
                <p className="text-gray-600">Total Municipios</p>
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
                  {municipios.filter(m => m.activo).length}
                </p>
                <p className="text-gray-600">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Palette className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {municipios.filter(m => m.configuracion_visual?.logo_url).length}
                </p>
                <p className="text-gray-600">Con Logo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Smartphone className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {municipios.filter(m => m.configuracion_app?.url_play_store || m.configuracion_app?.url_app_store).length}
                </p>
                <p className="text-gray-600">Con App</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Municipios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Municipios</CardTitle>
          <CardDescription>
            {municipiosFiltrados.length} municipio(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cargando && municipios.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Configuración</TableHead>
                  <TableHead>App</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {municipiosFiltrados.map((municipio) => (
                  <TableRow key={municipio.id_municipio}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: municipio.configuracion_visual?.color_primario || '#0ea5e9' }}
                          ></div>
                          {municipio.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {municipio.id_municipio}
                        </div>
                        {municipio.codigo_postal && (
                          <div className="text-sm text-gray-500">
                            CP: {municipio.codigo_postal}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {municipio.provincia}, {municipio.pais}
                        </div>
                        <div className="text-sm text-gray-500">
                          {municipio.coordenadas_centro.lat.toFixed(4)}, {municipio.coordenadas_centro.lng.toFixed(4)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {municipio.configuracion_visual?.logo_url && (
                          <Badge variant="outline" className="text-xs">
                            <Palette className="h-3 w-3 mr-1" />
                            Logo
                          </Badge>
                        )}
                        {municipio.configuracion_visual?.tema_oscuro_disponible && (
                          <Badge variant="outline" className="text-xs">
                            Tema Oscuro
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">
                          {municipio.configuracion_app?.nombre_app || "Sin nombre"}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {municipio.configuracion_app?.url_play_store && (
                            <Badge variant="outline" className="text-xs">Android</Badge>
                          )}
                          {municipio.configuracion_app?.url_app_store && (
                            <Badge variant="outline" className="text-xs">iOS</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={municipio.activo ? "default" : "secondary"}>
                        {municipio.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirModal(municipio)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarMunicipio(municipio)}
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
          {municipiosFiltrados.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {municipiosFiltrados.length} de {totalMunicipios} municipios
              </div>
              <div className="flex gap-2">
                {hayMasPaginas && (
                  <Button 
                    variant="outline" 
                    onClick={() => cargarMunicipios(paginaActual + 1)} 
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {municipioEditando ? "Editar Municipio" : "Nuevo Municipio"}
            </DialogTitle>
            <DialogDescription>
              Configure todos los aspectos del municipio
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="tecnico">Técnico</TabsTrigger>
              <TabsTrigger value="mapa">Mapa</TabsTrigger>
              <TabsTrigger value="app">App Móvil</TabsTrigger>
            </TabsList>

            {/* Información General */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Municipio *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => actualizarFormData('nombre', e.target.value)}
                    placeholder="Loja"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo_postal">Código Postal</Label>
                  <Input
                    id="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={(e) => actualizarFormData('codigo_postal', e.target.value)}
                    placeholder="110101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia *</Label>
                  <Input
                    id="provincia"
                    value={formData.provincia}
                    onChange={(e) => actualizarFormData('provincia', e.target.value)}
                    placeholder="Loja"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={formData.pais}
                    onChange={(e) => actualizarFormData('pais', e.target.value)}
                    placeholder="Ecuador"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitud Centro</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="0.000001"
                    value={formData.coordenadas_centro?.lat}
                    onChange={(e) => actualizarFormData('coordenadas_centro.lat', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Longitud Centro</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="0.000001"
                    value={formData.coordenadas_centro?.lng}
                    onChange={(e) => actualizarFormData('coordenadas_centro.lng', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zoom">Zoom por Defecto</Label>
                  <Input
                    id="zoom"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.zoom_defecto}
                    onChange={(e) => actualizarFormData('zoom_defecto', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-4">
                <h3 className="font-medium">Información de Contacto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.informacion_contacto?.telefono}
                      onChange={(e) => actualizarFormData('informacion_contacto.telefono', e.target.value)}
                      placeholder="+593 7 257-0407"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.informacion_contacto?.email}
                      onChange={(e) => actualizarFormData('informacion_contacto.email', e.target.value)}
                      placeholder="contacto@municipio.gob.ec"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sitio_web">Sitio Web</Label>
                  <Input
                    id="sitio_web"
                    type="url"
                    value={formData.informacion_contacto?.sitio_web}
                    onChange={(e) => actualizarFormData('informacion_contacto.sitio_web', e.target.value)}
                    placeholder="https://www.municipio.gob.ec"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Textarea
                    id="direccion"
                    value={formData.informacion_contacto?.direccion}
                    onChange={(e) => actualizarFormData('informacion_contacto.direccion', e.target.value)}
                    placeholder="Dirección completa del municipio"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => actualizarFormData('activo', checked)}
                />
                <Label htmlFor="activo">Municipio activo</Label>
              </div>
            </TabsContent>

            {/* Configuración Visual */}
            <TabsContent value="visual" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL del Logo</Label>
                  <Input
                    id="logo_url"
                    value={formData.configuracion_visual?.logo_url}
                    onChange={(e) => actualizarFormData('configuracion_visual.logo_url', e.target.value)}
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon_url">URL del Favicon</Label>
                  <Input
                    id="favicon_url"
                    value={formData.configuracion_visual?.favicon_url}
                    onChange={(e) => actualizarFormData('configuracion_visual.favicon_url', e.target.value)}
                    placeholder="https://ejemplo.com/favicon.ico"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color_primario">Color Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color_primario"
                      type="color"
                      value={formData.configuracion_visual?.color_primario}
                      onChange={(e) => actualizarFormData('configuracion_visual.color_primario', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={formData.configuracion_visual?.color_primario}
                      onChange={(e) => actualizarFormData('configuracion_visual.color_primario', e.target.value)}
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color_secundario">Color Secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color_secundario"
                      type="color"
                      value={formData.configuracion_visual?.color_secundario}
                      onChange={(e) => actualizarFormData('configuracion_visual.color_secundario', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={formData.configuracion_visual?.color_secundario}
                      onChange={(e) => actualizarFormData('configuracion_visual.color_secundario', e.target.value)}
                      placeholder="#64748b"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color_acento">Color de Acento</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color_acento"
                      type="color"
                      value={formData.configuracion_visual?.color_acento}
                      onChange={(e) => actualizarFormData('configuracion_visual.color_acento', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={formData.configuracion_visual?.color_acento}
                      onChange={(e) => actualizarFormData('configuracion_visual.color_acento', e.target.value)}
                      placeholder="#10b981"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuente_principal">Fuente Principal (opcional)</Label>
                <Input
                  id="fuente_principal"
                  value={formData.configuracion_visual?.fuente_principal}
                  onChange={(e) => actualizarFormData('configuracion_visual.fuente_principal', e.target.value)}
                  placeholder="Inter, system-ui, sans-serif"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="tema_oscuro"
                  checked={formData.configuracion_visual?.tema_oscuro_disponible}
                  onCheckedChange={(checked) => actualizarFormData('configuracion_visual.tema_oscuro_disponible', checked)}
                />
                <Label htmlFor="tema_oscuro">Permitir tema oscuro</Label>
              </div>

              {/* Vista previa de colores */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Vista Previa</h4>
                <div className="flex gap-4">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: formData.configuracion_visual?.color_primario }}
                  >
                    Primario
                  </div>
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: formData.configuracion_visual?.color_secundario }}
                  >
                    Secundario
                  </div>
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: formData.configuracion_visual?.color_acento }}
                  >
                    Acento
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Configuración Técnica */}
            <TabsContent value="tecnico" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="radio_busqueda">Radio de Búsqueda (metros)</Label>
                  <Input
                    id="radio_busqueda"
                    type="number"
                    min="100"
                    max="2000"
                    value={formData.configuracion_tecnica?.radio_busqueda_metros}
                    onChange={(e) => actualizarFormData('configuracion_tecnica.radio_busqueda_metros', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precision_gps">Precisión GPS (metros)</Label>
                  <Input
                    id="precision_gps"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.configuracion_tecnica?.precision_gps_metros}
                    onChange={(e) => actualizarFormData('configuracion_tecnica.precision_gps_metros', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tiempo_caminata">Tiempo Máximo Caminata (segundos)</Label>
                  <Input
                    id="tiempo_caminata"
                    type="number"
                    min="60"
                    max="1800"
                    value={formData.configuracion_tecnica?.tiempo_maximo_caminata_seg}
                    onChange={(e) => actualizarFormData('configuracion_tecnica.tiempo_maximo_caminata_seg', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">
                    {Math.round((formData.configuracion_tecnica?.tiempo_maximo_caminata_seg || 0) / 60)} minutos
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiempo_espera">Tiempo Máximo Espera (segundos)</Label>
                  <Input
                    id="tiempo_espera"
                    type="number"
                    min="300"
                    max="3600"
                    value={formData.configuracion_tecnica?.tiempo_maximo_espera_seg}
                    onChange={(e) => actualizarFormData('configuracion_tecnica.tiempo_maximo_espera_seg', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">
                    {Math.round((formData.configuracion_tecnica?.tiempo_maximo_espera_seg || 0) / 60)} minutos
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervalo_actualizacion">Intervalo de Actualización GPS (segundos)</Label>
                <Input
                  id="intervalo_actualizacion"
                  type="number"
                  min="10"
                  max="300"
                  value={formData.configuracion_tecnica?.intervalo_actualizacion_seg}
                  onChange={(e) => actualizarFormData('configuracion_tecnica.intervalo_actualizacion_seg', parseInt(e.target.value))}
                />
              </div>
            </TabsContent>

            {/* Configuración del Mapa */}
            <TabsContent value="mapa" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="estilo_mapa">Estilo del Mapa</Label>
                <Input
                  id="estilo_mapa"
                  value={formData.configuracion_mapa?.estilo_mapa}
                  onChange={(e) => actualizarFormData('configuracion_mapa.estilo_mapa', e.target.value)}
                  placeholder="OpenStreetMap"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mostrar_trafico"
                    checked={formData.configuracion_mapa?.mostrar_trafico}
                    onCheckedChange={(checked) => actualizarFormData('configuracion_mapa.mostrar_trafico', checked)}
                  />
                  <Label htmlFor="mostrar_trafico">Mostrar información de tráfico</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="mostrar_satelite"
                    checked={formData.configuracion_mapa?.mostrar_satelite}
                    onCheckedChange={(checked) => actualizarFormData('configuracion_mapa.mostrar_satelite', checked)}
                  />
                  <Label htmlFor="mostrar_satelite">Permitir vista satelital</Label>
                </div>
              </div>
            </TabsContent>

            {/* Configuración de App Móvil */}
            <TabsContent value="app" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_app">Nombre de la App</Label>
                  <Input
                    id="nombre_app"
                    value={formData.configuracion_app?.nombre_app}
                    onChange={(e) => actualizarFormData('configuracion_app.nombre_app', e.target.value)}
                    placeholder="TransiLoja"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion_app">Descripción</Label>
                  <Input
                    id="descripcion_app"
                    value={formData.configuracion_app?.descripcion_app}
                    onChange={(e) => actualizarFormData('configuracion_app.descripcion_app', e.target.value)}
                    placeholder="App de transporte público"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version_android">Versión Mínima Android</Label>
                  <Input
                    id="version_android"
                    value={formData.configuracion_app?.version_minima_android}
                    onChange={(e) => actualizarFormData('configuracion_app.version_minima_android', e.target.value)}
                    placeholder="6.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version_ios">Versión Mínima iOS</Label>
                  <Input
                    id="version_ios"
                    value={formData.configuracion_app?.version_minima_ios}
                    onChange={(e) => actualizarFormData('configuracion_app.version_minima_ios', e.target.value)}
                    placeholder="12.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="url_play_store">URL Play Store</Label>
                  <Input
                    id="url_play_store"
                    type="url"
                    value={formData.configuracion_app?.url_play_store}
                    onChange={(e) => actualizarFormData('configuracion_app.url_play_store', e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url_app_store">URL App Store</Label>
                  <Input
                    id="url_app_store"
                    type="url"
                    value={formData.configuracion_app?.url_app_store}
                    onChange={(e) => actualizarFormData('configuracion_app.url_app_store', e.target.value)}
                    placeholder="https://apps.apple.com/app/..."
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarMunicipio} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}