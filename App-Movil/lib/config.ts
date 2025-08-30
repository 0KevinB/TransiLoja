import { Platform } from 'react-native';

// Configuración de Firebase
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validar configuración de Firebase
export const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error('Faltan las siguientes variables de entorno de Firebase:', missingFields);
    console.error('Asegúrate de que el archivo .env contenga todas las variables necesarias.');
    return false;
  }

  return true;
};

// Configuración de la aplicación
export const appConfig = {
  municipalityName: process.env.EXPO_PUBLIC_MUNICIPALITY_NAME || 'Loja',
  primaryColor: process.env.EXPO_PUBLIC_PRIMARY_COLOR || '#1E40AF',
  secondaryColor: process.env.EXPO_PUBLIC_SECONDARY_COLOR || '#3B82F6',
  accentColor: process.env.EXPO_PUBLIC_ACCENT_COLOR || '#60A5FA',
  logoUrl: process.env.EXPO_PUBLIC_LOGO_URL,
};

// Configuración específica por plataforma
export const platformConfig = {
  isWeb: Platform.OS === 'web',
  isMobile: Platform.OS !== 'web',
  platform: Platform.OS,
};