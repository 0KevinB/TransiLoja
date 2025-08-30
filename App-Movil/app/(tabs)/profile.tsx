import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTabBarPadding } from '../../hooks/useTabBarPadding';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { EditProfileModal } from '../../components/EditProfileModal';
import { FavoritesManager } from '../../components/FavoritesManager';

export default function ProfileScreen() {
  const { user, userProfile, logout, updateUserProfile, isAuthenticated, isGuest } = useAuth();
  const { theme, toggleTheme, setFontScale, syncWithUserProfile } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const { getPaddingScaled, getMarginScaled, getMinTouchTarget } = useAccessibleFont();
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'settings'>('profile');

  // Sincronizar tema con perfil de usuario cuando cambie
  useEffect(() => {
    const syncProfile = async () => {
      if (userProfile && isAuthenticated) {
        try {
          await syncWithUserProfile(userProfile);
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      }
    };
    
    syncProfile();
  }, [userProfile, isAuthenticated, syncWithUserProfile]);

  // Función auxiliar para crear preferencias completas
  const createCompletePreferences = (updates: any) => ({
    language: userProfile?.preferences?.language || 'es',
    notifications: userProfile?.preferences?.notifications ?? true,
    theme: userProfile?.preferences?.theme || 'light',
    fontScale: userProfile?.preferences?.fontScale || 1.0,
    location: userProfile?.preferences?.location ?? true,
    defaultLocation: userProfile?.preferences?.defaultLocation,
    ...updates,
  });

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?\n\nPerderás el acceso a tus favoritos y preferencias guardadas hasta que vuelvas a iniciar sesión.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              // Redireccionar según la estructura de rutas
              router.replace('/auth/index' as any);
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión. Inténtalo de nuevo.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!isAuthenticated) {
      Alert.alert('Función no disponible', 'Inicia sesión para personalizar tus preferencias');
      return;
    }
    
    try {
      await updateUserProfile({
        preferences: createCompletePreferences({ notifications: value }),
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      Alert.alert('Error', 'No se pudieron actualizar las preferencias de notificaciones');
    }
  };

  const handleToggleLocation = async (value: boolean) => {
    if (!isAuthenticated) {
      Alert.alert('Función no disponible', 'Inicia sesión para personalizar tus preferencias');
      return;
    }
    
    try {
      await updateUserProfile({
        preferences: createCompletePreferences({ location: value }),
      });
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'No se pudieron actualizar las preferencias de ubicación');
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'high-contrast') => {
    try {
      // Aplicar tema inmediatamente
      await toggleTheme(newTheme);
      
      // Guardar en Firebase si el usuario está autenticado
      if (isAuthenticated && userProfile) {
        try {
          await updateUserProfile({
            preferences: createCompletePreferences({ theme: newTheme }),
          });
          console.log('Theme preference saved to Firebase successfully');
        } catch (firebaseError) {
          console.warn('Failed to save theme to Firebase, but local update succeeded:', firebaseError);
          // No mostrar error ya que el tema sí cambió localmente
        }
      }
      
      // Mostrar confirmación siempre (porque el cambio local sí funcionó)
      Alert.alert('Tema actualizado', `Se cambió al tema ${getThemeDisplayName(newTheme).toLowerCase()}`);
    } catch (error) {
      console.error('Error updating theme locally:', error);
      Alert.alert('Error', 'No se pudo cambiar el tema');
    }
  };

  const handleFontScaleChange = async (newScale: number) => {
    try {
      // Aplicar escala inmediatamente
      await setFontScale(newScale);
      
      // Guardar en Firebase si el usuario está autenticado
      if (isAuthenticated && userProfile) {
        try {
          await updateUserProfile({
            preferences: createCompletePreferences({ fontScale: newScale }),
          });
          console.log('Font scale preference saved to Firebase successfully');
        } catch (firebaseError) {
          console.warn('Failed to save font scale to Firebase, but local update succeeded:', firebaseError);
          // No mostrar error ya que el cambio local sí funcionó
        }
      }
      
      // Mostrar confirmación siempre (porque el cambio local sí funcionó)
      Alert.alert('Tamaño de fuente actualizado', `Se cambió a ${getFontSizeDisplayName(newScale)}`);
    } catch (error) {
      console.error('Error updating font scale locally:', error);
      Alert.alert('Error', 'No se pudo cambiar el tamaño de fuente');
    }
  };

  const showThemeSelector = () => {
    console.log('🎨 Mostrando selector de tema');
    Alert.alert(
      'Seleccionar Tema',
      'Elige el tema de la aplicación',
      [
        { text: 'Claro', onPress: () => handleThemeChange('light') },
        { text: 'Oscuro', onPress: () => handleThemeChange('dark') },
        { text: 'Alto Contraste', onPress: () => handleThemeChange('high-contrast') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const showFontSizeSelector = () => {
    console.log('📝 Mostrando selector de tamaño de fuente');
    Alert.alert(
      'Tamaño de Fuente',
      'Selecciona el tamaño de fuente',
      [
        { text: 'Pequeño (0.8x)', onPress: () => handleFontScaleChange(0.8) },
        { text: 'Normal (1.0x)', onPress: () => handleFontScaleChange(1.0) },
        { text: 'Grande (1.2x)', onPress: () => handleFontScaleChange(1.2) },
        { text: 'Muy Grande (1.5x)', onPress: () => handleFontScaleChange(1.5) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const getThemeDisplayName = (mode: string) => {
    switch (mode) {
      case 'light': return 'Claro';
      case 'dark': return 'Oscuro';
      case 'high-contrast': return 'Alto Contraste';
      default: return 'Claro';
    }
  };

  const getFontSizeDisplayName = (scale: number) => {
    if (scale <= 0.8) return 'Pequeño';
    if (scale <= 1.0) return 'Normal';
    if (scale <= 1.2) return 'Grande';
    return 'Muy Grande';
  };

  const handleLoginPress = () => {
    router.push('/auth/index' as any);
  };

  // Crear estilos dinámicos basados en configuraciones de accesibilidad
  const createDynamicStyles = () => {
    const minTouchTarget = getMinTouchTarget();
    const scaledPadding = getPaddingScaled(16);
    const scaledMargin = getMarginScaled(16);
    
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      scrollView: {
        flex: 1,
      },
      header: {
        paddingTop: 60,
        paddingBottom: getPaddingScaled(20),
        paddingHorizontal: scaledPadding,
      },
      centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: scaledMargin,
      },
      avatarContainer: {
        marginRight: scaledMargin,
      },
      userInfo: {
        flex: 1,
      },
      sectionTitle: {
        marginBottom: scaledMargin,
      },
      preferenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: getPaddingScaled(12),
        minHeight: minTouchTarget,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      preferenceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      preferenceText: {
        marginLeft: getPaddingScaled(12),
        flex: 1,
      },
      settingButton: {
        paddingHorizontal: 0,
        paddingVertical: getPaddingScaled(12),
        minHeight: minTouchTarget,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        borderRadius: 0,
      },
      settingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        minHeight: minTouchTarget,
      },
      settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      settingText: {
        marginLeft: getPaddingScaled(12),
        flex: 1,
      },
      logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: minTouchTarget,
        borderColor: theme.colors.error,
      },
      footer: {
        paddingVertical: getPaddingScaled(32),
        alignItems: 'center',
      },
      footerText: {
        textAlign: 'center',
      },
      tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
      },
      tabButton: {
        flex: 1,
        marginHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: minTouchTarget,
        paddingVertical: getPaddingScaled(8),
      },
      activeTab: {
        elevation: 2,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      logoutWarning: {
        marginTop: getMarginScaled(8),
        textAlign: 'center',
        fontStyle: 'italic',
      },
      editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: minTouchTarget,
      },
      statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: getPaddingScaled(8),
      },
      statItem: {
        alignItems: 'center',
        paddingHorizontal: getPaddingScaled(8),
      },
      memberSince: {
        marginTop: getMarginScaled(4),
      },
    });
  };

  const styles = createDynamicStyles();

  if (isGuest || !isAuthenticated) {
    return (
      <ThemedView style={styles.container} backgroundColor="background">
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={tabBarPadding}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.header}>
            <ThemedText variant="title">Perfil</ThemedText>
          </ThemedView>

          {/* Perfil de invitado */}
          <Card margin="md">
            <ThemedView style={styles.profileInfo}>
              <ThemedView style={styles.avatarContainer}>
                <Icon name="account-circle" size={80} color="textSecondary" />
              </ThemedView>
              <ThemedView style={styles.userInfo}>
                <ThemedText variant="subtitle" weight="semibold">
                  Usuario Invitado
                </ThemedText>
                <ThemedText variant="body" color="textSecondary">
                  Acceso limitado a funciones básicas
                </ThemedText>
              </ThemedView>
            </ThemedView>
            
            <ThemedButton
              variant="primary"
              onPress={handleLoginPress}
            >
              Iniciar Sesión
            </ThemedButton>
          </Card>

          {/* Configuración básica disponible para invitados */}
          <Card margin="md">
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Apariencia
            </ThemedText>

            <TouchableOpacity
              onPress={showThemeSelector}
              style={[styles.settingButton, { backgroundColor: 'transparent' }]}
              activeOpacity={0.7}
            >
              <ThemedView style={styles.settingContent}>
                <ThemedView style={styles.settingInfo}>
                  <Icon name="color-palette" library="ionicons" color="primary" size="md" />
                  <ThemedView style={styles.settingText}>
                    <ThemedText variant="body" weight="semibold">
                      Tema
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      {getThemeDisplayName(theme.mode)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
              </ThemedView>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={showFontSizeSelector}
              style={[styles.settingButton, { backgroundColor: 'transparent' }]}
              activeOpacity={0.7}
            >
              <ThemedView style={styles.settingContent}>
                <ThemedView style={styles.settingInfo}>
                  <Icon name="text-fields" library="material" color="primary" size="md" />
                  <ThemedView style={styles.settingText}>
                    <ThemedText variant="body" weight="semibold">
                      Tamaño de fuente
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      {getFontSizeDisplayName(theme.fontScale)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
              </ThemedView>
            </TouchableOpacity>
          </Card>

          {/* Información de la App */}
          <Card margin="md">
            <ThemedText variant="subtitle" style={styles.sectionTitle}>
              Información
            </ThemedText>

            <TouchableOpacity
              onPress={() => Alert.alert(
                'Acerca de TransiLoja', 
                'Versión 1.0.0 Beta\n\nTransiLoja es una aplicación móvil diseñada para mejorar la experiencia del transporte público en Loja, Ecuador.\n\n✨ Características principales:\n• Rutas optimizadas con algoritmo RAPTOR\n• Seguimiento de buses en tiempo real\n• Paradas favoritas personalizables\n• Alertas y notificaciones\n• Modo offline básico\n\n📍 Desarrollada específicamente para el sistema de transporte de Loja\n\n🚀 ¡Gracias por usar TransiLoja!',
                [{ text: 'Entendido' }]
              )}
              style={[styles.settingButton, { backgroundColor: 'transparent' }]}
              activeOpacity={0.7}
            >
              <ThemedView style={styles.settingContent}>
                <ThemedView style={styles.settingInfo}>
                  <Icon name="info" color="primary" size="md" />
                  <ThemedView style={styles.settingText}>
                    <ThemedText variant="body" weight="semibold">
                      Acerca de
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      Versión y información de la app
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <Icon name="chevron-right" color="textSecondary" size="sm" />
              </ThemedView>
            </TouchableOpacity>
          </Card>

          <ThemedView style={styles.footer}>
            <ThemedText variant="caption" color="textSecondary" style={styles.footerText}>
              TransiLoja v1.0.0
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }

  const renderTabButtons = () => (
    <Card margin="md">
      <ThemedView style={styles.tabContainer}>
        <ThemedButton
          variant={activeTab === 'profile' ? 'primary' : 'ghost'}
          size="sm"
          onPress={() => setActiveTab('profile')}
          style={[styles.tabButton, activeTab === 'profile' && styles.activeTab]}
        >
          <Icon name="person" library="ionicons" size="sm" color={activeTab === 'profile' ? 'background' : 'textSecondary'} />
          <ThemedText color={activeTab === 'profile' ? 'background' : 'textSecondary'}> Perfil</ThemedText>
        </ThemedButton>

        <ThemedButton
          variant={activeTab === 'favorites' ? 'primary' : 'ghost'}
          size="sm"
          onPress={() => setActiveTab('favorites')}
          style={[styles.tabButton, activeTab === 'favorites' && styles.activeTab]}
        >
          <Icon name="star" library="ionicons" size="sm" color={activeTab === 'favorites' ? 'background' : 'textSecondary'} />
          <ThemedText color={activeTab === 'favorites' ? 'background' : 'textSecondary'}> Favoritos</ThemedText>
        </ThemedButton>

        <ThemedButton
          variant={activeTab === 'settings' ? 'primary' : 'ghost'}
          size="sm"
          onPress={() => setActiveTab('settings')}
          style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
        >
          <Icon name="settings" library="ionicons" size="sm" color={activeTab === 'settings' ? 'background' : 'textSecondary'} />
          <ThemedText color={activeTab === 'settings' ? 'background' : 'textSecondary'}> Ajustes</ThemedText>
        </ThemedButton>
      </ThemedView>
    </Card>
  );

  const renderProfileContent = () => (
    <>
      {/* Información del Usuario */}
      <Card margin="md">
        <ThemedView style={styles.profileInfo}>
          <ThemedView style={styles.avatarContainer}>
            <Icon name="account-circle" library="material" size={80} color="primary" />
          </ThemedView>
          <ThemedView style={styles.userInfo}>
            <ThemedText variant="subtitle" weight="semibold">
              {userProfile?.displayName || 'Usuario'}
            </ThemedText>
            <ThemedText variant="body" color="textSecondary">
              {user?.email}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary" style={styles.memberSince}>
              Miembro desde {userProfile?.createdAt?.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <ThemedButton
          variant="outline"
          size="lg"
          onPress={() => setEditModalVisible(true)}
          style={styles.editButton}
        >
          <Icon name="edit" library="material" size="md" color="primary" />
          <ThemedText color="primary"> Editar Perfil</ThemedText>
        </ThemedButton>
      </Card>

      {/* Estadísticas de Usuario */}
      <Card margin="md">
        <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
          Mi Actividad
        </ThemedText>
        
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statItem}>
            <ThemedText variant="xl" weight="bold" color="primary">
              {userProfile?.favoriteStops?.length || 0}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              Paradas favoritas
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statItem}>
            <ThemedText variant="xl" weight="bold" color="secondary">
              {userProfile?.favoriteRoutes?.length || 0}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              Rutas favoritas
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statItem}>
            <ThemedText variant="xl" weight="bold" color="accent">
              {/* Aquí podrías agregar más estadísticas como viajes realizados */}
              -
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              Viajes realizados
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </Card>
    </>
  );

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={tabBarPadding}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.header}>
          <ThemedText variant="title" weight="bold">Perfil</ThemedText>
        </ThemedView>

        {/* Navegación por pestañas */}
        {renderTabButtons()}

        {/* Contenido según pestaña activa */}
        {activeTab === 'profile' && renderProfileContent()}
        {activeTab === 'favorites' && <FavoritesManager />}
        {activeTab === 'settings' && (
          <>
            {/* Preferencias */}
            <Card margin="md">
              <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
                Preferencias
              </ThemedText>

          <ThemedView style={styles.preferenceItem}>
            <ThemedView style={styles.preferenceInfo}>
              <Icon name="notifications" color="primary" size="md" />
              <ThemedView style={styles.preferenceText}>
                <ThemedText variant="body" weight="semibold">
                  Notificaciones
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary">
                  Recibir alertas y actualizaciones
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <Switch
              value={userProfile?.preferences?.notifications ?? true}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.background}
            />
          </ThemedView>

          <ThemedView style={styles.preferenceItem}>
            <ThemedView style={styles.preferenceInfo}>
              <Icon name="location-on" color="primary" size="md" />
              <ThemedView style={styles.preferenceText}>
                <ThemedText variant="body" weight="semibold">
                  Ubicación
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary">
                  Permitir acceso a ubicación
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <Switch
              value={userProfile?.preferences?.location ?? true}
              onValueChange={handleToggleLocation}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.background}
            />
          </ThemedView>
        </Card>

            {/* Apariencia */}
            <Card margin="md">
              <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
                Apariencia
              </ThemedText>

              <TouchableOpacity
                onPress={showThemeSelector}
                style={[styles.settingButton, { backgroundColor: 'transparent' }]}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.settingContent}>
                  <ThemedView style={styles.settingInfo}>
                    <Icon name="color-palette" library="ionicons" color="primary" size="md" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText variant="body" weight="semibold">
                        Tema
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        {getThemeDisplayName(theme.mode)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
                </ThemedView>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={showFontSizeSelector}
                style={[styles.settingButton, { backgroundColor: 'transparent' }]}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.settingContent}>
                  <ThemedView style={styles.settingInfo}>
                    <Icon name="text-fields" library="material" color="primary" size="md" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText variant="body" weight="semibold">
                        Tamaño de fuente
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        {getFontSizeDisplayName(theme.fontScale)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
                </ThemedView>
              </TouchableOpacity>
            </Card>

            {/* Información de la App */}
            <Card margin="md">
              <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
                Información
              </ThemedText>

              <TouchableOpacity
                onPress={() => Alert.alert(
                  'Acerca de TransiLoja', 
                  'Versión 1.0.0 Beta\n\nTransiLoja es una aplicación móvil diseñada para mejorar la experiencia del transporte público en Loja, Ecuador.\n\n✨ Características principales:\n• Rutas optimizadas con algoritmo RAPTOR\n• Seguimiento de buses en tiempo real\n• Paradas favoritas personalizables\n• Alertas y notificaciones\n• Modo offline básico\n\n📍 Desarrollada específicamente para el sistema de transporte de Loja\n\n🚀 ¡Gracias por usar TransiLoja!',
                  [{ text: 'Entendido' }]
                )}
                style={[styles.settingButton, { backgroundColor: 'transparent' }]}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.settingContent}>
                  <ThemedView style={styles.settingInfo}>
                    <Icon name="info" library="ionicons" color="primary" size="md" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText variant="body" weight="semibold">
                        Acerca de
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        Versión 1.0.0 - TransiLoja
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
                </ThemedView>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Alert.alert(
                  'Ayuda y Soporte', 
                  '¿Necesitas ayuda? Aquí tienes algunas opciones:\n\n📋 Preguntas Frecuentes:\n• ¿Cómo buscar rutas?\n• ¿Cómo agregar paradas favoritas?\n• ¿Cómo funcionan las notificaciones?\n\n💬 Soporte:\n• Reportar problemas técnicos\n• Sugerir mejoras\n• Contactar al equipo de desarrollo\n\n📧 Email: soporte@transiloja.ec\n📱 WhatsApp: +593 98 765 4321\n\n⚠️ Nota: Algunas funciones pueden estar en desarrollo.',
                  [{ text: 'Entendido' }]
                )}
                style={[styles.settingButton, { backgroundColor: 'transparent' }]}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.settingContent}>
                  <ThemedView style={styles.settingInfo}>
                    <Icon name="help-circle" library="ionicons" color="primary" size="md" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText variant="body" weight="semibold">
                        Ayuda y Soporte
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        FAQ y contacto
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
                </ThemedView>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Alert.alert(
                  'Información Técnica', 
                  '🔧 Detalles Técnicos:\n\nVersión: 1.0.0 Beta\nPlataforma: React Native con Expo\nBackend: Firebase\nMapas: React Native Maps\nAlgoritmo de rutas: RAPTOR\n\n📊 Estadísticas:\n• Paradas registradas: 150+\n• Rutas disponibles: 25+\n• Cobertura: Ciudad de Loja\n\n🔒 Privacidad:\n• Datos encriptados\n• Solo ubicación necesaria\n• Sin compartir información personal\n\n📱 Compatibilidad:\n• Android 6.0+\n• iOS 12.0+\n• Modo offline parcial',
                  [{ text: 'Entendido' }]
                )}
                style={[styles.settingButton, { backgroundColor: 'transparent' }]}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.settingContent}>
                  <ThemedView style={styles.settingInfo}>
                    <Icon name="code" library="ionicons" color="primary" size="md" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText variant="body" weight="semibold">
                        Información Técnica
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        Detalles técnicos y estadísticas
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
                </ThemedView>
              </TouchableOpacity>
            </Card>

            {/* Cerrar Sesión */}
            <Card margin="md" variant="outlined">
              <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
                Zona de Peligro
              </ThemedText>
              
              <ThemedButton
                variant="outline"
                loading={loading}
                onPress={handleLogout}
                style={styles.logoutButton}
              >
                <Icon name="log-out" library="ionicons" color="error" size="md" />
                <ThemedText color="error"> Cerrar Sesión</ThemedText>
              </ThemedButton>
              
              <ThemedText variant="caption" color="textSecondary" style={styles.logoutWarning}>
                Al cerrar sesión perderás el acceso a tus favoritos y preferencias guardadas.
              </ThemedText>
            </Card>
          </>
        )}

        <ThemedView style={styles.footer}>
          <ThemedText variant="caption" color="textSecondary" style={styles.footerText}>
            TransiLoja v1.0.0
          </ThemedText>
        </ThemedView>
      </ScrollView>

      {/* Modal de edición de perfil */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={() => {
          // Recargar datos del perfil si es necesario
        }}
      />
    </ThemedView>
  );
}