# Sistema de Configuración de Usuario - TransiLoja Mobile

## ✅ Funcionalidades Implementadas

### 1. Sistema de Temas
- **Modo Claro**: Tema ligero con buena legibilidad
- **Modo Oscuro**: Tema oscuro para condiciones de poca luz  
- **Alto Contraste**: Tema de alta accesibilidad para usuarios con discapacidades visuales
- Sincronización automática con Firebase
- Persistencia local con AsyncStorage como respaldo

### 2. Tamaño de Fuente Adaptable
- **Pequeño (0.8x)**: Para preferencias de texto compacto
- **Normal (1.0x)**: Tamaño estándar
- **Grande (1.2x)**: Para mejor legibilidad
- **Muy Grande (1.5x)**: Para máxima accesibilidad
- Respeta la configuración de accesibilidad del sistema
- Aplicación automática en todos los componentes de texto

### 3. Edición de Perfil Completa
- ✅ Edición de información personal (nombre, email)
- ✅ Configuración de ubicación por defecto
- ✅ Configuración de notificaciones (activar/desactivar)
- ✅ Configuración de permisos de ubicación
- ✅ Selección de tema integrada en el modal
- ✅ Selección de tamaño de fuente integrada
- ✅ Validación completa de formularios
- ✅ Manejo robusto de errores

### 4. Función de Cerrar Sesión
- ✅ Confirmación de seguridad antes del logout
- ✅ Limpieza correcta del estado de autenticación
- ✅ Redirección automática a la pantalla de login
- ✅ Mensaje informativo sobre pérdida de datos

### 5. Persistencia en Firebase
- ✅ Todas las configuraciones se guardan automáticamente en Firestore
- ✅ Estructura de datos: `users/{uid}/preferences`
- ✅ Sincronización automática al cargar el perfil
- ✅ Manejo de estados offline/online
- ✅ Validación de tipos TypeScript

## 🔧 Arquitectura Técnica

### Contextos
- **AuthContext**: Gestión de autenticación y perfil de usuario
- **ThemeContext**: Gestión de temas y configuraciones visuales
- **UserPreferencesSync**: Componente de sincronización automática

### Hooks Personalizados
- **useUserPreferences**: Hook principal para gestión de preferencias
- **useAccessibleFont**: Hook para gestión de tamaños de fuente accesibles
- **useTheme**: Hook para acceso al tema actual

### Componentes Clave
- **EditProfileModal**: Modal completo de edición de perfil
- **UserPreferencesSync**: Sincronización automática de preferencias
- **ThemedText**: Componente de texto que respeta fontScale
- **ThemedButton/ThemedView**: Componentes que respetan el tema

### Estructura de Datos en Firebase
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  preferences: {
    language: 'es' | 'en';
    notifications: boolean;
    theme: 'light' | 'dark' | 'high-contrast' | 'system';
    fontScale: number;
    location: boolean;
    defaultLocation?: {
      lat: number;
      lng: number;
      name: string;
    };
  };
  favoriteStops: string[];
  favoriteRoutes: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

## 🎯 Características de Accesibilidad

### Contraste de Colores
- **Modo Claro**: Contraste WCAG AA compliant
- **Modo Oscuro**: Colores optimizados para poca luz
- **Alto Contraste**: Máximo contraste para accesibilidad

### Tipografía
- Tamaños de fuente escalables
- Altura de línea optimizada (1.6x)
- Respeto por configuraciones del sistema
- Límites de escala (0.8x - 3.0x)

### Interacción
- Tamaños de toque mínimos de 44dp
- Feedback táctil en botones importantes
- Navegación clara con confirmaciones

## 🔄 Flujo de Sincronización

1. **Carga Inicial**: UserPreferencesSync detecta cambios en userProfile
2. **Aplicación Local**: Configuraciones se aplican inmediatamente al tema
3. **Persistencia**: Cambios se guardan en Firebase automáticamente
4. **Respaldo Local**: AsyncStorage mantiene configuraciones offline

## 🚀 Uso en la Aplicación

### En pantalla de perfil (profile.tsx):
- Pestaña "Ajustes" con todas las configuraciones
- Switches para notificaciones y ubicación
- Selectores para tema y tamaño de fuente

### En modal de edición (EditProfileModal.tsx):
- Sección completa de preferencias
- Integración de configuraciones visuales
- Aplicación inmediata de cambios

### Configuración global:
- Sincronización automática en _layout.tsx
- Aplicación del tema en toda la navegación
- StatusBar adaptativa al tema

## 📱 Estados de la Aplicación

### Usuario Autenticado:
- Acceso completo a todas las configuraciones
- Sincronización automática con Firebase
- Persistencia de preferencias

### Usuario Invitado:
- Configuraciones básicas disponibles
- Solo persistencia local
- Promoción para crear cuenta

### Offline:
- Configuraciones se mantienen localmente
- Sincronización automática al reconectar
- No pérdida de configuraciones