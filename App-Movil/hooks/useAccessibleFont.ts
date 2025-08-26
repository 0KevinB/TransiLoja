import { useMemo, useEffect, useState } from 'react';
import { PixelRatio, AccessibilityInfo } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface FontSizes {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  xl2: number;
  xl3: number;
  xl4: number;
  xl5: number;
}

const baseFontSizes: FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xl2: 24,
  xl3: 30,
  xl4: 36,
  xl5: 48,
};

export const useAccessibleFont = () => {
  const { theme } = useTheme();
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isBoldTextEnabled, setIsBoldTextEnabled] = useState(false);
  
  // Detectar configuraciones de accesibilidad del sistema
  useEffect(() => {
    const checkAccessibilitySettings = async () => {
      try {
        const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        setIsReduceMotionEnabled(reduceMotion);
        
        // En iOS se puede detectar texto en negrita
        if (AccessibilityInfo.isBoldTextEnabled) {
          const boldText = await AccessibilityInfo.isBoldTextEnabled();
          setIsBoldTextEnabled(boldText);
        }
      } catch (error) {
        console.warn('Error checking accessibility settings:', error);
      }
    };

    checkAccessibilitySettings();
    
    // Escuchar cambios en configuraciones de accesibilidad
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsReduceMotionEnabled);
    const boldTextSubscription = AccessibilityInfo.addEventListener?.('boldTextChanged', setIsBoldTextEnabled);

    return () => {
      subscription?.remove();
      boldTextSubscription?.remove?.();
    };
  }, []);
  
  const fontSizes = useMemo(() => {
    // Obtener el factor de escala del sistema
    const systemFontScale = PixelRatio.getFontScale();
    
    // Combinar la escala del sistema con la preferencia del usuario
    let combinedScale = systemFontScale * theme.fontScale;
    
    // Si el sistema tiene fuentes muy grandes (accesibilidad), dar prioridad al sistema
    if (systemFontScale >= 1.5) {
      // Para usuarios con configuración de accesibilidad, usar más del factor del sistema
      combinedScale = systemFontScale * Math.max(theme.fontScale, 1.0);
    }
    
    // Rango más amplio para mejor accesibilidad
    const boundedScale = Math.min(Math.max(combinedScale, 0.7), 4.0);
    
    // Aplicar la escala a todos los tamaños de fuente
    const scaledSizes: FontSizes = Object.entries(baseFontSizes).reduce((acc, [key, value]) => {
      acc[key as keyof FontSizes] = Math.round(value * boundedScale);
      return acc;
    }, {} as FontSizes);
    
    return scaledSizes;
  }, [theme.fontScale]);

  const getScaledSize = (size: number): number => {
    const systemFontScale = PixelRatio.getFontScale();
    let combinedScale = systemFontScale * theme.fontScale;
    
    // Priorizar configuración del sistema para accesibilidad
    if (systemFontScale >= 1.5) {
      combinedScale = systemFontScale * Math.max(theme.fontScale, 1.0);
    }
    
    const boundedScale = Math.min(Math.max(combinedScale, 0.7), 4.0);
    return Math.round(size * boundedScale);
  };

  const getLineHeight = (fontSize: number): number => {
    // Línea de altura más accesible, especialmente para texto grande
    const systemFontScale = PixelRatio.getFontScale();
    const baseLineHeight = systemFontScale >= 1.5 ? 1.5 : 1.6;
    return Math.round(fontSize * baseLineHeight);
  };

  const getMinTouchTarget = (): number => {
    // Aumentar tamaño mínimo de toque para fuentes grandes
    const systemFontScale = PixelRatio.getFontScale();
    const baseSize = 44;
    return Math.round(baseSize * Math.max(systemFontScale * theme.fontScale, 1.0));
  };

  const getPaddingScaled = (basePadding: number): number => {
    const systemFontScale = PixelRatio.getFontScale();
    return Math.round(basePadding * Math.max(systemFontScale, 1.0));
  };

  const getMarginScaled = (baseMargin: number): number => {
    const systemFontScale = PixelRatio.getFontScale();
    return Math.round(baseMargin * Math.max(systemFontScale, 1.0));
  };

  return {
    fontSizes,
    getScaledSize,
    getLineHeight,
    getMinTouchTarget,
    getPaddingScaled,
    getMarginScaled,
    fontScale: theme.fontScale,
    systemFontScale: PixelRatio.getFontScale(),
    isReduceMotionEnabled,
    isBoldTextEnabled,
    isLargeText: PixelRatio.getFontScale() >= 1.3,
  };
};