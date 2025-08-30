import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, validateFirebaseConfig } from './config';

// Validar configuración antes de inicializar
if (!validateFirebaseConfig()) {
  console.error('Configuración de Firebase incompleta');
  throw new Error('Configuración de Firebase incompleta');
}

// Inicialización rápida y eficiente
const app = initializeApp(firebaseConfig);

// Inicializar solo Auth de manera síncrona, el resto lazy
let auth: any;

try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    // Para React Native, usar getAuth directamente (ya incluye persistencia)
    auth = getAuth(app);
  }
} catch (error) {
  console.warn('Auth ya inicializado o error:', error);
  // Intentar obtener instancia existente
  try {
    auth = getAuth(app);
  } catch (fallbackError) {
    console.error('Error crítico inicializando Auth:', fallbackError);
    auth = null;
  }
}

// Lazy loading para servicios no críticos
let db: any = null;
let storage: any = null;

const getDB = () => {
  if (!db) {
    db = getFirestore(app);
  }
  return db;
};

const getStorageService = () => {
  if (!storage) {
    storage = getStorage(app);
  }
  return storage;
};

// Solo exportar auth directamente, los otros como getters lazy
export { auth };
export { getDB as db, getStorageService as storage };
export default app;