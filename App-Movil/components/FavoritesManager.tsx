import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTransport } from '../context/TransportContext';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { useTheme } from '../context/ThemeContext';

export const FavoritesManager: React.FC = () => {
  const { userProfile, addFavoriteStop, removeFavoriteStop, addFavoriteRoute, removeFavoriteRoute, isAuthenticated } = useAuth();
  const { paradas, rutas } = useTransport();
  const { theme } = useTheme();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  if (!isAuthenticated || !userProfile) {
    return (
      <Card margin="md">
        <ThemedView style={styles.emptyState}>
          <Icon name="star-outline" library="ionicons" size="xl" color="textSecondary" />
          <ThemedText variant="subtitle" weight="semibold" style={styles.emptyTitle}>
            Inicia sesión para guardar favoritos
          </ThemedText>
          <ThemedText variant="body" color="textSecondary" style={styles.emptyDescription}>
            Guarda tus paradas y rutas favoritas para acceder rápidamente a ellas
          </ThemedText>
        </ThemedView>
      </Card>
    );
  }

  const favoriteStops = paradas.filter(parada => 
    userProfile.favoriteStops.includes(parada.id)
  );

  const favoriteRoutes = rutas.filter(ruta => 
    userProfile.favoriteRoutes.includes(ruta.id)
  );

  const handleToggleStopFavorite = async (stopId: string) => {
    const key = `stop-${stopId}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      if (userProfile.favoriteStops.includes(stopId)) {
        await removeFavoriteStop(stopId);
      } else {
        await addFavoriteStop(stopId);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar los favoritos');
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleToggleRouteFavorite = async (routeId: string) => {
    const key = `route-${routeId}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      if (userProfile.favoriteRoutes.includes(routeId)) {
        await removeFavoriteRoute(routeId);
      } else {
        await addFavoriteRoute(routeId);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar los favoritos');
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Paradas Favoritas */}
      <Card margin="md">
        <ThemedView style={styles.sectionHeader}>
          <Icon name="location-on" library="material" size="lg" color="primary" />
          <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Paradas Favoritas
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary">
            {favoriteStops.length}
          </ThemedText>
        </ThemedView>

        {favoriteStops.length > 0 ? (
          favoriteStops.map((parada) => (
            <Card
              key={parada.id}
              variant="outlined"
              padding="md"
              margin="xs"
              style={styles.favoriteItem}
            >
              <ThemedView style={styles.favoriteContent}>
                <ThemedView style={styles.favoriteInfo}>
                  <ThemedText variant="body" weight="semibold" numberOfLines={1}>
                    {parada.nombre}
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    {parada.codigo ? `Código: ${parada.codigo}` : 'Parada pública'}
                  </ThemedText>
                </ThemedView>
                
                <ThemedButton
                  variant="ghost"
                  onPress={() => handleToggleStopFavorite(parada.id)}
                  loading={loading[`stop-${parada.id}`]}
                  style={styles.favoriteButton}
                >
                  <Icon 
                    name="star" 
                    library="ionicons" 
                    size="md" 
                    color="warning" 
                  />
                </ThemedButton>
              </ThemedView>
            </Card>
          ))
        ) : (
          <ThemedView style={styles.emptySection}>
            <Icon name="star-outline" library="ionicons" size="lg" color="textSecondary" />
            <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
              No tienes paradas favoritas aún
            </ThemedText>
          </ThemedView>
        )}
      </Card>

      {/* Rutas Favoritas */}
      <Card margin="md">
        <ThemedView style={styles.sectionHeader}>
          <Icon name="directions" library="material" size="lg" color="secondary" />
          <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Rutas Favoritas
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary">
            {favoriteRoutes.length}
          </ThemedText>
        </ThemedView>

        {favoriteRoutes.length > 0 ? (
          favoriteRoutes.map((ruta) => (
            <Card
              key={ruta.id}
              variant="outlined"
              padding="md"
              margin="xs"
              style={styles.favoriteItem}
            >
              <ThemedView style={styles.favoriteContent}>
                <ThemedView style={styles.favoriteInfo}>
                  <ThemedView style={styles.routeHeader}>
                    <ThemedView 
                      style={[
                        styles.routeColorIndicator, 
                        { backgroundColor: ruta.color || theme.colors.secondary }
                      ]} 
                    />
                    <ThemedText variant="body" weight="semibold" numberOfLines={1}>
                      {ruta.nombre_corto || ruta.nombre_largo}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
                    {ruta.nombre_largo}
                  </ThemedText>
                </ThemedView>
                
                <ThemedButton
                  variant="ghost"
                  onPress={() => handleToggleRouteFavorite(ruta.id)}
                  loading={loading[`route-${ruta.id}`]}
                  style={styles.favoriteButton}
                >
                  <Icon 
                    name="star" 
                    library="ionicons" 
                    size="md" 
                    color="warning" 
                  />
                </ThemedButton>
              </ThemedView>
            </Card>
          ))
        ) : (
          <ThemedView style={styles.emptySection}>
            <Icon name="star-outline" library="ionicons" size="lg" color="textSecondary" />
            <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
              No tienes rutas favoritas aún
            </ThemedText>
          </ThemedView>
        )}
      </Card>

      {/* Información */}
      <Card margin="md" variant="outlined">
        <ThemedView style={styles.infoContainer}>
          <Icon name="info" library="ionicons" size="md" color="primary" />
          <ThemedText variant="caption" color="textSecondary" style={styles.infoText}>
            Toca el ícono de estrella en paradas y rutas para agregarlas a tus favoritos
          </ThemedText>
        </ThemedView>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 12,
    flex: 1,
  },
  favoriteItem: {
    marginBottom: 8,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginLeft: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 22,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
});