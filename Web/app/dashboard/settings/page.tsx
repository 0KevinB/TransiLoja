"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { InteractiveMap } from "@/components/map/interactive-map"
import { Settings, User, MapPin, Bell, Palette, Globe, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    language: "es",
    notifications: true,
    theme: "system",
    defaultLocation: null as { lat: number; lng: number; name: string } | null,
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        language: user.preferences?.language || "es",
        notifications: user.preferences?.notifications ?? true,
        theme: user.preferences?.theme || "system",
        defaultLocation: user.preferences?.defaultLocation || null,
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      await updateDoc(doc(db, "users", user.id), {
        name: formData.name,
        preferences: {
          language: formData.language,
          notifications: formData.notifications,
          theme: formData.theme,
          defaultLocation: formData.defaultLocation,
        },
        updatedAt: new Date(),
      })

      toast({
        title: "Configuración guardada",
        description: "Tus preferencias han sido actualizadas correctamente",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      defaultLocation: {
        lat,
        lng,
        name: `Ubicación (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      },
    })
  }

  const clearDefaultLocation = () => {
    setFormData({
      ...formData,
      defaultLocation: null,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Personaliza tu experiencia en TransiLoja</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>Actualiza tu información básica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">El correo no se puede modificar</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <div>
                <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
                  {user?.role === "admin" ? "Administrador" : "Usuario"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferencias de la Aplicación
            </CardTitle>
            <CardDescription>Configura cómo quieres usar TransiLoja</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Idioma
                </Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value as "es" | "en" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Tema
                </Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value) => setFormData({ ...formData, theme: value as "light" | "dark" | "system" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaciones
                </Label>
                <p className="text-sm text-gray-500">Recibir alertas sobre el servicio de transporte</p>
              </div>
              <Switch
                checked={formData.notifications}
                onCheckedChange={(checked) => setFormData({ ...formData, notifications: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación Predeterminada
            </CardTitle>
            <CardDescription>
              Selecciona una ubicación predeterminada para búsquedas de rutas más rápidas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.defaultLocation && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-sky-900">Ubicación guardada</p>
                    <p className="text-xs text-sky-700">{formData.defaultLocation.name}</p>
                    <p className="text-xs text-sky-600">
                      {formData.defaultLocation.lat.toFixed(4)}, {formData.defaultLocation.lng.toFixed(4)}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={clearDefaultLocation}>
                    Eliminar
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Seleccionar en el mapa</Label>
              <p className="text-sm text-gray-500">Haz clic en el mapa para establecer tu ubicación predeterminada</p>
              <InteractiveMap
                mode={{ type: "add-stop" }}
                stops={[]}
                routes={[]}
                onStopAdd={handleLocationSelect}
                className="h-64"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="bg-sky-500 hover:bg-sky-600">
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
