import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { UserLocation } from '../lib/types';

// Importación condicional para evitar errores en web
let Location: any;
if (Platform.OS !== 'web') {
  Location = require('expo-location');
}

interface LocationState {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    permissionGranted: false,
  });

  const requestPermission = useCallback(async () => {
    // En web, usar la API nativa del navegador
    if (Platform.OS === 'web') {
      try {
        if (!navigator.geolocation) {
          setState(prev => ({
            ...prev,
            error: 'Geolocalización no disponible en este navegador',
            permissionGranted: false,
          }));
          return false;
        }

        // En web, no necesitamos solicitar permisos explícitamente
        setState(prev => ({
          ...prev,
          permissionGranted: true,
          error: null,
        }));
        return true;
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Error al verificar permisos de ubicación',
          permissionGranted: false,
        }));
        return false;
      }
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      
      setState(prev => ({
        ...prev,
        permissionGranted: granted,
        error: granted ? null : 'Permisos de ubicación denegados',
      }));

      return granted;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error al solicitar permisos de ubicación',
        permissionGranted: false,
      }));
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (options?: {
    accuracy?: any;
    timeout?: number;
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    // En web, usar la API nativa del navegador
    if (Platform.OS === 'web') {
      try {
        if (!navigator.geolocation) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Geolocalización no disponible',
          }));
          return null;
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: options?.timeout || 15000,
              maximumAge: 60000,
            }
          );
        });

        const userLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        setState(prev => ({
          ...prev,
          location: userLocation,
          loading: false,
          error: null,
          permissionGranted: true,
        }));

        return userLocation;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al obtener ubicación';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return null;
      }
    }

    try {
      // Verificar permisos en móvil
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Permisos de ubicación requeridos',
          }));
          return null;
        }
      }

      // Obtener ubicación en móvil
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: options?.accuracy || Location.Accuracy.Balanced,
        timeInterval: options?.timeout || 15000,
      });

      const userLocation: UserLocation = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        accuracy: locationResult.coords.accuracy || undefined,
        timestamp: locationResult.timestamp,
      };

      setState(prev => ({
        ...prev,
        location: userLocation,
        loading: false,
        error: null,
        permissionGranted: true,
      }));

      return userLocation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener ubicación';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [requestPermission]);

  const watchLocation = useCallback(async (callback: (location: UserLocation) => void) => {
    // En web, usar la API nativa del navegador
    if (Platform.OS === 'web') {
      try {
        if (!navigator.geolocation) {
          throw new Error('Geolocalización no disponible');
        }

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const userLocation: UserLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            };

            setState(prev => ({
              ...prev,
              location: userLocation,
              permissionGranted: true,
            }));

            callback(userLocation);
          },
          (error) => {
            setState(prev => ({
              ...prev,
              error: error.message,
            }));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );

        return {
          remove: () => navigator.geolocation.clearWatch(watchId),
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al iniciar seguimiento';
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }));
        return null;
      }
    }

    try {
      // Verificar permisos en móvil
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Permisos de ubicación requeridos');
        }
      }

      // Iniciar seguimiento en móvil
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // Actualizar cada 5 segundos
          distanceInterval: 10, // O cada 10 metros
        },
        (locationResult) => {
          const userLocation: UserLocation = {
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude,
            accuracy: locationResult.coords.accuracy || undefined,
            timestamp: locationResult.timestamp,
          };

          setState(prev => ({
            ...prev,
            location: userLocation,
            permissionGranted: true,
          }));

          callback(userLocation);
        }
      );

      return subscription;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar seguimiento';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      return null;
    }
  }, [requestPermission]);

  const clearLocation = useCallback(() => {
    setState({
      location: null,
      loading: false,
      error: null,
      permissionGranted: false,
    });
  }, []);

  // Verificar permisos al inicio
  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'web') {
        // En web, verificamos si geolocation está disponible
        setState(prev => ({
          ...prev,
          permissionGranted: !!navigator.geolocation,
        }));
        return;
      }

      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setState(prev => ({
          ...prev,
          permissionGranted: status === 'granted',
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          permissionGranted: false,
        }));
      }
    };

    checkPermissions();
  }, []);

  return {
    ...state,
    requestPermission,
    getCurrentLocation,
    watchLocation,
    clearLocation,
  };
};