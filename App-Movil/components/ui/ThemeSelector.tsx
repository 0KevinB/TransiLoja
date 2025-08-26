import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';
import { Card } from './Card';

export const ThemeSelector: React.FC = () => {
  const { theme, toggleTheme, setFontScale } = useTheme();
  const { fontScale } = useAccessibleFont();

  const themeOptions = [
    { mode: 'light' as const, label: 'Claro', icon: '☀️' },
    { mode: 'dark' as const, label: 'Oscuro', icon: '🌙' },
    { mode: 'high-contrast' as const, label: 'Alto Contraste', icon: '⚫' },
  ];

  const fontScaleOptions = [
    { scale: 0.8, label: 'Pequeño' },
    { scale: 1.0, label: 'Normal' },
    { scale: 1.2, label: 'Grande' },
    { scale: 1.5, label: 'Muy Grande' },
  ];

  return (
    <Card>
      <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
        Apariencia
      </ThemedText>

      {/* Selector de tema */}
      <ThemedView style={styles.optionGroup}>
        <ThemedText variant="body" weight="medium" style={styles.optionLabel}>
          Tema
        </ThemedText>
        <ThemedView style={styles.buttonGroup}>
          {themeOptions.map((option) => (
            <ThemedButton
              key={option.mode}
              variant={theme.mode === option.mode ? 'primary' : 'outline'}
              size="sm"
              onPress={() => toggleTheme(option.mode)}
              style={styles.themeButton}
            >
              <ThemedText>
                {option.icon} {option.label}
              </ThemedText>
            </ThemedButton>
          ))}
        </ThemedView>
      </ThemedView>

      {/* Selector de tamaño de fuente */}
      <ThemedView style={styles.optionGroup}>
        <ThemedText variant="body" weight="medium" style={styles.optionLabel}>
          Tamaño de Texto
        </ThemedText>
        <ThemedView style={styles.buttonGroup}>
          {fontScaleOptions.map((option) => (
            <ThemedButton
              key={option.scale}
              variant={Math.abs(fontScale - option.scale) < 0.1 ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setFontScale(option.scale)}
              style={styles.fontButton}
            >
              <ThemedText>
                {option.label}
              </ThemedText>
            </ThemedButton>
          ))}
        </ThemedView>
      </ThemedView>

      {/* Vista previa */}
      <ThemedView style={styles.preview}>
        <ThemedText variant="caption" color="textSecondary" style={styles.previewLabel}>
          Vista previa:
        </ThemedText>
        <Card variant="outlined" padding="sm" margin="xs">
          <ThemedText variant="body">
            Este es un ejemplo de cómo se ve el texto con la configuración actual.
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary" style={styles.previewDetail}>
            Tema: {themeOptions.find(t => t.mode === theme.mode)?.label} • 
            Tamaño: {fontScaleOptions.find(f => Math.abs(f.scale - fontScale) < 0.1)?.label}
          </ThemedText>
        </Card>
      </ThemedView>
    </Card>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 16,
  },
  optionGroup: {
    marginBottom: 20,
  },
  optionLabel: {
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeButton: {
    marginRight: 8,
    marginBottom: 8,
    minWidth: 120,
  },
  fontButton: {
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
  },
  preview: {
    marginTop: 8,
  },
  previewLabel: {
    marginBottom: 8,
  },
  previewDetail: {
    marginTop: 8,
  },
});