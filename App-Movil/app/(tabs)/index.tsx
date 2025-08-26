import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Alert, Dimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTransport } from '../../context/TransportContext';
import { useLocation } from '../../hooks/useLocation';
import { useTabBarPadding } from '../../hooks/useTabBarPadding';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { QuickAction } from '../../components/ui/QuickAction';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, userProfile, isAuthenticated, isGuest } = useAuth();
  const { paradas, rutas, buses, alertas, loading, error, refreshData, getParadasCercanas, getAlertasActivas } = useTransport();
  const { location, getCurrentLocation, requestPermission } = useLocation();
  const { theme } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const { getPaddingScaled, getMarginScaled, getMinTouchTarget } = useAccessibleFont();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Solo cargar datos una vez al montar el componente
    // Los datos ya se cargan automáticamente en TransportContext
    console.log('HomeScreen montado, datos se cargan automáticamente');
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      await getCurrentLocation();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLocationRequest = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        await getCurrentLocation();
      } else {
        Alert.alert(
          'Permisos requeridos',
          'Para mostrar paradas cercanas necesitamos acceso a tu ubicación.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  };

  const paradasCercanas = location 
    ? getParadasCercanas(location.latitude, location.longitude, 500)
    : [];

  const alertasActivas = getAlertasActivas();

  const getDisplayName = () => {
    if (isAuthenticated && userProfile?.displayName) {
      return userProfile.displayName;
    }
    if (isGuest) {
      return 'Invitado';
    }
    return 'Usuario';
  };

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={tabBarPadding}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section con color sólido del tema */}
        <ThemedView style={styles.heroSection} backgroundColor="primary">
          <ThemedView style={styles.heroContent} backgroundColor="transparent">
            <ThemedView style={styles.headerRow} backgroundColor="transparent">
              <ThemedView backgroundColor="transparent">
                <ThemedText variant="title" weight="bold" color="background" style={styles.heroTitle}>
                  ¡Hola, {getDisplayName()}! 👋
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.profileIcon} backgroundColor="transparent">
                <Icon 
                  name={isAuthenticated ? "account-circle" : "account-circle"} 
                  size="xl2" 
                  color={theme.colors.background} 
                />
              </ThemedView>
            </ThemedView>
            
            {isGuest && (
              <ThemedView style={styles.guestBadge} backgroundColor="transparent">
                <View style={styles.guestBadgeContent}>
                  <Icon name="info" color={theme.colors.primary} size="sm" />
                  <ThemedText variant="caption" color="primary" style={styles.guestText}>
                    Modo invitado activo
                  </ThemedText>
                </View>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        {/* Alertas con nuevo diseño */}
        {alertasActivas.length > 0 && (
          <View style={styles.sectionContainer}>
            <ThemedView style={styles.alertsContainer}>
              <View style={styles.warningIconContainer}>
                <Icon name="warning" color="warning" size="lg" />
              </View>
              <View style={styles.alertsContent}>
                <ThemedText variant="subtitle" weight="bold" style={styles.alertsTitle}>
                  Alertas importantes
                </ThemedText>
                {alertasActivas.slice(0, 2).map((alerta, index) => (
                  <ThemedView key={alerta.id} style={styles.alertItem}>
                    <ThemedText variant="body" weight="medium" numberOfLines={1}>
                      {alerta.titulo}
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary" numberOfLines={2} style={styles.alertMessage}>
                      {alerta.mensaje}
                    </ThemedText>
                  </ThemedView>
                ))}
              </View>
            </ThemedView>
          </View>
        )}

        {/* Quick Actions con diseño moderno tipo grid */}
        <View style={styles.sectionContainer}>
          <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
            ¿Qué quieres hacer?
          </ThemedText>
          
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="directions"
              title="Planificar"
              subtitle="Encuentra rutas"
              color="primary"
              onPress={() => router.push('/(tabs)/routes')}
              style={styles.quickActionCard}
            />

            <QuickAction
              icon="map"
              title="Mapa Live"
              subtitle="Buses en vivo"
              color="secondary"
              onPress={() => router.push('/map')}
              style={styles.quickActionCard}
            />

            <QuickAction
              icon="location-on"
              title="Paradas"
              subtitle="Cerca de ti"
              color="accent"
              onPress={() => router.push('/(tabs)/stops')}
              style={styles.quickActionCard}
            />

            <QuickAction
              icon="settings"
              title="Ajustes"
              subtitle="Personalizar"
              color="success"
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.quickActionCard}
            />
          </View>
        </View>

        {/* Sección de ubicación mejorada */}
        {!location ? (
          <View style={styles.sectionContainer}>
            <Card variant="outlined" padding="xl" margin="none">
              <View style={styles.locationPrompt}>
                <View style={styles.locationIconContainer}>
                  <Icon name="my-location" color="primary" size="xl2" />
                </View>
                <ThemedText variant="subtitle" weight="bold" style={styles.locationTitle}>
                  Ubicación requerida
                </ThemedText>
                <ThemedText variant="body" color="textSecondary" style={styles.locationText}>
                  Activa tu ubicación para encontrar paradas cercanas y obtener rutas personalizadas
                </ThemedText>
                <ThemedButton
                  variant="primary"
                  size="lg"
                  onPress={handleLocationRequest}
                  style={styles.locationButton}
                >
                  <Icon name="location-on" color="background" size="md" />
                  <ThemedText> Activar Ubicación</ThemedText>
                </ThemedButton>
              </View>
            </Card>
          </View>
        ) : (
          <View style={styles.sectionContainer}>
            <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
              Paradas cercanas
            </ThemedText>
            {paradasCercanas.length > 0 ? (
              <View style={styles.nearbyStopsContainer}>
                {paradasCercanas.slice(0, 3).map((parada, index) => (
                  <Card 
                    key={parada.id} 
                    interactive
                    variant="outlined"
                    padding="md"
                    margin="xs"
                    style={styles.stopCard}
                  >
                    <View style={styles.stopContent}>
                      <View style={styles.stopIcon}>
                        <Icon name="location-on" color="primary" size="lg" />
                      </View>
                      <View style={styles.stopInfo}>
                        <ThemedText variant="body" weight="semibold" numberOfLines={1}>
                          {parada.nombre}
                        </ThemedText>
                        <ThemedText variant="caption" color="textSecondary">
                          {parada.codigo ? `#${parada.codigo}` : 'Parada pública'}
                        </ThemedText>
                      </View>
                      <Icon name="chevron-right" color="textSecondary" size="md" />
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card variant="outlined" padding="lg" margin="none">
                <View style={styles.emptyState}>
                  <Icon name="search-off" color="textSecondary" size="xl" />
                  <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
                    No hay paradas cerca de tu ubicación
                  </ThemedText>
                </View>
              </Card>
            )}
          </View>
        )}

        {/* Estadísticas del sistema con diseño moderno */}
        <View style={styles.sectionContainer}>
          <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Sistema en tiempo real
          </ThemedText>
          
          <View style={styles.statsGrid}>
            <StatusIndicator
              icon="route"
              value={rutas.length}
              label="Rutas activas"
              color="primary"
              variant="compact"
              style={styles.statCard}
            />

            <StatusIndicator
              icon="directions-bus"
              value={buses.length}
              label="Buses en servicio"
              color="secondary"
              variant="compact"
              style={styles.statCard}
            />

            <StatusIndicator
              icon="place"
              value={paradas.length}
              label="Paradas disponibles"
              color="accent"
              variant="compact"
              style={styles.statCard}
            />
          </View>
        </View>

        {/* Espaciado final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Espacio para la tab bar
  },
  
  // Hero Section
  heroSection: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTitle: {
    marginBottom: 8,
  },
  profileIcon: {
    marginLeft: 16,
  },
  guestBadge: {
    marginTop: 12,
  },
  guestBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  guestText: {
    marginLeft: 6,
    fontWeight: '500',
  },

  // Secciones generales
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },

  // Alertas
  alertsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  alertsContent: {
    flex: 1,
  },
  alertsTitle: {
    marginBottom: 8,
  },
  alertItem: {
    marginBottom: 6,
  },
  alertMessage: {
    marginTop: 2,
    lineHeight: 16,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 52) / 2, // 20px padding * 2 + 12px gap
    marginBottom: 12,
  },
  // Ubicación
  locationPrompt: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationIconContainer: {
    marginBottom: 16,
  },
  locationTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  locationText: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Paradas cercanas
  nearbyStopsContainer: {
    gap: 8,
  },
  stopCard: {
    marginBottom: 8,
  },
  stopContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopIcon: {
    marginRight: 12,
  },
  stopInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
  },

  // Estadísticas
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 52) / 3 - 4, // 3 columnas con espaciado
    marginBottom: 12,
  },

  // Espaciado final
  bottomSpacer: {
    height: 20,
  },
});
