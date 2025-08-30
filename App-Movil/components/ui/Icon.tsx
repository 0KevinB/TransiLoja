import React from 'react';
import { 
  MaterialIcons, 
  FontAwesome5, 
  Ionicons, 
  Feather,
  MaterialCommunityIcons 
} from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';

type IconLibrary = 'material' | 'fontawesome' | 'ionicons' | 'feather' | 'materialcommunity';

interface IconProps {
  name: string;
  library?: IconLibrary;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xl2' | number;
  color?: 'primary' | 'secondary' | 'accent' | 'text' | 'textSecondary' | 'error' | 'warning' | 'success' | 'background' | string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  library = 'material',
  size = 'md',
  color = 'text',
}) => {
  const { theme } = useTheme();
  const { getScaledSize } = useAccessibleFont();

  const getIconSize = () => {
    if (typeof size === 'number') {
      return getScaledSize(size);
    }

    const sizeMap = {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xl2: 40,
    };

    return getScaledSize(sizeMap[size]);
  };

  const getIconColor = () => {
    // Si es un color personalizado (hex, rgb, etc.)
    if (color.startsWith('#') || color.startsWith('rgb')) {
      return color;
    }
    
    // Si es un color del tema
    return theme.colors[color as keyof typeof theme.colors] || theme.colors.text;
  };

  const iconSize = getIconSize();
  const iconColor = getIconColor();

  const renderIcon = () => {
    switch (library) {
      case 'fontawesome':
        return (
          <FontAwesome5 
            name={name as any} 
            size={iconSize} 
            color={iconColor} 
          />
        );
      case 'ionicons':
        return (
          <Ionicons 
            name={name as any} 
            size={iconSize} 
            color={iconColor} 
          />
        );
      case 'feather':
        return (
          <Feather 
            name={name as any} 
            size={iconSize} 
            color={iconColor} 
          />
        );
      case 'materialcommunity':
        return (
          <MaterialCommunityIcons 
            name={name as any} 
            size={iconSize} 
            color={iconColor} 
          />
        );
      case 'material':
      default:
        return (
          <MaterialIcons 
            name={name as any} 
            size={iconSize} 
            color={iconColor} 
          />
        );
    }
  };

  return renderIcon();
};