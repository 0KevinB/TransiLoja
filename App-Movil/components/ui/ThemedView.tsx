import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ThemedViewProps extends ViewProps {
  backgroundColor?: 'background' | 'surface' | 'primary' | 'secondary' | 'accent' | 'transparent';
  borderColor?: 'border' | 'primary' | 'secondary' | 'accent' | 'transparent';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: boolean;
}

export const ThemedView: React.FC<ThemedViewProps> = ({
  backgroundColor = 'transparent',
  borderColor = 'transparent',
  borderRadius = 'none',
  padding = 'none',
  margin = 'none',
  shadow = false,
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const getBackgroundColorStyle = () => {
    if (backgroundColor === 'transparent') return {};
    return { backgroundColor: theme.colors[backgroundColor] };
  };

  const getBorderColorStyle = () => {
    if (borderColor === 'transparent') return {};
    return { 
      borderColor: theme.colors[borderColor],
      borderWidth: 1,
    };
  };

  const getBorderRadiusStyle = () => {
    const radiusMap = {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    };
    return { borderRadius: radiusMap[borderRadius] };
  };

  const getPaddingStyle = () => {
    const paddingMap = {
      none: 0,
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    };
    return { padding: paddingMap[padding] };
  };

  const getMarginStyle = () => {
    const marginMap = {
      none: 0,
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    };
    return { margin: marginMap[margin] };
  };

  const getShadowStyle = () => {
    if (!shadow) return {};
    
    return theme.mode === 'light' ? {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    } : {
      shadowColor: '#fff',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    };
  };

  const combinedStyles = [
    getBackgroundColorStyle(),
    getBorderColorStyle(),
    getBorderRadiusStyle(),
    getPaddingStyle(),
    getMarginStyle(),
    getShadowStyle(),
    style,
  ];

  return (
    <View style={combinedStyles} {...props}>
      {children}
    </View>
  );
};