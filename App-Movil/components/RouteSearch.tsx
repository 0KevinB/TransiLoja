import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { useTransport } from '../context/TransportContext';
import { useLocation } from '../hooks/useLocation';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedTextInput } from './ui/ThemedTextInput';
import { ThemedButton } from './ui/ThemedButton';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import type { Parada, Ruta } from '../lib/types';

interface RouteSearchProps {
  onStopSelect?: (stop: Parada) => void;
  onRouteSelect?: (route: Ruta) => void;
  onPlanTrip?: (origin: any, destination: any) => void;
}

export const RouteSearch: React.FC<RouteSearchProps> = ({
  onStopSelect,
  onRouteSelect,
  onPlanTrip,
}) => {
  const { paradas, rutas, loading } = useTransport();
  const { location } = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'stops' | 'routes'>('stops');
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<any>(null);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [nearbyStops, setNearbyStops] = useState<Parada[]>([]);

  // Filtrar resultados de búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    let results: any[] = [];

    if (searchType === 'stops') {
      results = paradas
        .filter(stop => 
          (stop.nombre || '').toLowerCase().includes(query) ||
          (stop.codigo || '').toLowerCase().includes(query)
        )
        .slice(0, 10); // Limitar a 10 resultados
    } else {
      results = rutas
        .filter(route =>
          (route.nombre || route.name || '').toLowerCase().includes(query) ||
          (route.nombre_corto || '').toLowerCase().includes(query) ||
          (route.descripcion || '').toLowerCase().includes(query)
        )
        .slice(0, 10);
    }

    setFilteredResults(results);
  }, [searchQuery, searchType, paradas, rutas]);

  // Calcular paradas cercanas
  useEffect(() => {
    if (!location || !paradas.length) return;

    const nearby = paradas
      .map(stop => {
        const stopLat = stop.coordenadas?.lat || stop.lat || 0;
        const stopLng = stop.coordenadas?.lng || stop.lng || 0;
        
        if (!stopLat || !stopLng) return null;
        
        const distance = calculateDistance(
          location.latitude, location.longitude,
          stopLat, stopLng
        );
        
        return { ...stop, distance };
      })
      .filter((stop): stop is Parada & { distance: number } => stop !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    setNearbyStops(nearby);
  }, [location, paradas]);

  // Función para calcular distancia
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

  const handleItemSelect = (item: any) => {
    if (searchType === 'stops') {
      onStopSelect?.(item);
    } else {
      onRouteSelect?.(item);
    }
  };

  const handleOriginDestinationSelect = (item: any, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setSelectedOrigin(item);
    } else {
      setSelectedDestination(item);
    }
  };

  const handlePlanTrip = () => {
    if (!selectedOrigin || !selectedDestination) {
      Alert.alert('Error', 'Selecciona tanto el origen como el destino');
      return;
    }
    onPlanTrip?.(selectedOrigin, selectedDestination);
  };

  const clearSelection = () => {
    setSelectedOrigin(null);
    setSelectedDestination(null);
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Selector de tipo de búsqueda */}
        <ThemedView style={styles.searchTypeContainer}>
          <ThemedButton
            variant={searchType === 'stops' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setSearchType('stops')}
            style={styles.searchTypeButton}
          >
            <Icon name="place" size="sm" color={searchType === 'stops' ? 'background' : 'primary'} />
            <ThemedText color={searchType === 'stops' ? 'background' : 'primary'}>
              {' '}Paradas
            </ThemedText>
          </ThemedButton>

          <ThemedButton
            variant={searchType === 'routes' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setSearchType('routes')}
            style={styles.searchTypeButton}
          >
            <Icon name="route" size="sm" color={searchType === 'routes' ? 'background' : 'primary'} />
            <ThemedText color={searchType === 'routes' ? 'background' : 'primary'}>
              {' '}Rutas
            </ThemedText>
          </ThemedButton>
        </ThemedView>

        {/* Campo de búsqueda */}
        <ThemedTextInput
          placeholder={`Buscar ${searchType === 'stops' ? 'paradas' : 'rutas'}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          leftIcon="search"
          clearButtonMode="while-editing"
        />

        {/* Resultados de búsqueda */}
        {filteredResults.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Resultados de búsqueda
            </ThemedText>
            {filteredResults.map((item, index) => (
              <Card key={index} style={styles.resultCard} onPress={() => handleItemSelect(item)}>
                <ThemedView style={styles.resultContent}>
                  <ThemedView style={styles.resultInfo}>
                    <ThemedText variant="body" weight="medium">
                      {item.nombre || item.name}
                    </ThemedText>
                    {searchType === 'stops' && item.codigo && (
                      <ThemedText variant="caption" color="textSecondary">
                        Código: {item.codigo}
                      </ThemedText>
                    )}
                    {searchType === 'routes' && (
                      <ThemedText variant="caption" color="textSecondary">
                        {item.descripcion || `${item.stopIds?.length || 0} paradas`}
                      </ThemedText>
                    )}
                  </ThemedView>
                  <ThemedView style={styles.resultActions}>
                    <ThemedButton
                      variant="ghost"
                      size="sm"
                      onPress={() => handleOriginDestinationSelect(item, 'origin')}
                      style={styles.actionButton}
                    >
                      <ThemedText variant="caption" color="primary">Origen</ThemedText>
                    </ThemedButton>
                    <ThemedButton
                      variant="ghost"
                      size="sm"
                      onPress={() => handleOriginDestinationSelect(item, 'destination')}
                      style={styles.actionButton}
                    >
                      <ThemedText variant="caption" color="secondary">Destino</ThemedText>
                    </ThemedButton>
                  </ThemedView>
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}

        {/* Paradas cercanas */}
        {!searchQuery && nearbyStops.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Paradas cercanas
            </ThemedText>
            {nearbyStops.map((stop, index) => (
              <Card key={index} style={styles.resultCard} onPress={() => handleItemSelect(stop)}>
                <ThemedView style={styles.resultContent}>
                  <ThemedView style={styles.resultInfo}>
                    <ThemedText variant="body" weight="medium">
                      {stop.nombre}
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      A {formatDistance(stop.distance)}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.resultActions}>
                    <ThemedButton
                      variant="ghost"
                      size="sm"
                      onPress={() => handleOriginDestinationSelect(stop, 'origin')}
                      style={styles.actionButton}
                    >
                      <ThemedText variant="caption" color="primary">Origen</ThemedText>
                    </ThemedButton>
                    <ThemedButton
                      variant="ghost"
                      size="sm"
                      onPress={() => handleOriginDestinationSelect(stop, 'destination')}
                      style={styles.actionButton}
                    >
                      <ThemedText variant="caption" color="secondary">Destino</ThemedText>
                    </ThemedButton>
                  </ThemedView>
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}

        {/* Planificador de viaje */}
        <ThemedView style={styles.section}>
          <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
            Planificar viaje
          </ThemedText>
          
          {/* Origen seleccionado */}
          <Card style={styles.selectionCard}>
            <ThemedView style={styles.selectionContent}>
              <Icon name="radio-button-checked" size="sm" color="primary" />
              <ThemedView style={styles.selectionInfo}>
                <ThemedText variant="caption" color="textSecondary">Origen</ThemedText>
                <ThemedText variant="body" weight="medium">
                  {selectedOrigin ? selectedOrigin.nombre || selectedOrigin.name : 'No seleccionado'}
                </ThemedText>
              </ThemedView>
              {selectedOrigin && (
                <ThemedButton
                  variant="ghost"
                  size="sm"
                  onPress={() => setSelectedOrigin(null)}
                  style={styles.clearButton}
                >
                  <Icon name="close" size="sm" color="textSecondary" />
                </ThemedButton>
              )}
            </ThemedView>
          </Card>

          {/* Destino seleccionado */}
          <Card style={styles.selectionCard}>
            <ThemedView style={styles.selectionContent}>
              <Icon name="location-on" size="sm" color="secondary" />
              <ThemedView style={styles.selectionInfo}>
                <ThemedText variant="caption" color="textSecondary">Destino</ThemedText>
                <ThemedText variant="body" weight="medium">
                  {selectedDestination ? selectedDestination.nombre || selectedDestination.name : 'No seleccionado'}
                </ThemedText>
              </ThemedView>
              {selectedDestination && (
                <ThemedButton
                  variant="ghost"
                  size="sm"
                  onPress={() => setSelectedDestination(null)}
                  style={styles.clearButton}
                >
                  <Icon name="close" size="sm" color="textSecondary" />
                </ThemedButton>
              )}
            </ThemedView>
          </Card>

          {/* Botones de acción */}
          <ThemedView style={styles.actionButtons}>
            <ThemedButton
              variant="outline"
              size="md"
              onPress={clearSelection}
              style={styles.actionButton}
              disabled={!selectedOrigin && !selectedDestination}
            >
              <Icon name="clear" size="sm" color="textSecondary" />
              <ThemedText color="textSecondary"> Limpiar</ThemedText>
            </ThemedButton>

            <ThemedButton
              variant="primary"
              size="md"
              onPress={handlePlanTrip}
              style={[styles.actionButton, styles.planButton]}
              disabled={!selectedOrigin || !selectedDestination}
            >
              <Icon name="directions" size="sm" color="background" />
              <ThemedText color="background"> Planificar</ThemedText>
            </ThemedButton>
          </ThemedView>
        </ThemedView>

        {/* Estadísticas */}
        {!loading && (
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
                  {nearbyStops.length}
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary">
                  Cercanas
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  resultCard: {
    marginBottom: 8,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultInfo: {
    flex: 1,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    minWidth: 60,
  },
  selectionCard: {
    marginBottom: 8,
  },
  selectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectionInfo: {
    flex: 1,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  planButton: {
    flex: 2,
  },
  statsCard: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
});