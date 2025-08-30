import { useMemo } from 'react';
import { Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibleFont } from './useAccessibleFont';

/**
 * Hook para obtener el padding necesario en las pantallas
 * para evitar que el contenido quede oculto por la tab bar
 */
export const useTabBarPadding = () => {
  const insets = useSafeAreaInsets();
  const { isLargeText } = useAccessibleFont();

  const tabBarPadding = useMemo(() => {
    // Obtener dimensiones de pantalla para detectar gestos home
    const screenHeight = Dimensions.get('window').height;
    const hasHomeIndicator = Platform.OS === 'ios' && screenHeight >= 812; // iPhone X y posteriores
    
    // Calcular altura de tab bar (debe coincidir con la del TabLayout)
    const baseHeight = isLargeText ? 80 : 70;
    const bottomPadding = Math.max(insets.bottom, hasHomeIndicator ? 20 : 8);
    const tabBarHeight = baseHeight + bottomPadding;
    
    return {
      paddingBottom: tabBarHeight + 16, // 16px extra de margen
      marginBottom: 0, // Reset cualquier margin bottom
    };
  }, [insets.bottom, isLargeText]);

  return tabBarPadding;
};