import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { Icon } from '@/components/ui/Icon';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getScaledSize, getMinTouchTarget, isLargeText } = useAccessibleFont();

  // Obtener dimensiones de pantalla para detectar gestos home
  const screenHeight = Dimensions.get('window').height;
  const hasHomeIndicator = Platform.OS === 'ios' && screenHeight >= 812; // iPhone X y posteriores
  
  // Calcular altura de tab bar adaptativa
  const getTabBarHeight = () => {
    const baseHeight = isLargeText ? 80 : 70;
    const bottomPadding = Math.max(insets.bottom, hasHomeIndicator ? 20 : 8);
    return baseHeight + bottomPadding;
  };

  const tabBarHeight = getTabBarHeight();
  const minTouchTarget = getMinTouchTarget();
  const scaledFontSize = getScaledSize(11);

  // Colores fijos para tab bar según el tema, similar a apps líderes del mercado
  const getTabBarColors = () => {
    switch (theme.mode) {
      case 'dark':
        return {
          active: '#FFFFFF', // Blanco puro para tabs activos en modo oscuro
          inactive: '#8E8E93', // Gris medio para tabs inactivos en modo oscuro
        };
      case 'high-contrast':
        return {
          active: '#000000', // Negro puro para tabs activos en alto contraste
          inactive: '#666666', // Gris oscuro para tabs inactivos en alto contraste
        };
      default: // light
        return {
          active: '#007AFF', // Azul sistema iOS para tabs activos en modo claro
          inactive: '#8E8E93', // Gris sistema iOS para tabs inactivos en modo claro
        };
    }
  };

  const tabBarColors = getTabBarColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabBarColors.active,
        tabBarInactiveTintColor: tabBarColors.inactive,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: scaledFontSize,
          fontWeight: '600',
          marginTop: isLargeText ? 4 : 2,
          marginBottom: Platform.OS === 'ios' ? 2 : 4,
        },
        tabBarIconStyle: {
          marginBottom: Platform.OS === 'ios' ? (isLargeText ? 2 : -2) : 0,
        },
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: isLargeText ? 12 : 8,
          paddingBottom: Math.max(insets.bottom + 4, Platform.OS === 'ios' ? 8 : 4),
          backgroundColor: theme.colors.surface, // Color sólido según el tema
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          // Asegurar que no interfiera con gestos del sistema
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarItemStyle: {
          paddingVertical: isLargeText ? 8 : 4,
          minHeight: minTouchTarget,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Icon 
              name={focused ? "home" : "home-outline"} 
              library="ionicons"
              size={28}
              color={focused ? tabBarColors.active : tabBarColors.inactive} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Rutas',
          tabBarIcon: ({ color, focused }) => (
            <Icon 
              name={focused ? "map" : "map-outline"} 
              library="ionicons"
              size={26}
              color={focused ? tabBarColors.active : tabBarColors.inactive} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stops"
        options={{
          title: 'Paradas',
          tabBarIcon: ({ color, focused }) => (
            <Icon 
              name={focused ? "location" : "location-outline"} 
              library="ionicons"
              size={26}
              color={focused ? tabBarColors.active : tabBarColors.inactive} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Icon 
              name={focused ? "person" : "person-outline"} 
              library="ionicons"
              size={26}
              color={focused ? tabBarColors.active : tabBarColors.inactive} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Esto oculta el tab
        }}
      />
    </Tabs>
  );
}
