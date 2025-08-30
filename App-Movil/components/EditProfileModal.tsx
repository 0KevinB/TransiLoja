import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { ThemedTextInput } from './ui/ThemedTextInput';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { useTheme } from '../context/ThemeContext';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const { theme, toggleTheme, setFontScale } = useTheme();
  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [defaultLocationName, setDefaultLocationName] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'high-contrast'>('light');
  const [selectedFontScale, setSelectedFontScale] = useState(1.0);
  
  // Estados de validación
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (visible && userProfile) {
      setDisplayName(userProfile.displayName || '');
      setEmail(userProfile.email || '');
      setDefaultLocationName(userProfile.preferences?.defaultLocation?.name || '');
      setNotifications(userProfile.preferences?.notifications ?? true);
      setLocation(userProfile.preferences?.location ?? true);
      setSelectedTheme(userProfile.preferences?.theme === 'system' ? 'light' : userProfile.preferences?.theme || 'light');
      setSelectedFontScale(userProfile.preferences?.fontScale || 1.0);
      setErrors({});
    }
  }, [visible, userProfile]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'El nombre es requerido';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        displayName: displayName.trim(),
        email: email.trim(),
        preferences: {
          language: userProfile?.preferences?.language || 'es',
          notifications,
          location,
          theme: selectedTheme,
          fontScale: selectedFontScale,
          defaultLocation: defaultLocationName.trim() ? {
            lat: userProfile?.preferences?.defaultLocation?.lat || 0,
            lng: userProfile?.preferences?.defaultLocation?.lng || 0,
            name: defaultLocationName.trim(),
          } : undefined,
        },
      };

      // Aplicar cambios de tema inmediatamente
      toggleTheme(selectedTheme);
      setFontScale(selectedFontScale);

      await updateUserProfile(updateData);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setEmail(userProfile.email || '');
      setDefaultLocationName(userProfile.preferences?.defaultLocation?.name || '');
      setNotifications(userProfile.preferences?.notifications ?? true);
      setLocation(userProfile.preferences?.location ?? true);
      setSelectedTheme(userProfile.preferences?.theme === 'system' ? 'light' : userProfile.preferences?.theme || 'light');
      setSelectedFontScale(userProfile.preferences?.fontScale || 1.0);
    }
    setErrors({});
    onClose();
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

  const showThemeSelector = () => {
    Alert.alert(
      'Seleccionar Tema',
      'Elige el tema de la aplicación',
      [
        { text: 'Claro', onPress: () => setSelectedTheme('light') },
        { text: 'Oscuro', onPress: () => setSelectedTheme('dark') },
        { text: 'Alto Contraste', onPress: () => setSelectedTheme('high-contrast') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const showFontSizeSelector = () => {
    Alert.alert(
      'Tamaño de Fuente',
      'Selecciona el tamaño de fuente',
      [
        { text: 'Pequeño (0.8x)', onPress: () => setSelectedFontScale(0.8) },
        { text: 'Normal (1.0x)', onPress: () => setSelectedFontScale(1.0) },
        { text: 'Grande (1.2x)', onPress: () => setSelectedFontScale(1.2) },
        { text: 'Muy Grande (1.5x)', onPress: () => setSelectedFontScale(1.5) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container} backgroundColor="background">
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <ThemedView style={styles.header} backgroundColor="surface">
            <ThemedView style={styles.headerContent}>
              <ThemedButton
                variant="ghost"
                onPress={handleCancel}
                style={styles.cancelButton}
              >
                <Icon name="close" library="ionicons" size="lg" color="textSecondary" />
              </ThemedButton>
              
              <ThemedText variant="subtitle" weight="bold">
                Editar Perfil
              </ThemedText>
              
              <ThemedButton
                variant="ghost"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={styles.saveButton}
              >
                <ThemedText color="primary" weight="semibold">
                  Guardar
                </ThemedText>
              </ThemedButton>
            </ThemedView>
          </ThemedView>

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Card margin="md">
              <ThemedView style={styles.avatarSection}>
                <ThemedView style={styles.avatarContainer}>
                  <Icon name="account-circle" library="material" size={80} color="primary" />
                  <ThemedButton
                    variant="outline"
                    size="sm"
                    onPress={() => Alert.alert('Información', 'Cambio de foto próximamente')}
                    style={styles.changePhotoButton}
                  >
                    <Icon name="camera-alt" library="material" size="sm" color="primary" />
                    <ThemedText color="primary"> Cambiar foto</ThemedText>
                  </ThemedButton>
                </ThemedView>
              </ThemedView>
            </Card>

            <Card margin="md">
              <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
                Información Personal
              </ThemedText>

              <ThemedTextInput
                label="Nombre completo"
                value={displayName}
                onChangeText={setDisplayName}
                error={errors.displayName}
                placeholder="Ingresa tu nombre completo"
                autoCapitalize="words"
                style={styles.input}
              />

              <ThemedTextInput
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />

              <ThemedTextInput
                label="Ubicación por defecto (opcional)"
                value={defaultLocationName}
                onChangeText={setDefaultLocationName}
                placeholder="Ej: Casa, Trabajo, Universidad"
                autoCapitalize="words"
                style={styles.input}
              />
            </Card>

            <Card margin="md">
              <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
                Preferencias
              </ThemedText>

              <ThemedView style={styles.infoRow}>
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
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={theme.colors.background}
                />
              </ThemedView>

              <ThemedView style={styles.infoRow}>
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
                  value={location}
                  onValueChange={setLocation}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={theme.colors.background}
                />
              </ThemedView>
            </Card>

            <Card margin="md">
              <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
                Apariencia
              </ThemedText>

              <ThemedButton
                variant="ghost"
                onPress={showThemeSelector}
                style={styles.settingButton}
              >
                <ThemedView style={styles.settingContent}>
                  <ThemedView style={styles.settingInfo}>
                    <Icon name="color-palette" library="ionicons" color="primary" size="md" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText variant="body" weight="semibold">
                        Tema
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        {getThemeDisplayName(selectedTheme)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
                </ThemedView>
              </ThemedButton>

              <ThemedButton
                variant="ghost"
                onPress={showFontSizeSelector}
                style={styles.settingButton}
              >
                <ThemedView style={styles.settingContent}>
                  <ThemedView style={styles.settingInfo}>
                    <Icon name="text-fields" library="material" color="primary" size="md" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText variant="body" weight="semibold">
                        Tamaño de fuente
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        {getFontSizeDisplayName(selectedFontScale)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Icon name="chevron-forward" library="ionicons" color="textSecondary" size="sm" />
                </ThemedView>
              </ThemedButton>
            </Card>

            <Card margin="md">
              <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
                Información de Cuenta
              </ThemedText>

              <ThemedView style={styles.infoRow}>
                <ThemedText variant="body" color="textSecondary">
                  Usuario desde:
                </ThemedText>
                <ThemedText variant="body" weight="medium">
                  {userProfile?.createdAt?.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.infoRow}>
                <ThemedText variant="body" color="textSecondary">
                  Última actualización:
                </ThemedText>
                <ThemedText variant="body" weight="medium">
                  {userProfile?.updatedAt?.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </ThemedText>
              </ThemedView>
            </Card>

            {/* Espaciado final */}
            <ThemedView style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  cancelButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minWidth: 44,
    minHeight: 44,
  },
  saveButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minWidth: 60,
    minHeight: 44,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  changePhotoButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bottomSpacer: {
    height: 40,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    marginLeft: 12,
    flex: 1,
  },
  settingButton: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderRadius: 0,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
});