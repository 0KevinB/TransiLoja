import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { useTransport } from '../context/TransportContext';
import { useLocation } from '../hooks/useLocation';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { LeafletMapView } from './LeafletMapView';
import { RouteSearch } from './RouteSearch';
import { TripPreferences, TripPreferencesData } from './TripPreferences';
import RAPTORAlgorithm from '../lib/raptor';
import type { RutaOptima, SegmentoViaje } from '../lib/types';

interface TripPlannerProps {
  visible: boolean;
  onClose: () => void;
}

export const TripPlanner: React.FC<TripPlannerProps> = ({
  visible,
  onClose,
}) => {
  const { paradas, rutas, buses } = useTransport();
  const { location, getCurrentLocation } = useLocation();
  
  const [mode, setMode] = useState<'search' | 'select-origin' | 'select-destination' | 'view-route'>('search');
  const [origin, setOrigin] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [plannedRoutes, setPlannedRoutes] = useState<RutaOptima[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RutaOptima | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Configuraciones de viaje
  const [tripPreferences, setTripPreferences] = useState<TripPreferencesData>({
    maxWalkingDistance: 1000,
    maxTransfers: 3,
    preferFastest: true,
    departureTime: new Date(),
    avoidStairs: false,
    accessibleOnly: false,
    weatherConsideration: false,
    costOptimization: false,
  });

  const handleOriginSelect = (coordinate: { latitude: number; longitude: number }) => {
    const originPoint = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      name: `Origen (${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)})`,
      type: 'coordinate'
    };
    setOrigin(originPoint);
    setMode('search');
  };

  const handleDestinationSelect = (coordinate: { latitude: number; longitude: number }) => {
    const destinationPoint = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      name: `Destino (${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)})`,
      type: 'coordinate'
    };
    setDestination(destinationPoint);
    setMode('search');
  };

  const handleStopSelect = (stop: any) => {
    if (mode === 'select-origin') {
      setOrigin({
        ...stop,
        latitude: stop.coordenadas?.lat || stop.lat,
        longitude: stop.coordenadas?.lng || stop.lng,
        type: 'stop'
      });
      setMode('search');
    } else if (mode === 'select-destination') {
      setDestination({
        ...stop,
        latitude: stop.coordenadas?.lat || stop.lat,
        longitude: stop.coordenadas?.lng || stop.lng,
        type: 'stop'
      });
      setMode('search');
    }
  };

  const handlePlanTrip = async (originData?: any, destinationData?: any) => {
    const tripOrigin = originData || origin;
    const tripDestination = destinationData || destination;

    if (!tripOrigin || !tripDestination) {
      Alert.alert('Error', 'Selecciona tanto el origen como el destino');
      return;
    }

    setIsPlanning(true);
    
    try {
      // Crear instancia del algoritmo RAPTOR
      const raptor = new RAPTORAlgorithm(paradas, rutas, buses);
      
      // Buscar rutas óptimas
      const routes = raptor.encontrarRutaOptima(
        tripOrigin.latitude,
        tripOrigin.longitude,
        tripDestination.latitude,
        tripDestination.longitude,
        tripPreferences.departureTime
      );

      if (routes.length === 0) {
        Alert.alert(
          'Sin rutas', 
          'No se encontraron rutas entre el origen y destino seleccionados'
        );
      } else {
        setPlannedRoutes(routes);
        setSelectedRoute(routes[0]); // Seleccionar la mejor ruta
        setMode('view-route');
        setShowMap(true);
      }
    } catch (error) {
      console.error('Error planning trip:', error);
      Alert.alert('Error', 'No se pudo planificar el viaje. Intenta nuevamente.');
    } finally {
      setIsPlanning(false);
    }
  };

  const useCurrentLocation = async () => {
    try {
      await getCurrentLocation();
      if (location) {
        const currentPoint = {
          latitude: location.latitude,
          longitude: location.longitude,
          name: 'Mi ubicación actual',
          type: 'current'
        };
        setOrigin(currentPoint);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    }
  };

  const clearTrip = () => {
    setOrigin(null);
    setDestination(null);
    setPlannedRoutes([]);
    setSelectedRoute(null);
    setMode('search');
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (timeString: string | number): string => {
    if (typeof timeString === 'string') {
      return timeString.substring(0, 5); // HH:MM
    }
    return new Date(timeString * 1000).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDirectDistance = (point1: any, point2: any): string => {
    if (!point1 || !point2) return 'N/A';
    
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c;
    
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const renderRouteSegment = (segment: SegmentoViaje, index: number) => {
    const isWalking = segment.tipo === 'caminar';
    
    return (
      <Card key={index} style={styles.segmentCard}>
        <ThemedView style={styles.segmentContent}>
          <ThemedView style={styles.segmentIcon}>
            <Icon 
              name={isWalking ? 'directions-walk' : 'directions-bus'} 
              size="md" 
              color={isWalking ? 'accent' : 'primary'} 
            />
          </ThemedView>
          
          <ThemedView style={styles.segmentDetails}>
            <ThemedText variant="body" weight="medium">
              {segment.instrucciones}
            </ThemedText>
            
            <ThemedView style={styles.segmentTiming}>
              <ThemedText variant="caption" color="textSecondary">
                {formatTime(segment.tiempo_inicio)} - {formatTime(segment.tiempo_fin)}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                {formatDuration(segment.duracion_seg)}
                {segment.distancia_metros && (
                  ` • ${Math.round(segment.distancia_metros)}m`
                )}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Card>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.container}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedButton variant="ghost" size="sm" onPress={onClose}>
            <Icon name="close" size="md" color="textPrimary" />
          </ThemedButton>
          
          <ThemedText variant="title" weight="bold">
            Planificar viaje
          </ThemedText>
          
          <ThemedButton variant="ghost" size="sm" onPress={() => setShowPreferences(true)}>
            <Icon name="settings" size="md" color="textPrimary" />
          </ThemedButton>
        </ThemedView>

        {showMap ? (
          <ThemedView style={styles.mapContainer}>
            {/* Mapa de pantalla completa */}
            <LeafletMapView
              mode={mode === 'select-origin' ? 'select-origin' : 
                    mode === 'select-destination' ? 'select-destination' : 'view'}
              showStops={true}
              showRoutes={true}
              showBuses={mode === 'view-route'}
              showUserLocation={true}
              onStopPress={handleStopSelect}
              onOriginSelect={handleOriginSelect}
              onDestinationSelect={handleDestinationSelect}
              origin={origin}
              destination={destination}
              plannedRoute={selectedRoute}
              style={styles.fullMap}
            />

            {/* Panel de información flotante */}
            <ThemedView style={[
              styles.floatingPanel,
              mode === 'view-route' ? styles.floatingPanelRoute : styles.floatingPanelDefault
            ]}>
              {/* Botón de cerrar mapa */}
              <ThemedView style={styles.mapHeader}>
                <ThemedButton
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowMap(false)}
                  style={styles.closeMapButton}
                >
                  <Icon name="close" size="md" color="textPrimary" />
                </ThemedButton>
                
                <ThemedText variant="subtitle" weight="bold" style={styles.mapTitle}>
                  {mode === 'select-origin' && '📍 Seleccionar Origen'}
                  {mode === 'select-destination' && '🎯 Seleccionar Destino'}
                  {mode === 'view-route' && '🗺️ Ruta Planificada'}
                  {mode === 'search' && '🗺️ Mapa Interactivo'}
                </ThemedText>
              </ThemedView>

              {/* Información contextual - compacta */}
              {mode !== 'view-route' && (
                <ThemedView style={styles.compactInstructionPanel}>
                  <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
                    {mode === 'select-origin' && '👆 Toca una parada o punto'}
                    {mode === 'select-destination' && '👆 Toca una parada o punto'}
                    {mode === 'search' && '🗺️ Explora el sistema de transporte'}
                  </ThemedText>
                  
                  {(mode === 'select-origin' || mode === 'select-destination') && (
                    <ThemedButton
                      variant="ghost"
                      size="sm"
                      onPress={useCurrentLocation}
                      style={styles.compactLocationButton}
                    >
                      <Icon name="my-location" size="sm" color="primary" />
                    </ThemedButton>
                  )}
                </ThemedView>
              )}

              {/* Resumen de ruta en vista de mapa - minimalista */}
              {mode === 'view-route' && selectedRoute && (
                <ThemedView style={styles.minimalRouteSummary}>
                  <ThemedView style={styles.routeStatsRow}>
                    <ThemedView style={styles.statChip}>
                      <ThemedText variant="caption" weight="bold" color="primary">
                        ⏱️ {selectedRoute.tiempo_total || selectedRoute.tiempo_total_seg ? 
                          formatDuration(selectedRoute.tiempo_total || selectedRoute.tiempo_total_seg) :
                          'N/D'
                        }
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.statChip}>
                      <ThemedText variant="caption" weight="bold" color="secondary">
                        🔄 {selectedRoute.numero_transbordos !== undefined ? selectedRoute.numero_transbordos :
                         selectedRoute.numero_transferencias !== undefined ? selectedRoute.numero_transferencias :
                         'N/D'
                        }
                      </ThemedText>
                    </ThemedView>
                    {selectedRoute.distancia_caminata && (
                      <ThemedView style={styles.statChip}>
                        <ThemedText variant="caption" weight="bold" color="accent">
                          🚶 {Math.round(selectedRoute.distancia_caminata)}m
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                  
                  <ThemedButton
                    variant="primary"
                    size="sm"
                    onPress={() => setShowMap(false)}
                    style={styles.miniDetailsButton}
                  >
                    <Icon name="list" size="sm" color="background" />
                  </ThemedButton>
                </ThemedView>
              )}
            </ThemedView>
          </ThemedView>
        ) : (
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {mode === 'search' && (
              <>
                {/* Selección de origen y destino mejorada */}
                <ThemedView style={styles.section}>
                  <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
                    🗺️ Planifica tu viaje
                  </ThemedText>
                  
                  {/* Tarjeta de origen */}
                  <Card style={[styles.locationCard, styles.originCard]}>
                    <ThemedView style={styles.locationContent}>
                      <ThemedView style={styles.locationIcon}>
                        <Icon name="radio-button-checked" size="lg" color="primary" />
                      </ThemedView>
                      
                      <ThemedView style={styles.locationInfo}>
                        <ThemedText variant="caption" color="primary" weight="semibold">
                          ORIGEN
                        </ThemedText>
                        <ThemedText 
                          variant="body" 
                          weight="medium"
                          numberOfLines={2}
                          style={styles.locationText}
                        >
                          {origin ? origin.name : 'Toca para seleccionar origen'}
                        </ThemedText>
                        {origin && origin.type && (
                          <ThemedText variant="caption" color="textSecondary">
                            {origin.type === 'current' ? '📍 Mi ubicación' : 
                             origin.type === 'stop' ? '🚏 Parada' : '🗺️ Coordenada'}
                          </ThemedText>
                        )}
                      </ThemedView>
                      
                      <ThemedView style={styles.locationActions}>
                        <ThemedButton
                          variant="ghost"
                          size="sm"
                          onPress={useCurrentLocation}
                          style={styles.locationActionButton}
                        >
                          <Icon name="my-location" size="md" color="primary" />
                        </ThemedButton>
                        <ThemedButton
                          variant="primary"
                          size="sm"
                          onPress={() => {
                            setMode('select-origin');
                            setShowMap(true);
                          }}
                          style={styles.selectButton}
                        >
                          <Icon name="place" size="sm" color="background" />
                        </ThemedButton>
                      </ThemedView>
                    </ThemedView>
                  </Card>

                  {/* Área de conexión visual */}
                  <ThemedView style={styles.connectionLine}>
                    <ThemedView style={styles.connectionDots}>
                      <ThemedView style={styles.dot} />
                      <ThemedView style={styles.dot} />
                      <ThemedView style={styles.dot} />
                    </ThemedView>
                    {origin && destination && (
                      <ThemedText variant="caption" color="textSecondary" style={styles.distanceText}>
                        📍 Distancia en línea recta: {calculateDirectDistance(origin, destination)}
                      </ThemedText>
                    )}
                  </ThemedView>

                  {/* Tarjeta de destino */}
                  <Card style={[styles.locationCard, styles.destinationCard]}>
                    <ThemedView style={styles.locationContent}>
                      <ThemedView style={styles.locationIcon}>
                        <Icon name="location-on" size="lg" color="secondary" />
                      </ThemedView>
                      
                      <ThemedView style={styles.locationInfo}>
                        <ThemedText variant="caption" color="secondary" weight="semibold">
                          DESTINO
                        </ThemedText>
                        <ThemedText 
                          variant="body" 
                          weight="medium"
                          numberOfLines={2}
                          style={styles.locationText}
                        >
                          {destination ? destination.name : 'Toca para seleccionar destino'}
                        </ThemedText>
                        {destination && destination.type && (
                          <ThemedText variant="caption" color="textSecondary">
                            {destination.type === 'current' ? '📍 Mi ubicación' : 
                             destination.type === 'stop' ? '🚏 Parada' : '🗺️ Coordenada'}
                          </ThemedText>
                        )}
                      </ThemedView>
                      
                      <ThemedView style={styles.locationActions}>
                        <ThemedButton
                          variant="secondary"
                          size="sm"
                          onPress={() => {
                            setMode('select-destination');
                            setShowMap(true);
                          }}
                          style={styles.selectButton}
                        >
                          <Icon name="place" size="sm" color="background" />
                        </ThemedButton>
                      </ThemedView>
                    </ThemedView>
                  </Card>

                  {/* Botón planificar */}
                  {/* Botones de acción mejorados */}
                  <ThemedView style={styles.actionSection}>
                    <ThemedView style={styles.quickActions}>
                      <ThemedButton
                        variant="outline"
                        size="md"
                        onPress={() => setShowPreferences(true)}
                        style={styles.quickActionButton}
                      >
                        <Icon name="tune" size="sm" color="primary" />
                        <ThemedText color="primary"> Preferencias</ThemedText>
                      </ThemedButton>
                      
                      <ThemedButton
                        variant="outline"
                        size="md"
                        onPress={() => setShowMap(true)}
                        style={styles.quickActionButton}
                      >
                        <Icon name="map" size="sm" color="accent" />
                        <ThemedText color="accent"> Ver mapa</ThemedText>
                      </ThemedButton>
                    </ThemedView>

                    <ThemedButton
                      variant="primary"
                      size="lg"
                      onPress={() => handlePlanTrip()}
                      loading={isPlanning}
                      disabled={!origin || !destination}
                      style={styles.planButton}
                    >
                      {isPlanning ? (
                        <>
                          <Icon name="refresh" size="md" color="background" />
                          <ThemedText color="background"> Planificando...</ThemedText>
                        </>
                      ) : (
                        <>
                          <Icon name="directions" size="md" color="background" />
                          <ThemedText color="background"> Planificar viaje</ThemedText>
                        </>
                      )}
                    </ThemedButton>
                  </ThemedView>
                </ThemedView>

                {/* Componente de búsqueda */}
                <RouteSearch
                  onStopSelect={(stop) => {
                    // Lógica para seleccionar parada como origen o destino
                  }}
                  onPlanTrip={handlePlanTrip}
                />
              </>
            )}

            {mode === 'view-route' && selectedRoute && (
              <ThemedView style={styles.routeDetails}>
                {/* Botón para ver en mapa grande */}
                <ThemedView style={styles.routeHeader}>
                  <ThemedText variant="title" weight="bold" style={styles.routeTitle}>
                    📍 Ruta Planificada
                  </ThemedText>
                  <ThemedButton
                    variant="secondary"
                    size="sm"
                    onPress={() => setShowMap(true)}
                    style={styles.viewFullMapButton}
                  >
                    <Icon name="fullscreen" size="md" color="background" />
                    <ThemedText color="background"> Ver mapa completo</ThemedText>
                  </ThemedButton>
                </ThemedView>
                {/* Resumen de la ruta */}
                <Card style={styles.routeSummary}>
                  <ThemedView style={styles.routeSummaryContent}>
                    <ThemedView style={styles.routeTime}>
                      <ThemedText variant="title" weight="bold" color="primary">
                        {formatDuration(selectedRoute.tiempo_total_seg)}
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        Tiempo total
                      </ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.routeStats}>
                      <ThemedView style={styles.routeStat}>
                        <ThemedText variant="body" weight="bold">
                          {selectedRoute.numero_transbordos}
                        </ThemedText>
                        <ThemedText variant="caption" color="textSecondary">
                          Transbordos
                        </ThemedText>
                      </ThemedView>
                      
                      {selectedRoute.distancia_caminata && (
                        <ThemedView style={styles.routeStat}>
                          <ThemedText variant="body" weight="bold">
                            {Math.round(selectedRoute.distancia_caminata)}m
                          </ThemedText>
                          <ThemedText variant="caption" color="textSecondary">
                            Caminata
                          </ThemedText>
                        </ThemedView>
                      )}
                    </ThemedView>
                  </ThemedView>
                  
                  <ThemedButton
                    variant="outline"
                    size="sm"
                    onPress={() => setShowMap(true)}
                    style={styles.viewMapButton}
                  >
                    <Icon name="map" size="sm" color="primary" />
                    <ThemedText color="primary"> Mapa interactivo</ThemedText>
                  </ThemedButton>
                </Card>

                {/* Segmentos del viaje */}
                <ThemedView style={styles.segmentsContainer}>
                  <ThemedText variant="subtitle" weight="semibold" style={styles.segmentsTitle}>
                    Instrucciones de viaje
                  </ThemedText>
                  
                  {selectedRoute.segmentos.map((segment, index) => 
                    renderRouteSegment(segment, index)
                  )}
                </ThemedView>

                {/* Rutas alternativas */}
                {plannedRoutes.length > 1 && (
                  <ThemedView style={styles.alternativeRoutes}>
                    <ThemedText variant="subtitle" weight="semibold" style={styles.alternativesTitle}>
                      Rutas alternativas
                    </ThemedText>
                    
                    {plannedRoutes.slice(1).map((route, index) => (
                      <Card key={index} style={styles.alternativeCard} onPress={() => setSelectedRoute(route)}>
                        <ThemedView style={styles.alternativeContent}>
                          <ThemedView style={styles.alternativeInfo}>
                            <ThemedText variant="body" weight="medium">
                              {formatDuration(route.tiempo_total_seg)}
                            </ThemedText>
                            <ThemedText variant="caption" color="textSecondary">
                              {route.numero_transbordos} transbordos
                            </ThemedText>
                          </ThemedView>
                          <Icon name="chevron-right" size="sm" color="textSecondary" />
                        </ThemedView>
                      </Card>
                    ))}
                  </ThemedView>
                )}
              </ThemedView>
            )}
          </ScrollView>
        )}

        {/* Modal de preferencias */}
        <TripPreferences
          visible={showPreferences}
          preferences={tripPreferences}
          onClose={() => setShowPreferences(false)}
          onSave={setTripPreferences}
        />
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  locationCard: {
    marginBottom: 8,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  originCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  destinationCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    gap: 4,
  },
  locationText: {
    minHeight: 24,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  locationActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButton: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionLine: {
    alignItems: 'center',
    paddingVertical: 12,
    marginVertical: 8,
  },
  connectionDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  distanceText: {
    textAlign: 'center',
  },
  actionSection: {
    marginTop: 20,
    gap: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  fullMap: {
    flex: 1,
  },
  floatingPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  floatingPanelRoute: {
    maxHeight: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingTop: 12,
    paddingBottom: 8,
    elevation: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  floatingPanelDefault: {
    maxHeight: 200,
    paddingTop: 16,
    paddingBottom: 12,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  closeMapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  mapTitle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Para centrar considerando el botón de cerrar
  },
  compactInstructionPanel: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLocationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalRouteSummary: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 6,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  miniDetailsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  routeDetails: {
    padding: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
  },
  routeTitle: {
    flex: 1,
  },
  viewFullMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  routeSummary: {
    marginBottom: 24,
  },
  routeSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  routeTime: {
    alignItems: 'center',
  },
  routeStats: {
    flexDirection: 'row',
    gap: 24,
  },
  routeStat: {
    alignItems: 'center',
  },
  viewMapButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentsContainer: {
    marginBottom: 24,
  },
  segmentsTitle: {
    marginBottom: 16,
  },
  segmentCard: {
    marginBottom: 12,
  },
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  segmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentDetails: {
    flex: 1,
  },
  segmentTiming: {
    marginTop: 4,
    gap: 2,
  },
  alternativeRoutes: {
    marginTop: 12,
  },
  alternativesTitle: {
    marginBottom: 12,
  },
  alternativeCard: {
    marginBottom: 8,
  },
  alternativeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alternativeInfo: {
    flex: 1,
  },
    // Espaciado final
    bottomSpacer: {
      height: 20,
    },
});