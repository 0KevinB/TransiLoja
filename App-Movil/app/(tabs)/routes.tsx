import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { useTransport } from '../../context/TransportContext';
import { useLocation } from '../../hooks/useLocation';
import { useTabBarPadding } from '../../hooks/useTabBarPadding';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedTextInput } from '../../components/ui/ThemedTextInput';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { MapComponent } from '../../components/MapView';
import { RAPTORAlgorithm } from '../../lib/raptor';
import type { RutaOptima, SegmentoViaje } from '../../lib/types';

interface TripPlan {
  origin: { latitude: number; longitude: number; name?: string };
  destination: { latitude: number; longitude: number; name?: string };
  routes?: RutaOptima[];
  selectedRoute?: RutaOptima;
}

export default function RoutesScreen() {
  const { paradas, rutas, buses, loading } = useTransport();
  const { location, getCurrentLocation } = useLocation();
  const tabBarPadding = useTabBarPadding();
  const { getPaddingScaled, getMarginScaled, getMinTouchTarget } = useAccessibleFont();
  
  const [tripPlan, setTripPlan] = useState<TripPlan>({
    origin: { latitude: 0, longitude: 0 },
    destination: { latitude: 0, longitude: 0 }
  });
  
  const [mapMode, setMapMode] = useState<'view' | 'select-origin' | 'select-destination'>('view');
  const [planning, setPlanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');

  // Configurar origen como ubicación actual al cargar
  useEffect(() => {
    if (location && tripPlan.origin.latitude === 0) {
      setTripPlan(prev => ({
        ...prev,
        origin: {
          latitude: location.latitude,
          longitude: location.longitude,
          name: 'Mi ubicación'
        }
      }));
      setOriginAddress('Mi ubicación actual');
    }
  }, [location, tripPlan.origin.latitude]);

  const handleOriginSelect = (coordinate: { latitude: number; longitude: number }) => {
    setTripPlan(prev => ({
      ...prev,
      origin: { ...coordinate, name: 'Origen seleccionado' }
    }));
    setOriginAddress(`${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`);
    setMapMode('view');
    setShowMap(false);
  };

  const handleDestinationSelect = (coordinate: { latitude: number; longitude: number }) => {
    setTripPlan(prev => ({
      ...prev,
      destination: { ...coordinate, name: 'Destino seleccionado' }
    }));
    setDestinationAddress(`${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`);
    setMapMode('view');
    setShowMap(false);
  };

  const useCurrentLocation = async () => {
    try {
      await getCurrentLocation();
      if (location) {
        setTripPlan(prev => ({
          ...prev,
          origin: {
            latitude: location.latitude,
            longitude: location.longitude,
            name: 'Mi ubicación'
          }
        }));
        setOriginAddress('Mi ubicación actual');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    }
  };

  const planTrip = async () => {
    if (!tripPlan.origin.latitude || !tripPlan.destination.latitude) {
      Alert.alert('Error', 'Debes seleccionar origen y destino');
      return;
    }

    if (paradas.length === 0 || rutas.length === 0) {
      Alert.alert('Error', 'No hay datos de transporte cargados');
      return;
    }

    setPlanning(true);
    
    try {
      // Crear instancia del algoritmo RAPTOR
      const raptor = new RAPTORAlgorithm(paradas, rutas, buses);
      
      // Buscar rutas óptimas
      const routes = raptor.encontrarRutaOptima(
        tripPlan.origin.latitude,
        tripPlan.origin.longitude,
        tripPlan.destination.latitude,
        tripPlan.destination.longitude,
        new Date()
      );

      setTripPlan(prev => ({
        ...prev,
        routes,
        selectedRoute: routes[0] || undefined
      }));
      
      setShowResults(true);
      
      if (routes.length === 0) {
        Alert.alert('Sin resultados', 'No se encontraron rutas disponibles para este trayecto');
      }
    } catch (error) {
      console.error('Error planning trip:', error);
      Alert.alert('Error', 'No se pudo planificar el viaje. Inténtalo de nuevo.');
    } finally {
      setPlanning(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const renderSegment = (segment: SegmentoViaje, index: number) => (
    <Card key={index} style={styles.segmentCard}>
      <ThemedView style={styles.segmentHeader}>
        <Icon 
          name={segment.tipo === 'caminar' ? 'directions-walk' : 'directions-bus'} 
          size={20}
          color={segment.tipo === 'caminar' ? 'accent' : 'primary'}
        />
        <ThemedText variant="subtitle" weight="semibold">
          {segment.tipo === 'caminar' ? 'Caminar' : 'Bus'}
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary">
          {formatTime(segment.duracion_seg || (segment.tiempo_fin - segment.tiempo_inicio))}
        </ThemedText>
      </ThemedView>
      
      {segment.instrucciones && (
        <ThemedText variant="body" style={styles.segmentInstructions}>
          {segment.instrucciones}
        </ThemedText>
      )}
      
      {segment.distancia_metros && (
        <ThemedText variant="caption" color="textSecondary">
          Distancia: {Math.round(segment.distancia_metros)}m
        </ThemedText>
      )}
    </Card>
  );

  const renderRouteOption = (route: RutaOptima, index: number) => (
    <Card 
      key={index} 
      style={[
        styles.routeCard,
        tripPlan.selectedRoute === route && styles.selectedRouteCard
      ]}
      onPress={() => setTripPlan(prev => ({ ...prev, selectedRoute: route }))}
    >
      <ThemedView style={styles.routeHeader}>
        <ThemedText variant="subtitle" weight="semibold">
          Opción {index + 1}
        </ThemedText>
        <ThemedView style={styles.routeStats}>
          <ThemedText variant="body" color="primary" weight="bold">
            {formatTime(route.tiempo_total_seg || route.tiempo_total)}
          </ThemedText>
          {route.numero_transbordos > 0 && (
            <ThemedText variant="caption" color="textSecondary">
              {route.numero_transbordos} transbordo{route.numero_transbordos > 1 ? 's' : ''}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
      
      {route.distancia_caminata && (
        <ThemedText variant="caption" color="textSecondary">
          Caminata total: {Math.round(route.distancia_caminata)}m
        </ThemedText>
      )}
    </Card>
  );

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      {showMap ? (
        // Pantalla de mapa para selección
        <ThemedView style={styles.mapContainer}>
          <MapComponent
            showStops={true}
            showRoutes={true}
            showBuses={false}
            mode={mapMode}
            origin={tripPlan.origin.latitude ? tripPlan.origin : undefined}
            destination={tripPlan.destination.latitude ? tripPlan.destination : undefined}
            onOriginSelect={handleOriginSelect}
            onDestinationSelect={handleDestinationSelect}
            style={styles.map}
          />
          <ThemedView style={styles.mapControls}>
            <ThemedButton
              variant="outline"
              size="sm"
              onPress={() => setShowMap(false)}
              style={styles.mapControlButton}
            >
              <Icon name="close" size={16} color="primary" />
              <ThemedText color="primary"> Cerrar</ThemedText>
            </ThemedButton>
          </ThemedView>
        </ThemedView>
      ) : !showResults ? (
        // Pantalla de planificación
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={tabBarPadding}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.header}>
            <ThemedText variant="title">Planificar Viaje</ThemedText>
            <ThemedText variant="body" color="textSecondary">
              Encuentra la mejor ruta en transporte público
            </ThemedText>
          </ThemedView>

          <Card margin="md">
            <ThemedView style={styles.searchContainer}>
              {/* Origen */}
              <ThemedView style={styles.inputGroup}>
                <ThemedText variant="body" weight="semibold" color="primary">
                  Origen
                </ThemedText>
                <ThemedView style={styles.inputRow}>
                  <ThemedTextInput
                    value={originAddress}
                    onChangeText={setOriginAddress}
                    placeholder="Selecciona el origen"
                    style={styles.addressInput}
                    editable={false}
                  />
                  <ThemedButton
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setMapMode('select-origin');
                      setShowMap(true);
                    }}
                    style={styles.selectButton}
                  >
                    <Icon name="place" size={16} color="primary" />
                  </ThemedButton>
                  <ThemedButton
                    variant="outline"
                    size="sm"
                    onPress={useCurrentLocation}
                    style={styles.selectButton}
                  >
                    <Icon name="my-location" size={16} color="secondary" />
                  </ThemedButton>
                </ThemedView>
              </ThemedView>

              {/* Destino */}
              <ThemedView style={styles.inputGroup}>
                <ThemedText variant="body" weight="semibold" color="primary">
                  Destino
                </ThemedText>
                <ThemedView style={styles.inputRow}>
                  <ThemedTextInput
                    value={destinationAddress}
                    onChangeText={setDestinationAddress}
                    placeholder="Selecciona el destino"
                    style={styles.addressInput}
                    editable={false}
                  />
                  <ThemedButton
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setMapMode('select-destination');
                      setShowMap(true);
                    }}
                    style={styles.selectButton}
                  >
                    <Icon name="place" size={16} color="accent" />
                  </ThemedButton>
                </ThemedView>
              </ThemedView>

              {/* Botón de planificar */}
              <ThemedButton
                variant="primary"
                size="lg"
                onPress={planTrip}
                loading={planning}
                disabled={!tripPlan.origin.latitude || !tripPlan.destination.latitude}
                style={styles.planButton}
              >
                <Icon name="route" size={20} color="background" />
                <ThemedText color="background" weight="semibold">
                  {' '}Planificar Viaje
                </ThemedText>
              </ThemedButton>
            </ThemedView>
          </Card>

          {!planning && (!tripPlan.origin.latitude || !tripPlan.destination.latitude) && (
            <ThemedView style={styles.emptyState}>
              <Icon name="directions" color="textSecondary" size="xl" />
              <ThemedText variant="subtitle" color="textSecondary" style={styles.emptyTitle}>
                Planifica tu viaje
              </ThemedText>
              <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
                Selecciona tu origen y destino en el mapa para encontrar las mejores rutas de transporte público
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      ) : (
        // Pantalla de resultados
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          <Card style={styles.resultsHeader}>
            <ThemedView style={styles.resultsHeaderContent}>
              <ThemedText variant="title" weight="bold">
                Rutas Encontradas
              </ThemedText>
              <ThemedButton
                variant="ghost"
                size="sm"
                onPress={() => setShowResults(false)}
              >
                <Icon name="edit" size={16} color="primary" />
              </ThemedButton>
            </ThemedView>
            
            <ThemedView style={styles.tripSummary}>
              <ThemedText variant="body" color="textSecondary">
                De: {tripPlan.origin.name}
              </ThemedText>
              <ThemedText variant="body" color="textSecondary">
                A: {tripPlan.destination.name}
              </ThemedText>
            </ThemedView>
          </Card>

          {/* Opciones de ruta */}
          {tripPlan.routes && tripPlan.routes.map((route, index) => renderRouteOption(route, index))}

          {/* Mapa con ruta seleccionada */}
          {tripPlan.selectedRoute && (
            <Card style={styles.routeMapCard}>
              <ThemedText variant="subtitle" weight="bold" style={styles.detailsTitle}>
                Vista de la Ruta
              </ThemedText>
              
              <ThemedView style={styles.miniMapContainer}>
                <MapComponent
                  showStops={true}
                  showRoutes={false}
                  showBuses={false}
                  mode="view"
                  origin={tripPlan.origin}
                  destination={tripPlan.destination}
                  plannedRoute={tripPlan.selectedRoute}
                  style={styles.miniMap}
                />
              </ThemedView>
            </Card>
          )}

          {/* Detalles de la ruta seleccionada */}
          {tripPlan.selectedRoute && (
            <Card style={styles.detailsCard}>
              <ThemedText variant="subtitle" weight="bold" style={styles.detailsTitle}>
                Detalles del Viaje
              </ThemedText>
              
              {tripPlan.selectedRoute.segmentos.map((segment, index) => renderSegment(segment, index))}
            </Card>
          )}

          <ThemedView style={styles.resultsActions}>
            <ThemedButton
              variant="outline"
              size="lg"
              onPress={() => setShowResults(false)}
              style={styles.actionButton}
            >
              <Icon name="edit" size={20} color="primary" />
              <ThemedText color="primary" weight="semibold">
                {' '}Modificar
              </ThemedText>
            </ThemedButton>
            
            <ThemedButton
              variant="primary"
              size="lg"
              onPress={() => Alert.alert('Próximamente', 'Función de iniciar viaje en desarrollo')}
              style={styles.actionButton}
            >
              <Icon name="navigation" size={20} color="background" />
              <ThemedText color="background" weight="semibold">
                {' '}Iniciar
              </ThemedText>
            </ThemedButton>
          </ThemedView>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 60,
    right: 16,
  },
  mapControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  searchContainer: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  addressInput: {
    flex: 1,
  },
  selectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripSummary: {
    gap: 4,
  },
  routeCard: {
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRouteCard: {
    borderColor: '#3B82F6',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailsTitle: {
    marginBottom: 16,
  },
  routeMapCard: {
    marginBottom: 16,
  },
  miniMapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  miniMap: {
    height: 200,
  },
  segmentCard: {
    marginBottom: 8,
    padding: 12,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  segmentInstructions: {
    marginBottom: 4,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
  },
});