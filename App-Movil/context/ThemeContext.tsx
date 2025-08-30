import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, ThemeColors } from '../lib/types';

interface ThemeContextType {
  theme: AppTheme;
  toggleTheme: (mode: 'light' | 'dark' | 'high-contrast') => Promise<void>;
  setFontScale: (scale: number) => Promise<void>;
  setMunicipalityColors: (colors: { primary: string; secondary: string; accent: string }) => void;
  syncWithUserProfile: (userProfile: any) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Colores base del sistema con mejores contrastes WCAG AA
const lightColors: ThemeColors = {
  primary: '#1D4ED8', // Azul más intenso para mejor contraste
  secondary: '#2563EB',
  accent: '#3B82F6',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: '#111827', // Texto más oscuro para mejor contraste
  textSecondary: '#4B5563', // Gris más oscuro para legibilidad
  border: '#D1D5DB',
  error: '#DC2626', // Rojo más intenso
  warning: '#D97706', // Amarillo más oscuro
  success: '#059669', // Verde más intenso
};

const darkColors: ThemeColors = {
  primary: '#60A5FA', // Azul más claro para modo oscuro
  secondary: '#93C5FD',
  accent: '#DBEAFE',
  background: '#0F172A', // Fondo más oscuro
  surface: '#1E293B',
  text: '#F8FAFC', // Texto más claro
  textSecondary: '#CBD5E1', // Gris más claro para legibilidad
  border: '#334155',
  error: '#F87171',
  warning: '#FCD34D',
  success: '#6EE7B7',
};

const highContrastColors: ThemeColors = {
  primary: '#0000FF', // Azul puro para máximo contraste
  secondary: '#000000',
  accent: '#FF00FF', // Magenta para destacar
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#000000', // Negro para máximo contraste
  border: '#000000',
  error: '#CC0000', // Rojo más oscuro
  warning: '#FF6600', // Naranja para advertencias
  success: '#006600', // Verde más oscuro
};

const getThemeColors = (mode: 'light' | 'dark' | 'high-contrast', municipalityColors?: { primary: string; secondary: string; accent: string }): ThemeColors => {
  let baseColors: ThemeColors;
  
  switch (mode) {
    case 'dark':
      baseColors = darkColors;
      break;
    case 'high-contrast':
      baseColors = highContrastColors;
      break;
    default:
      baseColors = lightColors;
  }

  // Aplicar colores del municipio si están disponibles
  if (municipalityColors && mode !== 'high-contrast') {
    return {
      ...baseColors,
      primary: municipalityColors.primary,
      secondary: municipalityColors.secondary,
      accent: municipalityColors.accent,
    };
  }

  return baseColors;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'high-contrast'>('light');
  const [fontScale, setFontScaleState] = useState<number>(1);
  const [municipalityColors, setMunicipalityColorsState] = useState<{ primary: string; secondary: string; accent: string } | undefined>();

  // Cargar configuración guardada
  useEffect(() => {
    loadThemeSettings();
  }, []);

  // Aplicar tema del sistema si no se ha configurado manualmente
  useEffect(() => {
    const checkSystemTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      // Solo aplicar tema del sistema si no hay preferencia guardada
      if (!savedTheme && systemColorScheme) {
        setThemeMode(systemColorScheme === 'dark' ? 'dark' : 'light');
      }
    };
    checkSystemTheme();
  }, [systemColorScheme]);

  const loadThemeSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      const savedFontScale = await AsyncStorage.getItem('font_scale');
      const savedMunicipalityColors = await AsyncStorage.getItem('municipality_colors');

      if (savedTheme) {
        setThemeMode(savedTheme as 'light' | 'dark' | 'high-contrast');
      }
      if (savedFontScale) {
        setFontScaleState(parseFloat(savedFontScale));
      }
      if (savedMunicipalityColors) {
        setMunicipalityColorsState(JSON.parse(savedMunicipalityColors));
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const toggleTheme = async (mode: 'light' | 'dark' | 'high-contrast') => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const setFontScale = async (scale: number) => {
    setFontScaleState(scale);
    try {
      await AsyncStorage.setItem('font_scale', scale.toString());
    } catch (error) {
      console.error('Error saving font scale:', error);
    }
  };

  const setMunicipalityColors = async (colors: { primary: string; secondary: string; accent: string }) => {
    setMunicipalityColorsState(colors);
    try {
      await AsyncStorage.setItem('municipality_colors', JSON.stringify(colors));
    } catch (error) {
      console.error('Error saving municipality colors:', error);
    }
  };

  const syncWithUserProfile = async (userProfile: any) => {
    if (userProfile?.preferences) {
      const { theme: userTheme, fontScale: userFontScale } = userProfile.preferences;
      
      if (userTheme && userTheme !== 'system') {
        setThemeMode(userTheme);
        try {
          await AsyncStorage.setItem('theme_mode', userTheme);
        } catch (error) {
          console.error('Error syncing theme to AsyncStorage:', error);
        }
      }
      
      if (userFontScale && typeof userFontScale === 'number') {
        setFontScaleState(userFontScale);
        try {
          await AsyncStorage.setItem('font_scale', userFontScale.toString());
        } catch (error) {
          console.error('Error syncing font scale to AsyncStorage:', error);
        }
      }
    }
  };

  const theme: AppTheme = {
    mode: themeMode,
    colors: getThemeColors(themeMode, municipalityColors),
    fontScale,
    municipalityColors,
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      setFontScale,
      setMunicipalityColors,
      syncWithUserProfile,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};