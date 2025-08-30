import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Icon } from './ui/Icon';
import { useTheme } from '../context/ThemeContext';

interface LoadingScreenProps {
  message?: string;
  showIcon?: boolean;
  timeout?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Iniciando...',
  showIcon = true,
  timeout = 4000, // 4 segundos timeout por defecto
}) => {
  const { theme } = useTheme();
  const [showSkipButton, setShowSkipButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkipButton(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  const handleSkip = () => {
    // Si hay timeout, forzar salir del loading
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      <ThemedView style={styles.content}>
        {showIcon && (
          <Icon 
            name="directions-bus" 
            size={60} 
            color="primary"
          />
        )}
        
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.spinner}
        />
        
        <ThemedText variant="body" style={styles.message}>
          {message}
        </ThemedText>
        
        {showSkipButton && (
          <ThemedView style={styles.skipContainer}>
            <ThemedText variant="caption" color="textSecondary" style={styles.skipText}>
              ¿Tarda mucho en cargar?
            </ThemedText>
            <ThemedButton
              variant="ghost"
              size="sm"
              onPress={handleSkip}
              style={styles.skipButton}
            >
              Continuar de todos modos
            </ThemedButton>
          </ThemedView>
        )}
        
        <ThemedText variant="caption" color="textSecondary" style={styles.subtitle}>
          TransiLoja - Transporte Público
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spinner: {
    marginVertical: 20,
  },
  message: {
    marginBottom: 16,
    textAlign: 'center',
  },
  skipContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  skipText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  skipButton: {
    marginTop: 4,
  },
  subtitle: {
    textAlign: 'center',
  },
});