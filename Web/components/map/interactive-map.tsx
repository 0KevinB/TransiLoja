"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Route } from "lucide-react"

// Leaflet imports (dynamic to avoid SSR issues)
// let L: any = null
// if (typeof window !== "undefined") {
//   L = require("leaflet")
//   require("leaflet/dist/leaflet.css")

//   // Fix for default markers
//   delete (L.Icon.Default.prototype as any)._getIconUrl
//   L.Icon.Default.mergeOptions({
//     iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
//     iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
//     shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
//   })
// }

const LOJA_COORDS = { lat: -3.99313, lng: -79.20422 }

interface MapMode {
  type: "add-stop" | "create-route" | "select-origin-dest" | "view-only"
  data?: any
}

interface InteractiveMapProps {
  mode: MapMode
  stops: any[]
  routes: any[]
  onStopAdd?: (lat: number, lng: number) => void
  onStopSelect?: (stop: any) => void
  onRouteStopSelect?: (stopId: string) => void
  selectedStops?: string[]
  className?: string
}

export function InteractiveMap({
  mode,
  stops,
  routes,
  onStopAdd,
  onStopSelect,
  onRouteStopSelect,
  selectedStops = [],
  className = "",
}: InteractiveMapProps) {
  const [L, setL] = useState<any>(null) // ← guardará Leaflet
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const polylinesRef = useRef<Map<string, any>>(new Map())
  const [tempMarker, setTempMarker] = useState<any>(null)

  /* ──────────── Cargar Leaflet dinámicamente ──────────── */
  useEffect(() => {
    if (typeof window === "undefined") return // Solo en cliente
    ;(async () => {
      const leaflet = await import("leaflet")
      await import("leaflet/dist/leaflet.css") // estilos
      // Fix iconos
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })
      setL(leaflet) // ← guardamos Leaflet
    })()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([LOJA_COORDS.lat, LOJA_COORDS.lng], 14)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Try to get user location
    map.locate({ setView: true, maxZoom: 16 })
    map.on("locationfound", (e: any) => {
      L.marker(e.latlng).addTo(map).bindPopup("¡Estás aquí!").openPopup()
    })

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [L])

  // Handle map clicks based on mode
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return

    const handleMapClick = (e: any) => {
      const { lat, lng } = e.latlng

      if (mode.type === "add-stop") {
        // Remove previous temp marker
        if (tempMarker) {
          mapInstanceRef.current.removeLayer(tempMarker)
        }

        // Add temporary marker
        const marker = L.marker([lat, lng])
          .addTo(mapInstanceRef.current)
          .bindPopup("Nueva parada - Haz clic en 'Confirmar' para guardar")
          .openPopup()

        setTempMarker(marker)
        onStopAdd?.(lat, lng)
      }
    }

    mapInstanceRef.current.on("click", handleMapClick)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off("click", handleMapClick)
      }
    }
  }, [mode, tempMarker, onStopAdd, L])

  // Render stops on map
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current.clear()

    // Add stop markers
    stops.forEach((stop) => {
      const isSelected = selectedStops.includes(stop.id)

      const marker = L.marker([stop.lat, stop.lng], {
        icon: L.icon({
          iconUrl: isSelected
            ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
            : "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${stop.name}</b><br>Líneas: ${stop.lines?.length || 0}`)

      marker.on("click", () => {
        if (mode.type === "create-route") {
          onRouteStopSelect?.(stop.id)
        } else {
          onStopSelect?.(stop)
        }
      })

      markersRef.current.set(stop.id, marker)
    })
  }, [stops, selectedStops, mode, onStopSelect, onRouteStopSelect, L])

  // Render routes on map
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return

    // Clear existing polylines
    polylinesRef.current.forEach((polyline) => {
      mapInstanceRef.current.removeLayer(polyline)
    })
    polylinesRef.current.clear()

    // Add route polylines
    routes.forEach((route) => {
      if (!route.stopIds || route.stopIds.length < 2) return

      const latLngs = route.stopIds
        .map((stopId: string) => {
          const stop = stops.find((s) => s.id === stopId)
          return stop ? [stop.lat, stop.lng] : null
        })
        .filter((coords: any) => coords !== null)

      if (latLngs.length < 2) return

      const polyline = L.polyline(latLngs, {
        color: route.color || "#3B82F6",
        weight: 4,
        opacity: 0.7,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${route.name}</b><br>Paradas: ${route.stopIds.length}`)

      polylinesRef.current.set(route.id, polyline)
    })
  }, [routes, stops, L])

  const confirmTempMarker = () => {
    if (tempMarker) {
      mapInstanceRef.current.removeLayer(tempMarker)
      setTempMarker(null)
    }
  }

  const cancelTempMarker = () => {
    if (tempMarker) {
      mapInstanceRef.current.removeLayer(tempMarker)
      setTempMarker(null)
    }
  }

  if (!L) {
    return (
      <div className={`h-96 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Cargando mapa...</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="h-96 w-full rounded-lg z-0" />

      {/* Map controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Card className="p-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs">
              {mode.type === "add-stop" && "Añadir Parada"}
              {mode.type === "create-route" && "Crear Ruta"}
              {mode.type === "select-origin-dest" && "Seleccionar Origen/Destino"}
              {mode.type === "view-only" && "Solo Vista"}
            </Badge>
          </div>
        </Card>

        {tempMarker && mode.type === "add-stop" && (
          <Card className="p-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nueva parada seleccionada</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={confirmTempMarker} className="bg-sky-500 hover:bg-sky-600">
                  Confirmar
                </Button>
                <Button size="sm" variant="outline" onClick={cancelTempMarker}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="p-3">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm">Leyenda</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-3 w-3 text-gray-600" />
              <span>Paradas ({stops.length})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Route className="h-3 w-3 text-blue-600" />
              <span>Rutas ({routes.length})</span>
            </div>
            {selectedStops.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-3 w-3 text-blue-600" />
                <span>Seleccionadas ({selectedStops.length})</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
