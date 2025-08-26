// Sistema de mensajes de error amigables para Firebase y otras APIs

export interface FriendlyError {
  title: string;
  message: string;
  suggestion?: string;
  category: 'auth' | 'network' | 'data' | 'location' | 'general';
}

// Mapeo de errores de Firebase Auth
const firebaseAuthErrors: Record<string, FriendlyError> = {
  'auth/invalid-email': {
    title: 'Correo electrónico inválido',
    message: 'El formato del correo electrónico no es válido. Por favor verifica que esté escrito correctamente.',
    suggestion: 'Ejemplo: usuario@ejemplo.com',
    category: 'auth'
  },
  'auth/user-disabled': {
    title: 'Cuenta deshabilitada',
    message: 'Tu cuenta ha sido deshabilitada por un administrador.',
    suggestion: 'Contacta al soporte técnico para más información.',
    category: 'auth'
  },
  'auth/user-not-found': {
    title: 'Usuario no encontrado',
    message: 'No existe una cuenta con este correo electrónico.',
    suggestion: 'Verifica el correo o regístrate si aún no tienes una cuenta.',
    category: 'auth'
  },
  'auth/wrong-password': {
    title: 'Contraseña incorrecta',
    message: 'La contraseña que ingresaste no es correcta.',
    suggestion: 'Verifica tu contraseña o usa "¿Olvidaste tu contraseña?" si no la recuerdas.',
    category: 'auth'
  },
  'auth/email-already-in-use': {
    title: 'Correo ya registrado',
    message: 'Ya existe una cuenta con este correo electrónico.',
    suggestion: 'Intenta iniciar sesión o usa un correo diferente.',
    category: 'auth'
  },
  'auth/weak-password': {
    title: 'Contraseña muy débil',
    message: 'La contraseña debe tener al menos 6 caracteres.',
    suggestion: 'Usa una contraseña más segura con letras, números y símbolos.',
    category: 'auth'
  },
  'auth/too-many-requests': {
    title: 'Demasiados intentos',
    message: 'Has realizado demasiados intentos de inicio de sesión.',
    suggestion: 'Espera unos minutos antes de intentar nuevamente.',
    category: 'auth'
  },
  'auth/network-request-failed': {
    title: 'Error de conexión',
    message: 'No se pudo conectar con el servidor.',
    suggestion: 'Verifica tu conexión a internet e intenta nuevamente.',
    category: 'network'
  },
  'auth/requires-recent-login': {
    title: 'Reautenticación requerida',
    message: 'Por seguridad, necesitas iniciar sesión nuevamente.',
    suggestion: 'Cierra sesión e inicia sesión otra vez.',
    category: 'auth'
  },
  'auth/invalid-credential': {
    title: 'Credenciales inválidas',
    message: 'El correo o la contraseña son incorrectos.',
    suggestion: 'Verifica tus datos e intenta nuevamente.',
    category: 'auth'
  },
};

// Errores de Firestore
const firestoreErrors: Record<string, FriendlyError> = {
  'permission-denied': {
    title: 'Sin permisos',
    message: 'No tienes permisos para realizar esta acción.',
    suggestion: 'Inicia sesión o contacta al administrador.',
    category: 'auth'
  },
  'not-found': {
    title: 'Datos no encontrados',
    message: 'La información solicitada no fue encontrada.',
    suggestion: 'Verifica que los datos existan o intenta actualizar.',
    category: 'data'
  },
  'already-exists': {
    title: 'Datos duplicados',
    message: 'Los datos que intentas crear ya existen.',
    suggestion: 'Usa información diferente o actualiza los datos existentes.',
    category: 'data'
  },
  'resource-exhausted': {
    title: 'Límite excedido',
    message: 'Se ha excedido el límite de uso del servicio.',
    suggestion: 'Intenta nuevamente en unos minutos.',
    category: 'network'
  },
  'failed-precondition': {
    title: 'Condición no cumplida',
    message: 'No se pueden realizar cambios en el estado actual.',
    suggestion: 'Actualiza la información e intenta nuevamente.',
    category: 'data'
  },
  'aborted': {
    title: 'Operación cancelada',
    message: 'La operación fue cancelada por un conflicto.',
    suggestion: 'Intenta nuevamente en unos momentos.',
    category: 'data'
  },
  'out-of-range': {
    title: 'Fuera de rango',
    message: 'Los valores proporcionados están fuera del rango permitido.',
    suggestion: 'Verifica los datos e intenta con valores válidos.',
    category: 'data'
  },
  'unimplemented': {
    title: 'Función no disponible',
    message: 'Esta función aún no está disponible.',
    suggestion: 'Intenta más tarde o usa una función alternativa.',
    category: 'general'
  },
  'internal': {
    title: 'Error interno',
    message: 'Ha ocurrido un error interno del servidor.',
    suggestion: 'Intenta nuevamente. Si persiste, contacta al soporte.',
    category: 'general'
  },
  'unavailable': {
    title: 'Servicio no disponible',
    message: 'El servicio no está disponible temporalmente.',
    suggestion: 'Intenta nuevamente en unos minutos.',
    category: 'network'
  },
  'deadline-exceeded': {
    title: 'Tiempo agotado',
    message: 'La operación tardó demasiado tiempo.',
    suggestion: 'Verifica tu conexión e intenta nuevamente.',
    category: 'network'
  },
};

// Errores de ubicación
const locationErrors: Record<string, FriendlyError> = {
  'PERMISSION_DENIED': {
    title: 'Permisos de ubicación denegados',
    message: 'La aplicación necesita acceso a tu ubicación para funcionar correctamente.',
    suggestion: 'Ve a configuración y permite el acceso a la ubicación.',
    category: 'location'
  },
  'POSITION_UNAVAILABLE': {
    title: 'Ubicación no disponible',
    message: 'No se pudo determinar tu ubicación actual.',
    suggestion: 'Verifica que el GPS esté activado e intenta en un área abierta.',
    category: 'location'
  },
  'TIMEOUT': {
    title: 'Tiempo agotado para ubicación',
    message: 'Tardó demasiado tiempo en obtener tu ubicación.',
    suggestion: 'Verifica tu conexión y que el GPS esté activado.',
    category: 'location'
  },
};

// Errores generales de red
const networkErrors: Record<string, FriendlyError> = {
  'NETWORK_ERROR': {
    title: 'Error de red',
    message: 'No se pudo conectar a internet.',
    suggestion: 'Verifica tu conexión a internet e intenta nuevamente.',
    category: 'network'
  },
  'TIMEOUT_ERROR': {
    title: 'Tiempo de espera agotado',
    message: 'La conexión tardó demasiado tiempo.',
    suggestion: 'Verifica tu conexión e intenta nuevamente.',
    category: 'network'
  },
  'SERVER_ERROR': {
    title: 'Error del servidor',
    message: 'El servidor está experimentando problemas.',
    suggestion: 'Intenta nuevamente en unos minutos.',
    category: 'network'
  },
};

// Error por defecto
const defaultError: FriendlyError = {
  title: 'Error inesperado',
  message: 'Ha ocurrido un error inesperado.',
  suggestion: 'Intenta nuevamente. Si el problema persiste, contacta al soporte.',
  category: 'general'
};

/**
 * Convierte un error técnico en un mensaje amigable para el usuario
 */
export function getFriendlyError(error: any): FriendlyError {
  if (!error) return defaultError;

  // Si ya es un FriendlyError, devolverlo tal como está
  if (error.title && error.message && error.category) {
    return error as FriendlyError;
  }

  let errorCode = '';
  
  // Extraer código de error según el tipo
  if (error.code) {
    errorCode = error.code;
  } else if (error.message) {
    // Intentar extraer código de Firebase del mensaje
    const firebaseMatch = error.message.match(/\(([^)]+)\)/);
    if (firebaseMatch) {
      errorCode = firebaseMatch[1];
    }
  }

  // Buscar en los mapas de errores
  if (firebaseAuthErrors[errorCode]) {
    return firebaseAuthErrors[errorCode];
  }
  
  if (firestoreErrors[errorCode]) {
    return firestoreErrors[errorCode];
  }
  
  if (locationErrors[errorCode]) {
    return locationErrors[errorCode];
  }
  
  if (networkErrors[errorCode]) {
    return networkErrors[errorCode];
  }

  // Errores específicos por tipo de mensaje
  if (error.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return networkErrors['NETWORK_ERROR'];
    }
    
    if (message.includes('timeout')) {
      return networkErrors['TIMEOUT_ERROR'];
    }
    
    if (message.includes('permission') || message.includes('denied')) {
      return {
        title: 'Permisos denegados',
        message: 'No tienes los permisos necesarios para realizar esta acción.',
        suggestion: 'Verifica los permisos de la aplicación en configuración.',
        category: 'auth'
      };
    }
  }

  // Si no se encuentra un error específico, devolver el error por defecto
  // pero con el mensaje original si está disponible
  return {
    ...defaultError,
    message: error.message || defaultError.message,
  };
}

/**
 * Obtiene un mensaje corto para mostrar en notificaciones o alerts
 */
export function getShortErrorMessage(error: any): string {
  const friendlyError = getFriendlyError(error);
  return friendlyError.message;
}

/**
 * Obtiene el título del error para usar en diálogos
 */
export function getErrorTitle(error: any): string {
  const friendlyError = getFriendlyError(error);
  return friendlyError.title;
}

/**
 * Obtiene una sugerencia de solución si está disponible
 */
export function getErrorSuggestion(error: any): string | undefined {
  const friendlyError = getFriendlyError(error);
  return friendlyError.suggestion;
}