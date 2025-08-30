import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, Platform } from 'react-native';
import { useTransport } from '../context/TransportContext';
import { useLocation } from '../hooks/useLocation';
import { ThemedView } from '../components/ui/ThemedView';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedButton } from '../components/ui/ThemedButton';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { LeafletMapView } from '../components/LeafletMapView';
import { TripPlanner } from '../components/TripPlanner';
import { Parada, Bus } from '../lib/types';

export default function MapScreen() {
  const { paradas, buses, rutas, forceRefresh, loading } = useTransport();
  const { location, getCurrentLocation, requestPermission } = useLocation();
  const [selectedParada, setSelectedParada] = useState<any>(null);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [showBuses, setShowBuses] = useState(true); // Mostrar buses por defecto
  const [showParadas, setShowParadas] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const [isUpdatingFilters, setIsUpdatingFilters] = useState(false);

  useEffect(() => {
    initializeLocation();
    loadMapData();
  }, []);

  const initializeLocation = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error initializing location:', error);
    }
  };

  const loadMapData = async () => {
    // Los datos se cargan automáticamente desde TransportContext
    // Solo refrescar manualmente si el usuario lo solicita
  };

  const handleStopPress = (stop: any) => {
    setSelectedParada(stop);
    setSelectedBus(null);
    console.log('Parada seleccionada:', stop);
  };

  const handleBusPress = (bus: any) => {
    setSelectedBus(bus);
    setSelectedParada(null);
    console.log('Bus seleccionado:', bus);
  };

  const clearSelection = () => {
    setSelectedParada(null);
    setSelectedBus(null);
  };

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <LeafletMapView
        showStops={showParadas}
        showRoutes={showRoutes}
        showBuses={showBuses}
        showUserLocation={true}
        onStopPress={handleStopPress}
        style={styles.map}
      />

      {/* Controles del mapa */}
      <ThemedView style={styles.controls}>
        <ThemedView style={styles.toggles}>
          <ThemedButton
            variant={showParadas ? "primary" : "outline"}
            size="sm"
            onPress={() => {
              if (isUpdatingFilters) return;
              setIsUpdatingFilters(true);
              setShowParadas(!showParadas);
              setTimeout(() => setIsUpdatingFilters(false), 100);
            }}
            style={[styles.toggleButton, isUpdatingFilters && styles.updatingButton]}
            disabled={isUpdatingFilters}
          >
            <Icon 
              name="place" 
              size="sm" 
              color={showParadas ? "background" : "primary"} 
            />
            <ThemedText color={showParadas ? "background" : "primary"}>
              {" "}Paradas
            </ThemedText>
          </ThemedButton>

          <ThemedButton
            variant={showRoutes ? "primary" : "outline"}
            size="sm"
            onPress={() => {
              if (isUpdatingFilters) return;
              setIsUpdatingFilters(true);
              setShowRoutes(!showRoutes);
              setTimeout(() => setIsUpdatingFilters(false), 100);
            }}
            style={[styles.toggleButton, isUpdatingFilters && styles.updatingButton]}
            disabled={isUpdatingFilters}
          >
            <Icon 
              name="route" 
              size="sm" 
              color={showRoutes ? "background" : "primary"} 
            />
            <ThemedText color={showRoutes ? "background" : "primary"}>
              {" "}Rutas
            </ThemedText>
          </ThemedButton>

          <ThemedButton
            variant={showBuses ? "primary" : "outline"}
            size="sm"
            onPress={() => {
              if (isUpdatingFilters) return;
              setIsUpdatingFilters(true);
              setShowBuses(!showBuses);
              setTimeout(() => setIsUpdatingFilters(false), 100);
            }}
            style={[styles.toggleButton, isUpdatingFilters && styles.updatingButton]}
            disabled={isUpdatingFilters}
          >
            <Icon 
              name="directions-bus" 
              size="sm" 
              color={showBuses ? "background" : "primary"} 
            />
            <ThemedText color={showBuses ? "background" : "primary"}>
              {" "}Buses
            </ThemedText>
          </ThemedButton>
        </ThemedView>

        <ThemedView style={styles.rightControls}>
          <ThemedButton
            variant="secondary"
            size="sm"
            onPress={() => setShowTripPlanner(true)}
            style={styles.planButton}
          >
            <Icon name="directions" size="sm" color="background" />
          </ThemedButton>
          
          <ThemedButton
            variant="outline"
            size="sm"
            onPress={forceRefresh}
            style={styles.refreshButton}
            loading={loading}
          >
            <Icon name="refresh" size="sm" color="primary" />
          </ThemedButton>
          
          <ThemedButton
            variant="primary"
            size="sm"
            onPress={getCurrentLocation}
            style={styles.locationButton}
          >
            <Icon name="my-location" size="sm" color="background" />
          </ThemedButton>
        </ThemedView>
      </ThemedView>

      {/* Información de parada seleccionada */}
      {selectedParada && (
        <Card style={styles.infoCard}>
          <ThemedView style={styles.infoHeader}>
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="subtitle" weight="semibold">
                {selectedParada.nombre}
              </ThemedText>
              {selectedParada.codigo && (
                <ThemedText variant="caption" color="textSecondary">
                  Código: {selectedParada.codigo}
                </ThemedText>
              )}
            </ThemedView>
            <ThemedButton
              variant="ghost"
              size="sm"
              onPress={clearSelection}
            >
              <Icon name="close" size="sm" color="textSecondary" />
            </ThemedButton>
          </ThemedView>

          <ThemedView style={styles.infoActions}>
            <ThemedButton
              variant="outline"
              size="sm"
              onPress={() => Alert.alert('Información', 'Horarios próximamente')}
              style={styles.infoAction}
            >
              <Icon name="schedule" size="sm" color="primary" />
              <ThemedText color="primary"> Horarios</ThemedText>
            </ThemedButton>
            
            <ThemedButton
              variant="outline"
              size="sm"
              onPress={() => Alert.alert('Información', 'Rutas próximamente')}
              style={styles.infoAction}
            >
              <Icon name="directions" size="sm" color="secondary" />
              <ThemedText color="secondary"> Rutas</ThemedText>
            </ThemedButton>
          </ThemedView>
        </Card>
      )}

      {/* Información de bus seleccionado */}
      {selectedBus && (
        <Card style={styles.infoCard}>
          <ThemedView style={styles.infoHeader}>
            <ThemedView style={styles.infoContent}>
              <ThemedText variant="subtitle" weight="semibold">
                Bus {selectedBus.numero_placa}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Estado: {selectedBus.estado}
              </ThemedText>
              {selectedBus.numero_interno && (
                <ThemedText variant="caption" color="textSecondary">
                  Número interno: {selectedBus.numero_interno}
                </ThemedText>
              )}
            </ThemedView>
            <ThemedButton
              variant="ghost"
              size="sm"
              onPress={clearSelection}
            >
              <Icon name="close" size="sm" color="textSecondary" />
            </ThemedButton>
          </ThemedView>

          <ThemedView style={styles.infoActions}>
            <ThemedButton
              variant="outline"
              size="sm"
              onPress={() => Alert.alert('Información', 'Seguimiento próximamente')}
              style={styles.infoAction}
            >
              <Icon name="gps-fixed" size="sm" color="primary" />
              <ThemedText color="primary"> Seguir</ThemedText>
            </ThemedButton>
            
            <ThemedButton
              variant="outline"
              size="sm"
              onPress={() => Alert.alert('Información', 'Información próximamente')}
              style={styles.infoAction}
            >
              <Icon name="info" size="sm" color="secondary" />
              <ThemedText color="secondary"> Info</ThemedText>
            </ThemedButton>
          </ThemedView>
        </Card>
      )}

      {/* Estadísticas */}
      <Card style={styles.statsCard}>
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statItem}>
            <ThemedText variant="body" color="primary" weight="bold">
              {paradas.length}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              Paradas
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText variant="body" color="secondary" weight="bold">
              {rutas.length}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              Rutas
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText variant="body" color="accent" weight="bold">
              {buses.length}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              Buses
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </Card>

      {/* Planificador de viajes */}
      <TripPlanner
        visible={showTripPlanner}
        onClose={() => setShowTripPlanner(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toggles: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updatingButton: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  rightControls: {
    flexDirection: 'row',
    gap: 8,
  },
  planButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  infoCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    margin: 0,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  infoAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    margin: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
});