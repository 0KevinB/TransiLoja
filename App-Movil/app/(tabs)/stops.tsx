import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
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
import { Parada } from '../../lib/types';

export default function StopsScreen() {
  const { paradas, rutas, refreshData, getParadasCercanas } = useTransport();
  const { location, getCurrentLocation, requestPermission } = useLocation();
  const tabBarPadding = useTabBarPadding();
  const { getPaddingScaled, getMarginScaled, getMinTouchTarget } = useAccessibleFont();
  const [searchText, setSearchText] = useState('');
  const [filteredParadas, setFilteredParadas] = useState<Parada[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  useEffect(() => {
    filterParadas();
  }, [searchText, paradas, location, showNearby]);

  const filterParadas = () => {
    let filtered = paradas;

    if (showNearby && location) {
      filtered = getParadasCercanas(location.latitude, location.longitude, 1000);
    }

    if (searchText) {
      filtered = filtered.filter(parada =>
        parada.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
        (parada.codigo && parada.codigo.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredParadas(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLocationToggle = async () => {
    if (!location) {
      try {
        const granted = await requestPermission();
        if (granted) {
          await getCurrentLocation();
          setShowNearby(true);
        } else {
          Alert.alert(
            'Permisos requeridos',
            'Para mostrar paradas cercanas necesitamos acceso a tu ubicación.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo obtener la ubicación');
      }
    } else {
      setShowNearby(!showNearby);
    }
  };

  const getDistanceText = (parada: Parada): string | null => {
    if (!location) return null;

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      parada.ubicacion.latitud,
      parada.ubicacion.longitud
    );

    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3;
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

  const getRutasParaParada = (paradaId: string) => {
    return rutas.filter(ruta => ruta.paradas.includes(paradaId));
  };

  const renderParada = ({ item: parada }: { item: Parada }) => {
    const rutasParada = getRutasParaParada(parada.id);
    const distanceText = getDistanceText(parada);

    return (
      <Card margin="sm">
        <ThemedView style={styles.paradaHeader}>
          <ThemedView style={styles.paradaInfo}>
            <ThemedText variant="subtitle" weight="semibold">
              {parada.nombre}
            </ThemedText>
            <ThemedView style={styles.paradaDetails}>
              {parada.codigo && (
                <ThemedText variant="caption" color="textSecondary">
                  Código: {parada.codigo}
                </ThemedText>
              )}
              {distanceText && (
                <ThemedText variant="caption" color="primary">
                  📍 {distanceText}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
          
          <ThemedButton
            variant="ghost"
            size="sm"
            onPress={() => Alert.alert('Información', 'Ver en mapa próximamente')}
          >
            <Icon name="map" color="primary" size="sm" />
          </ThemedButton>
        </ThemedView>

        {rutasParada.length > 0 && (
          <ThemedView style={styles.rutasContainer}>
            <ThemedText variant="caption" color="textSecondary" style={styles.rutasLabel}>
              Rutas que pasan:
            </ThemedText>
            <ThemedView style={styles.rutasList}>
              {rutasParada.map((ruta) => (
                <ThemedView
                  key={ruta.id}
                  style={[styles.rutaChip, { borderColor: ruta.color || '#3B82F6' }]}
                >
                  <ThemedText
                    variant="caption"
                    weight="semibold"
                    style={{ color: ruta.color || '#3B82F6' }}
                  >
                    {ruta.numero}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        )}

        <ThemedView style={styles.paradaActions}>
          <ThemedButton
            variant="outline"
            size="sm"
            onPress={() => Alert.alert('Información', 'Horarios próximamente')}
            style={styles.actionButton}
          >
            <Icon name="schedule" size="sm" color="primary" />
            <ThemedText color="primary"> Horarios</ThemedText>
          </ThemedButton>
          
          <ThemedButton
            variant="outline"
            size="sm"
            onPress={() => Alert.alert('Información', 'Favoritos próximamente')}
            style={styles.actionButton}
          >
            <Icon name="favorite-border" size="sm" color="secondary" />
            <ThemedText color="secondary"> Favorito</ThemedText>
          </ThemedButton>
        </ThemedView>
      </Card>
    );
  };

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <ThemedView style={styles.header}>
        <ThemedText variant="title">Paradas</ThemedText>
        <ThemedText variant="body" color="textSecondary">
          Encuentra paradas de transporte público
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.searchContainer}>
        <ThemedTextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar parada por nombre o código..."
          icon={<Icon name="search" color="textSecondary" />}
        />
        
        <ThemedView style={styles.filterButtons}>
          <ThemedButton
            variant={showNearby ? "primary" : "outline"}
            size="sm"
            onPress={handleLocationToggle}
            style={styles.filterButton}
          >
            <Icon 
              name={location ? (showNearby ? "location-on" : "location-off") : "location-disabled"} 
              size="sm" 
              color={showNearby ? "background" : "primary"} 
            />
            <ThemedText color={showNearby ? "background" : "primary"}>
              {" "}Cercanas
            </ThemedText>
          </ThemedButton>
          
          <ThemedText variant="caption" color="textSecondary">
            {filteredParadas.length} parada{filteredParadas.length !== 1 ? 's' : ''}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {filteredParadas.length > 0 ? (
        <FlatList
          data={filteredParadas}
          renderItem={renderParada}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          style={styles.list}
          contentContainerStyle={[styles.listContent, tabBarPadding]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ThemedView style={styles.emptyState}>
          <Icon 
            name={searchText ? "search-off" : "location-city"} 
            color="textSecondary" 
            size="xl" 
          />
          <ThemedText variant="subtitle" color="textSecondary" style={styles.emptyTitle}>
            {searchText ? 'Sin resultados' : 'No hay paradas'}
          </ThemedText>
          <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
            {searchText 
              ? 'Intenta con otros términos de búsqueda'
              : showNearby 
                ? 'No hay paradas cercanas a tu ubicación'
                : 'No hay paradas disponibles en este momento'
            }
          </ThemedText>
          
          {!location && !searchText && (
            <ThemedButton
              variant="primary"
              onPress={handleLocationToggle}
              style={styles.emptyButton}
            >
              Activar Ubicación
            </ThemedButton>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  paradaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paradaInfo: {
    flex: 1,
  },
  paradaDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  rutasContainer: {
    marginBottom: 12,
  },
  rutasLabel: {
    marginBottom: 8,
  },
  rutasList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rutaChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  paradaActions: {
    flexDirection: 'row',
    gap: 8,
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
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
});