import React, { useState } from 'react';
import { StyleSheet, ScrollView, Modal, Switch } from 'react-native';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { ThemedTextInput } from './ui/ThemedTextInput';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';

export interface TripPreferencesData {
  maxWalkingDistance: number; // metros
  maxTransfers: number;
  preferFastest: boolean;
  departureTime: Date;
  avoidStairs: boolean;
  accessibleOnly: boolean;
  weatherConsideration: boolean;
  costOptimization: boolean;
}

interface TripPreferencesProps {
  visible: boolean;
  preferences: TripPreferencesData;
  onClose: () => void;
  onSave: (preferences: TripPreferencesData) => void;
}

const DEFAULT_PREFERENCES: TripPreferencesData = {
  maxWalkingDistance: 1000,
  maxTransfers: 3,
  preferFastest: true,
  departureTime: new Date(),
  avoidStairs: false,
  accessibleOnly: false,
  weatherConsideration: false,
  costOptimization: false,
};

export const TripPreferences: React.FC<TripPreferencesProps> = ({
  visible,
  preferences,
  onClose,
  onSave,
}) => {
  const [localPreferences, setLocalPreferences] = useState<TripPreferencesData>(preferences);

  const handleSave = () => {
    onSave(localPreferences);
    onClose();
  };

  const handleReset = () => {
    setLocalPreferences(DEFAULT_PREFERENCES);
  };

  const updatePreference = <K extends keyof TripPreferencesData>(
    key: K,
    value: TripPreferencesData[K]
  ) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTimeChange = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(localPreferences.departureTime);
    newDate.setHours(hours, minutes, 0, 0);
    updatePreference('departureTime', newDate);
  };

  const getWalkingDistanceLabel = (distance: number): string => {
    if (distance < 1000) return `${distance}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const walkingDistanceOptions = [
    { value: 200, label: '200m - Muy corta' },
    { value: 500, label: '500m - Corta' },
    { value: 1000, label: '1km - Moderada' },
    { value: 1500, label: '1.5km - Larga' },
    { value: 2000, label: '2km - Muy larga' },
  ];

  const maxTransfersOptions = [
    { value: 0, label: 'Sin transbordos' },
    { value: 1, label: 'Máximo 1' },
    { value: 2, label: 'Máximo 2' },
    { value: 3, label: 'Máximo 3' },
    { value: 5, label: 'Sin límite' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.container}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedButton variant="ghost" size="sm" onPress={onClose}>
            <Icon name="close" size="md" color="textPrimary" />
          </ThemedButton>
          
          <ThemedText variant="title" weight="bold">
            Preferencias de viaje
          </ThemedText>
          
          <ThemedButton variant="ghost" size="sm" onPress={handleReset}>
            <Icon name="refresh" size="md" color="textPrimary" />
          </ThemedButton>
        </ThemedView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Opciones de optimización */}
          <ThemedView style={styles.section}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Optimización de ruta
            </ThemedText>

            <Card style={styles.optionCard}>
              <ThemedView style={styles.optionContent}>
                <ThemedView style={styles.optionInfo}>
                  <ThemedText variant="body" weight="medium">
                    Priorizar velocidad
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Buscar las rutas más rápidas
                  </ThemedText>
                </ThemedView>
                <Switch
                  value={localPreferences.preferFastest}
                  onValueChange={(value) => updatePreference('preferFastest', value)}
                />
              </ThemedView>
            </Card>

            <Card style={styles.optionCard}>
              <ThemedView style={styles.optionContent}>
                <ThemedView style={styles.optionInfo}>
                  <ThemedText variant="body" weight="medium">
                    Optimización de costos
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Considerar tarifas más económicas
                  </ThemedText>
                </ThemedView>
                <Switch
                  value={localPreferences.costOptimization}
                  onValueChange={(value) => updatePreference('costOptimization', value)}
                />
              </ThemedView>
            </Card>
          </ThemedView>

          {/* Distancia máxima de caminata */}
          <ThemedView style={styles.section}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Distancia de caminata
            </ThemedText>
            
            <ThemedText variant="body" style={styles.currentValue}>
              Actual: {getWalkingDistanceLabel(localPreferences.maxWalkingDistance)}
            </ThemedText>

            {walkingDistanceOptions.map((option) => (
              <Card 
                key={option.value}
                style={[
                  styles.optionCard,
                  localPreferences.maxWalkingDistance === option.value && styles.selectedOption
                ]}
                onPress={() => updatePreference('maxWalkingDistance', option.value)}
              >
                <ThemedView style={styles.optionContent}>
                  <ThemedText variant="body">
                    {option.label}
                  </ThemedText>
                  {localPreferences.maxWalkingDistance === option.value && (
                    <Icon name="check-circle" size="sm" color="primary" />
                  )}
                </ThemedView>
              </Card>
            ))}
          </ThemedView>

          {/* Número máximo de transbordos */}
          <ThemedView style={styles.section}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Transbordos máximos
            </ThemedText>
            
            <ThemedText variant="body" style={styles.currentValue}>
              Actual: {maxTransfersOptions.find(o => o.value === localPreferences.maxTransfers)?.label}
            </ThemedText>

            {maxTransfersOptions.map((option) => (
              <Card 
                key={option.value}
                style={[
                  styles.optionCard,
                  localPreferences.maxTransfers === option.value && styles.selectedOption
                ]}
                onPress={() => updatePreference('maxTransfers', option.value)}
              >
                <ThemedView style={styles.optionContent}>
                  <ThemedText variant="body">
                    {option.label}
                  </ThemedText>
                  {localPreferences.maxTransfers === option.value && (
                    <Icon name="check-circle" size="sm" color="primary" />
                  )}
                </ThemedView>
              </Card>
            ))}
          </ThemedView>

          {/* Hora de salida */}
          <ThemedView style={styles.section}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Hora de salida
            </ThemedText>

            <Card style={styles.optionCard}>
              <ThemedView style={styles.optionContent}>
                <ThemedView style={styles.optionInfo}>
                  <ThemedText variant="body" weight="medium">
                    Hora preferida
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    {formatTime(localPreferences.departureTime)}
                  </ThemedText>
                </ThemedView>
                <ThemedButton
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    // En una implementación real, aquí abriríamos un time picker
                    const now = new Date();
                    updatePreference('departureTime', now);
                  }}
                >
                  <ThemedText color="primary">Ahora</ThemedText>
                </ThemedButton>
              </ThemedView>
            </Card>

            {/* Input manual de tiempo */}
            <ThemedTextInput
              placeholder="HH:MM"
              value={formatTime(localPreferences.departureTime)}
              onChangeText={handleTimeChange}
              keyboardType="numeric"
              style={styles.timeInput}
              leftIcon="schedule"
            />
          </ThemedView>

          {/* Opciones de accesibilidad */}
          <ThemedView style={styles.section}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Accesibilidad
            </ThemedText>

            <Card style={styles.optionCard}>
              <ThemedView style={styles.optionContent}>
                <ThemedView style={styles.optionInfo}>
                  <ThemedText variant="body" weight="medium">
                    Evitar escaleras
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Priorizar rutas sin escalones
                  </ThemedText>
                </ThemedView>
                <Switch
                  value={localPreferences.avoidStairs}
                  onValueChange={(value) => updatePreference('avoidStairs', value)}
                />
              </ThemedView>
            </Card>

            <Card style={styles.optionCard}>
              <ThemedView style={styles.optionContent}>
                <ThemedView style={styles.optionInfo}>
                  <ThemedText variant="body" weight="medium">
                    Solo transporte accesible
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Buses con acceso para sillas de ruedas
                  </ThemedText>
                </ThemedView>
                <Switch
                  value={localPreferences.accessibleOnly}
                  onValueChange={(value) => updatePreference('accessibleOnly', value)}
                />
              </ThemedView>
            </Card>
          </ThemedView>

          {/* Otras preferencias */}
          <ThemedView style={styles.section}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
              Otras opciones
            </ThemedText>

            <Card style={styles.optionCard}>
              <ThemedView style={styles.optionContent}>
                <ThemedView style={styles.optionInfo}>
                  <ThemedText variant="body" weight="medium">
                    Consideraciones climáticas
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Ajustar ruta según el clima
                  </ThemedText>
                </ThemedView>
                <Switch
                  value={localPreferences.weatherConsideration}
                  onValueChange={(value) => updatePreference('weatherConsideration', value)}
                />
              </ThemedView>
            </Card>
          </ThemedView>

          {/* Resumen de preferencias */}
          <Card style={styles.summaryCard}>
            <ThemedText variant="subtitle" weight="semibold" style={styles.summaryTitle}>
              Resumen de preferencias
            </ThemedText>
            
            <ThemedView style={styles.summaryContent}>
              <ThemedText variant="body">
                • Caminata máxima: {getWalkingDistanceLabel(localPreferences.maxWalkingDistance)}
              </ThemedText>
              <ThemedText variant="body">
                • Transbordos máximos: {localPreferences.maxTransfers === 5 ? 'Sin límite' : localPreferences.maxTransfers}
              </ThemedText>
              <ThemedText variant="body">
                • Hora de salida: {formatTime(localPreferences.departureTime)}
              </ThemedText>
              <ThemedText variant="body">
                • Prioridad: {localPreferences.preferFastest ? 'Velocidad' : 'Comodidad'}
              </ThemedText>
              {localPreferences.accessibleOnly && (
                <ThemedText variant="body">
                  • Solo transporte accesible
                </ThemedText>
              )}
            </ThemedView>
          </Card>
        </ScrollView>

        {/* Botones de acción */}
        <ThemedView style={styles.footer}>
          <ThemedButton
            variant="outline"
            size="md"
            onPress={onClose}
            style={styles.footerButton}
          >
            <ThemedText color="textSecondary">Cancelar</ThemedText>
          </ThemedButton>

          <ThemedButton
            variant="primary"
            size="md"
            onPress={handleSave}
            style={[styles.footerButton, styles.saveButton]}
          >
            <Icon name="check" size="sm" color="background" />
            <ThemedText color="background"> Guardar</ThemedText>
          </ThemedButton>
        </ThemedView>
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
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  currentValue: {
    marginBottom: 12,
    color: '#666',
  },
  optionCard: {
    marginBottom: 8,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionInfo: {
    flex: 1,
  },
  selectedOption: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  timeInput: {
    marginTop: 12,
  },
  summaryCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  summaryTitle: {
    marginBottom: 12,
  },
  summaryContent: {
    gap: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 2,
  },
});