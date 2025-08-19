"use client"

import { useState, useRef } from "react"
import { collection, addDoc, doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X,
  Info
} from "lucide-react"
import { toast } from "sonner"
import { ImportacionDatos } from "@/lib/types"

interface DataImportProps {
  tipoEntidad: "paradas" | "rutas" | "viajes" | "conductores" | "buses" | "tarifas"
  onImportComplete?: () => void
}

interface CampoMapeo {
  csvField: string
  dbField: string
  required: boolean
  tipo: "string" | "number" | "boolean" | "date"
  ejemplo?: string
}

const CAMPOS_MAPEO: Record<string, CampoMapeo[]> = {
  paradas: [
    { csvField: "nombre", dbField: "name", required: true, tipo: "string", ejemplo: "Parque Central" },
    { csvField: "latitud", dbField: "lat", required: true, tipo: "number", ejemplo: "-3.99313" },
    { csvField: "longitud", dbField: "lng", required: true, tipo: "number", ejemplo: "-79.20422" },
    { csvField: "lineas", dbField: "lines", required: false, tipo: "string", ejemplo: "L1,L2,L3" },
  ],
  rutas: [
    { csvField: "nombre", dbField: "name", required: true, tipo: "string", ejemplo: "Sauces Norte - Argelia" },
    { csvField: "nombre_corto", dbField: "shortName", required: true, tipo: "string", ejemplo: "L1" },
    { csvField: "descripcion", dbField: "description", required: false, tipo: "string" },
    { csvField: "color", dbField: "color", required: false, tipo: "string", ejemplo: "#FF0000" },
    { csvField: "hora_inicio", dbField: "operatingStartTime", required: false, tipo: "string", ejemplo: "06:00" },
    { csvField: "hora_fin", dbField: "operatingEndTime", required: false, tipo: "string", ejemplo: "22:00" },
  ],
  buses: [
    { csvField: "placa", dbField: "plateNumber", required: true, tipo: "string", ejemplo: "LOJ-001" },
    { csvField: "modelo", dbField: "model", required: true, tipo: "string", ejemplo: "Mercedes-Benz Citaro" },
    { csvField: "año", dbField: "year", required: true, tipo: "number", ejemplo: "2020" },
    { csvField: "capacidad", dbField: "capacity", required: true, tipo: "number", ejemplo: "50" },
    { csvField: "estado", dbField: "status", required: false, tipo: "string", ejemplo: "active" },
    { csvField: "aire_acondicionado", dbField: "airConditioning", required: false, tipo: "boolean", ejemplo: "true" },
    { csvField: "wifi", dbField: "wifi", required: false, tipo: "boolean", ejemplo: "false" },
    { csvField: "gps", dbField: "gps", required: false, tipo: "boolean", ejemplo: "true" },
    { csvField: "accesible", dbField: "wheelchair", required: false, tipo: "boolean", ejemplo: "true" },
  ],
  conductores: [
    { csvField: "cedula", dbField: "cedula", required: true, tipo: "string", ejemplo: "1234567890" },
    { csvField: "nombre", dbField: "nombre", required: true, tipo: "string", ejemplo: "Juan" },
    { csvField: "apellidos", dbField: "apellidos", required: true, tipo: "string", ejemplo: "Pérez García" },
    { csvField: "telefono", dbField: "telefono", required: true, tipo: "string", ejemplo: "0987654321" },
    { csvField: "email", dbField: "email", required: false, tipo: "string", ejemplo: "juan@email.com" },
    { csvField: "fecha_nacimiento", dbField: "fecha_nacimiento", required: false, tipo: "date", ejemplo: "1980-05-15" },
    { csvField: "tipo_licencia", dbField: "tipo_licencia", required: false, tipo: "string", ejemplo: "D" },
    { csvField: "experiencia_años", dbField: "experiencia_anos", required: false, tipo: "number", ejemplo: "5" },
    { csvField: "estado", dbField: "estado", required: false, tipo: "string", ejemplo: "activo" },
  ],
  tarifas: [
    { csvField: "nombre", dbField: "nombre", required: true, tipo: "string", ejemplo: "Tarifa Regular" },
    { csvField: "tipo", dbField: "tipo", required: true, tipo: "string", ejemplo: "regular" },
    { csvField: "precio", dbField: "precio", required: true, tipo: "number", ejemplo: "0.35" },
    { csvField: "moneda", dbField: "moneda", required: false, tipo: "string", ejemplo: "USD" },
    { csvField: "descuento", dbField: "descuento_porcentaje", required: false, tipo: "number", ejemplo: "10" },
    { csvField: "activa", dbField: "activa", required: false, tipo: "boolean", ejemplo: "true" },
  ],
  viajes: [
    { csvField: "id_ruta", dbField: "routeId", required: true, tipo: "string", ejemplo: "L1" },
    { csvField: "hora_inicio", dbField: "startTime", required: true, tipo: "string", ejemplo: "08:00:00" },
    { csvField: "hora_fin", dbField: "endTime", required: false, tipo: "string", ejemplo: "08:45:00" },
    { csvField: "direccion", dbField: "direction", required: false, tipo: "number", ejemplo: "0" },
    { csvField: "frecuencia", dbField: "frequency", required: false, tipo: "number", ejemplo: "15" },
  ]
}

export function DataImport({ tipoEntidad, onImportComplete }: DataImportProps) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [resultado, setResultado] = useState<ImportacionDatos | null>(null)
  const [previsualizacion, setPrevisualizacion] = useState<any[]>([])
  const [separador, setSeparador] = useState(",")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setArchivo(file)
      leerPrevisualizacion(file)
    }
  }

  const leerPrevisualizacion = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const contenido = e.target?.result as string
      const lineas = contenido.split('\n').slice(0, 6) // Primeras 5 líneas + header
      const datos = lineas.map(linea => linea.split(separador))
      setPrevisualizacion(datos)
    }
    reader.readAsText(file)
  }

  const procesarArchivo = async () => {
    if (!archivo) return

    setProcesando(true)
    setProgreso(0)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const contenido = e.target?.result as string
        const lineas = contenido.split('\n').filter(linea => linea.trim())
        
        if (lineas.length === 0) {
          toast.error("El archivo está vacío")
          return
        }

        const headers = lineas[0].split(separador)
        const filasDatos = lineas.slice(1)
        
        const importacion: Partial<ImportacionDatos> = {
          id_importacion: `IMPORT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tipo_datos: tipoEntidad,
          archivo_nombre: archivo.name,
          archivo_tipo: archivo.name.endsWith('.csv') ? 'csv' : 'txt',
          estado: 'procesando',
          registros_totales: filasDatos.length,
          registros_procesados: 0,
          registros_exitosos: 0,
          registros_error: 0,
          errores: [],
          fecha_inicio: new Date(),
          usuario_id: 'admin' // TODO: obtener del contexto de auth
        }

        // Guardar información de importación
        await setDoc(doc(db, "importaciones", importacion.id_importacion!), importacion)

        const errores: { linea: number, campo?: string, mensaje: string }[] = []
        let exitosos = 0

        // Procesar cada fila
        for (let i = 0; i < filasDatos.length; i++) {
          const fila = filasDatos[i].split(separador)
          
          try {
            const objeto = await procesarFila(headers, fila, i + 2) // +2 porque empezamos en línea 2
            
            if (objeto) {
              await guardarObjeto(objeto)
              exitosos++
            }
          } catch (error: any) {
            errores.push({
              linea: i + 2,
              mensaje: error.message || 'Error desconocido'
            })
          }

          // Actualizar progreso
          setProgreso(Math.round(((i + 1) / filasDatos.length) * 100))
        }

        // Actualizar resultado final
        const resultadoFinal: Partial<ImportacionDatos> = {
          ...importacion,
          estado: errores.length === filasDatos.length ? 'error' : 'completado',
          registros_procesados: filasDatos.length,
          registros_exitosos: exitosos,
          registros_error: errores.length,
          errores: errores.slice(0, 100), // Limitar a 100 errores
          fecha_fin: new Date()
        }

        await setDoc(doc(db, "importaciones", importacion.id_importacion!), resultadoFinal)
        setResultado(resultadoFinal as ImportacionDatos)

        if (exitosos > 0) {
          toast.success(`Importación completada: ${exitosos} registros procesados exitosamente`)
          onImportComplete?.()
        }

        if (errores.length > 0) {
          toast.error(`${errores.length} registros con errores`)
        }
      }

      reader.readAsText(archivo)
    } catch (error) {
      console.error('Error procesando archivo:', error)
      toast.error('Error al procesar el archivo')
    } finally {
      setProcesando(false)
    }
  }

  const procesarFila = async (headers: string[], valores: string[], numeroLinea: number): Promise<any> => {
    const campos = CAMPOS_MAPEO[tipoEntidad]
    const objeto: any = {
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Mapear campos
    for (const campo of campos) {
      const indice = headers.findIndex(h => h.trim().toLowerCase() === campo.csvField.toLowerCase())
      
      if (indice === -1) {
        if (campo.required) {
          throw new Error(`Campo requerido '${campo.csvField}' no encontrado`)
        }
        continue
      }

      const valor = valores[indice]?.trim()

      if (campo.required && (!valor || valor === '')) {
        throw new Error(`Campo '${campo.csvField}' es requerido pero está vacío`)
      }

      if (valor) {
        objeto[campo.dbField] = convertirValor(valor, campo.tipo)
      }
    }

    // Configuraciones específicas por tipo
    switch (tipoEntidad) {
      case 'buses':
        // Configurar características por defecto
        objeto.features = {
          airConditioning: objeto.airConditioning || false,
          wheelchair: objeto.wheelchair || false,
          wifi: objeto.wifi || false,
          gps: objeto.gps !== undefined ? objeto.gps : true
        }
        // Limpiar campos individuales
        delete objeto.airConditioning
        delete objeto.wheelchair
        delete objeto.wifi
        delete objeto.gps
        break
        
      case 'paradas':
        // Convertir líneas separadas por comas a array
        if (objeto.lines && typeof objeto.lines === 'string') {
          objeto.lines = objeto.lines.split(',').map((s: string) => s.trim()).filter(Boolean)
        }
        break
        
      case 'tarifas':
        // Configuraciones por defecto para tarifas
        objeto.requiere_validacion = false
        objeto.rutas_aplicables = []
        objeto.fecha_inicio = new Date()
        break
    }

    return objeto
  }

  const convertirValor = (valor: string, tipo: string): any => {
    switch (tipo) {
      case 'number':
        const num = parseFloat(valor)
        if (isNaN(num)) throw new Error(`Valor '${valor}' no es un número válido`)
        return num
      case 'boolean':
        return valor.toLowerCase() === 'true' || valor === '1' || valor.toLowerCase() === 'sí'
      case 'date':
        const fecha = new Date(valor)
        if (isNaN(fecha.getTime())) throw new Error(`Valor '${valor}' no es una fecha válida`)
        return fecha
      default:
        return valor
    }
  }

  const guardarObjeto = async (objeto: any) => {
    const nombreColeccion = tipoEntidad === 'paradas' ? 'stops' :
                           tipoEntidad === 'rutas' ? 'routes' :
                           tipoEntidad === 'buses' ? 'buses' :
                           tipoEntidad === 'conductores' ? 'conductores' :
                           tipoEntidad === 'tarifas' ? 'tarifas' :
                           'trips'

    if (tipoEntidad === 'conductores' || tipoEntidad === 'tarifas') {
      // Generar ID personalizado
      const id = tipoEntidad === 'conductores' ? 
        `COND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` :
        `TARIFA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const campoId = tipoEntidad === 'conductores' ? 'id_conductor' : 'id_tarifa'
      objeto[campoId] = id
      
      await setDoc(doc(db, nombreColeccion, id), objeto)
    } else {
      await addDoc(collection(db, nombreColeccion), objeto)
    }
  }

  const descargarPlantilla = () => {
    const campos = CAMPOS_MAPEO[tipoEntidad]
    const headers = campos.map(c => c.csvField).join(',')
    const ejemplo = campos.map(c => c.ejemplo || '').join(',')
    
    const contenido = `${headers}\n${ejemplo}\n`
    
    const blob = new Blob([contenido], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plantilla_${tipoEntidad}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const limpiarFormulario = () => {
    setArchivo(null)
    setPrevisualizacion([])
    setResultado(null)
    setProgreso(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setModalAbierto(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV/TXT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar {tipoEntidad}</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV o TXT para importar múltiples registros
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plantilla */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5" />
                Plantilla de Importación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Descarga la plantilla con los campos requeridos para {tipoEntidad}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline">Campos requeridos: {CAMPOS_MAPEO[tipoEntidad].filter(c => c.required).length}</Badge>
                    <Badge variant="outline" className="ml-2">Total campos: {CAMPOS_MAPEO[tipoEntidad].length}</Badge>
                  </div>
                </div>
                <Button onClick={descargarPlantilla} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Plantilla
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Configuración del Archivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="separador">Separador de Campos</Label>
                  <Select value={separador} onValueChange={setSeparador}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Coma (,)</SelectItem>
                      <SelectItem value=";">Punto y coma (;)</SelectItem>
                      <SelectItem value="\t">Tabulación</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="archivo">Seleccionar Archivo</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Previsualización */}
          {previsualizacion.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5" />
                  Previsualización
                </CardTitle>
                <CardDescription>
                  Primeras 5 filas del archivo (incluyendo encabezados)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300">
                    <tbody>
                      {previsualizacion.map((fila, i) => (
                        <tr key={i} className={i === 0 ? 'bg-gray-100 font-medium' : ''}>
                          {fila.map((celda, j) => (
                            <td key={j} className="border border-gray-300 px-2 py-1">
                              {celda}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          {procesando && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Procesando...</span>
                    <span>{progreso}%</span>
                  </div>
                  <Progress value={progreso} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado */}
          {resultado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {resultado.estado === 'completado' ? 
                    <CheckCircle className="h-5 w-5 text-green-600" /> :
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  }
                  Resultado de la Importación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{resultado.registros_exitosos}</div>
                    <div className="text-sm text-gray-600">Exitosos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{resultado.registros_error}</div>
                    <div className="text-sm text-gray-600">Con errores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{resultado.registros_totales}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>

                {resultado.errores.length > 0 && (
                  <div className="space-y-2">
                    <Label>Errores encontrados:</Label>
                    <div className="max-h-32 overflow-y-auto border rounded p-2 bg-red-50">
                      {resultado.errores.slice(0, 10).map((error, i) => (
                        <div key={i} className="text-sm text-red-700">
                          Línea {error.linea}: {error.mensaje}
                        </div>
                      ))}
                      {resultado.errores.length > 10 && (
                        <div className="text-sm text-red-600 font-medium">
                          ... y {resultado.errores.length - 10} errores más
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setModalAbierto(false)
            limpiarFormulario()
          }}>
            {resultado ? 'Cerrar' : 'Cancelar'}
          </Button>
          {archivo && !procesando && !resultado && (
            <Button onClick={procesarArchivo}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Datos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}