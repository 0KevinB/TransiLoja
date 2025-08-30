import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

export default function TabBarBackground() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Usar colores del tema pero con mejor opacidad para contraste
  const backgroundColor = theme.mode === 'dark' 
    ? 'rgba(15, 23, 42, 0.95)'   // Gris muy oscuro pero no completamente opaco
    : 'rgba(255, 255, 255, 0.95)'; // Blanco casi opaco
    
  const borderColor = theme.mode === 'dark'
    ? 'rgba(51, 65, 85, 0.8)'     // Borde gris oscuro
    : 'rgba(226, 232, 240, 0.8)';  // Borde gris claro

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor,
          borderTopColor: borderColor,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
        }
      ]} 
    >
      {/* Overlay adicional para asegurar contraste */}
      <View 
        style={[
          styles.contrastOverlay,
          {
            backgroundColor: theme.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.4)'     // Overlay oscuro para mejor contraste
              : 'rgba(255, 255, 255, 0.7)', // Overlay claro para mejor contraste
          }
        ]} 
      />
      
      {/* Línea superior para definición */}
      <View 
        style={[
          styles.topBorder,
          {
            backgroundColor: theme.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)',
          }
        ]} 
      />
    </View>
  );
}

export function useBottomTabOverflow() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom - 4, 0);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 2, 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  contrastOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  topBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -1,
    height: 1,
  },
});
