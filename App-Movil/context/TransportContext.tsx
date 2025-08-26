import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, query, where, onSnapshot, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Parada, Ruta, Bus, Alerta, Municipio } from '../lib/types';

interface TransportContextType {
  paradas: Parada[];
  rutas: Ruta[];
  buses: Bus[];
  alertas: Alerta[];
  municipio: Municipio | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  forceRefresh: () => Promise<void>; // Forzar recarga manual
  getBusesEnRuta: (rutaId: string) => Bus[];
  getParadasCercanas: (lat: number, lng: number, radius?: number) => Parada[];
  getAlertasActivas: () => Alerta[];
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

interface TransportProviderProps {
  children: ReactNode;
  municipioId?: string;
}

export const TransportProvider: React.FC<TransportProviderProps> = ({ 
  children, 
  municipioId = process.env.EXPO_PUBLIC_MUNICIPALITY_ID || 'loja' 
}) => {
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [municipio, setMunicipio] = useState<Municipio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); // Flag para evitar cargas múltiples

  // Inicializar datos solo una vez
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 INICIALIZANDO TRANSPORT PROVIDER');
      loadData();
    }
  }, []); // Solo ejecutar una vez al montar el componente

  const loadMunicipio = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const database = db();
      const municipioQuery = query(
        collection(database, 'municipios'),
        where('codigo', '==', municipioId),
        limit(1)
      );
      const municipioSnapshot = await getDocs(municipioQuery);
      
      if (!municipioSnapshot.empty) {
        const municipioDoc = municipioSnapshot.docs[0];
        const data = municipioDoc.data();
        setMunicipio({
          id: municipioDoc.id,
          nombre: data.nombre,
          codigo: data.codigo,
          configuracion: data.configuracion,
          activo: data.activo,
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        });
      }
    } catch (err) {
      console.error('Error loading municipio:', err);
      setError('Error al cargar datos del municipio');
    }
  };

  const subscribeToTransportData = () => {
    const unsubscribeFunctions: Array<() => void> = [];

    // Suscripción a paradas
    const paradasQuery = query(
      collection(db(), 'paradas'),
      where('municipio_id', '==', municipioId),
      where('activa', '==', true)
    );
    
    const unsubscribeParadas = onSnapshot(paradasQuery, (snapshot) => {
      const paradasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
      })) as Parada[];
      setParadas(paradasData);
    }, (err) => {
      console.error('Error subscribing to paradas:', err);
      setError('Error al cargar paradas');
    });
    unsubscribeFunctions.push(unsubscribeParadas);

    // Suscripción a rutas
    const rutasQuery = query(
      collection(db(), 'rutas'),
      where('municipio_id', '==', municipioId),
      where('activa', '==', true)
    );
    
    const unsubscribeRutas = onSnapshot(rutasQuery, (snapshot) => {
      const rutasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
      })) as Ruta[];
      setRutas(rutasData);
    }, (err) => {
      console.error('Error subscribing to rutas:', err);
      setError('Error al cargar rutas');
    });
    unsubscribeFunctions.push(unsubscribeRutas);

    // Suscripción a buses
    const busesQuery = query(
      collection(db(), 'buses'),
      where('municipio_id', '==', municipioId),
      where('estado', '==', 'activo')
    );
    
    const unsubscribeBuses = onSnapshot(busesQuery, (snapshot) => {
      const busesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
        ubicacion_actual: doc.data().ubicacion_actual ? {
          ...doc.data().ubicacion_actual,
          timestamp: doc.data().ubicacion_actual.timestamp?.toDate() || new Date(),
        } : undefined,
      })) as Bus[];
      setBuses(busesData);
    }, (err) => {
      console.error('Error subscribing to buses:', err);
      setError('Error al cargar buses');
    });
    unsubscribeFunctions.push(unsubscribeBuses);

    // Suscripción a alertas
    const alertasQuery = query(
      collection(db(), 'alertas'),
      where('municipio_id', '==', municipioId),
      where('activa', '==', true),
      orderBy('created_at', 'desc')
    );
    
    const unsubscribeAlertas = onSnapshot(alertasQuery, (snapshot) => {
      const alertasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha_inicio: doc.data().fecha_inicio?.toDate() || new Date(),
        fecha_fin: doc.data().fecha_fin?.toDate(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
      })) as Alerta[];
      setAlertas(alertasData);
    }, (err) => {
      console.error('Error subscribing to alertas:', err);
      setError('Error al cargar alertas');
    });
    unsubscribeFunctions.push(unsubscribeAlertas);

    setLoading(false);

    // Función de limpieza
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    console.log('=== INICIANDO CARGA DE DATOS ===');
    
    try {
      const database = db();
      
      // Cargar paradas - Sin filtro de municipio como en el dashboard web
      console.log('Cargando paradas...');
      const paradasSnapshot = await getDocs(collection(database, 'stops'));
      const paradasData = paradasSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          id_parada: doc.id,
          nombre: data.name,
          lat: data.lat,
          lng: data.lng,
          coordenadas: { lat: data.lat, lng: data.lng },
          es_punto_conexion: data.isTransferPoint || false,
          activa: true,
          created_at: data.createdAt?.toDate() || new Date(),
          updated_at: data.updatedAt?.toDate() || new Date(),
        };
      }) as Parada[];
      setParadas(paradasData);
      console.log(`Cargadas ${paradasData.length} paradas`);

      // Cargar rutas - Sin filtro de municipio como en el dashboard web
      console.log('Cargando rutas...');
      const rutasSnapshot = await getDocs(collection(database, 'routes'));
      const rutasData = rutasSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          id_ruta: doc.id,
          nombre_corto: data.name,
          nombre_largo: data.description || data.name,
          color: data.color || '#3B82F6',
          stopIds: data.stopIds || [],
          created_at: data.createdAt?.toDate() || new Date(),
          updated_at: data.updatedAt?.toDate() || new Date(),
        };
      }) as Ruta[];
      setRutas(rutasData);
      console.log(`Cargadas ${rutasData.length} rutas`);

      // Cargar buses - Sin filtro de municipio
      console.log('Cargando buses...');
      const busesSnapshot = await getDocs(collection(database, 'buses'));
      const busesData = busesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          numero_placa: data.licensePlate || data.plateNumber,
          estado: data.status || 'activo',
          coordenadas_actuales: data.currentLocation ? {
            lat: data.currentLocation.lat,
            lng: data.currentLocation.lng
          } : null,
          ruta_asignada: data.assignedRoute,
          created_at: data.createdAt?.toDate() || new Date(),
          updated_at: data.updatedAt?.toDate() || new Date(),
        };
      }) as Bus[];
      setBuses(busesData);
      console.log(`Cargados ${busesData.length} buses`);

      // Cargar alertas - Sin filtro de municipio
      console.log('Cargando alertas...');
      const alertasSnapshot = await getDocs(collection(database, 'alerts'));
      const alertasData = alertasSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.title,
          mensaje: data.message,
          activa: data.active !== false,
          fecha_inicio: data.startDate?.toDate() || new Date(),
          fecha_fin: data.endDate?.toDate(),
          created_at: data.createdAt?.toDate() || new Date(),
          updated_at: data.updatedAt?.toDate() || new Date(),
        };
      }) as Alerta[];
      setAlertas(alertasData);
      console.log(`Cargadas ${alertasData.length} alertas`);

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos del transporte');
    } finally {
      console.log('=== FINALIZANDO CARGA DE DATOS ===');
      setLoading(false);
      setIsInitialized(true); // Marcar como inicializado
    }
  };

  const refreshData = async () => {
    if (loading) {
      console.log('⚠️ refreshData: Ya hay una carga en progreso, ignorando');
      return;
    }
    console.log('🔄 refreshData: Recargando datos manualmente');
    await loadData();
  };

  const forceRefresh = async () => {
    console.log('🔄 FORZANDO RECARGA MANUAL');
    await loadData();
  };

  const getBusesEnRuta = (rutaId: string): Bus[] => {
    return buses.filter(bus => bus.ruta_asignada === rutaId);
  };

  const getParadasCercanas = (lat: number, lng: number, radius: number = 1000): Parada[] => {
    // Función para calcular distancia entre dos puntos (fórmula de Haversine simplificada)
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371e3; // Radio de la Tierra en metros
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lng2 - lng1) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c;
    };

    return paradas
      .filter(parada => {
        const paraLat = parada.coordenadas?.lat || parada.lat || 0;
        const paraLng = parada.coordenadas?.lng || parada.lng || 0;
        const distance = calculateDistance(lat, lng, paraLat, paraLng);
        return distance <= radius;
      })
      .sort((a, b) => {
        const aLat = a.coordenadas?.lat || a.lat || 0;
        const aLng = a.coordenadas?.lng || a.lng || 0;
        const bLat = b.coordenadas?.lat || b.lat || 0;
        const bLng = b.coordenadas?.lng || b.lng || 0;
        const distanceA = calculateDistance(lat, lng, aLat, aLng);
        const distanceB = calculateDistance(lat, lng, bLat, bLng);
        return distanceA - distanceB;
      });
  };

  const getAlertasActivas = (): Alerta[] => {
    const now = new Date();
    return alertas.filter(alerta => {
      if (!alerta.activa) return false;
      if (alerta.fecha_inicio > now) return false;
      if (alerta.fecha_fin && alerta.fecha_fin < now) return false;
      return true;
    });
  };

  return (
    <TransportContext.Provider value={{
      paradas,
      rutas,
      buses,
      alertas,
      municipio,
      loading,
      error,
      refreshData,
      forceRefresh,
      getBusesEnRuta,
      getParadasCercanas,
      getAlertasActivas,
    }}>
      {children}
    </TransportContext.Provider>
  );
};

export const useTransport = (): TransportContextType => {
  const context = useContext(TransportContext);
  if (context === undefined) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
};