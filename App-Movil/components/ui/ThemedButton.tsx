import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';
import { ThemedText } from './ThemedText';

interface ThemedButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();
  const { fontSizes, getMinTouchTarget } = useAccessibleFont();

  const getVariantStyles = () => {
    const baseStyle = {
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled || loading ? theme.colors.textSecondary : theme.colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled || loading ? theme.colors.textSecondary : theme.colors.secondary,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled || loading ? theme.colors.textSecondary : theme.colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const getSizeStyles = () => {
    const minTouchTarget = getMinTouchTarget();
    
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
          minHeight: Math.max(36, minTouchTarget),
        };
      case 'md':
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: Math.max(44, minTouchTarget),
        };
      case 'lg':
        return {
          paddingHorizontal: 20,
          paddingVertical: 16,
          minHeight: Math.max(52, minTouchTarget),
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: Math.max(44, minTouchTarget),
        };
    }
  };

  const getTextColor = () => {
    if (disabled || loading) return 'textSecondary';
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        return theme.mode === 'dark' ? 'text' : 'background';
      case 'outline':
      case 'ghost':
        return 'primary';
      default:
        return 'text';
    }
  };

  const getTextVariant = () => {
    switch (size) {
      case 'sm':
        return 'caption';
      case 'md':
        return 'button';
      case 'lg':
        return 'button';
      default:
        return 'button';
    }
  };

  const combinedStyles = [
    getVariantStyles(),
    getSizeStyles(),
    style,
  ];

  return (
    <TouchableOpacity
      style={combinedStyles}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ 
        disabled: disabled || loading,
        busy: loading
      }}
      accessibilityHint={loading ? 'Cargando...' : undefined}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={getTextColor() === 'textSecondary' ? theme.colors.textSecondary : theme.colors.background}
          style={{ marginRight: 8 }}
        />
      )}
      <ThemedText
        variant={getTextVariant() as any}
        color={getTextColor() as any}
        weight="semibold"
      >
        {children}
      </ThemedText>
    </TouchableOpacity>
  );
};