import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { Icon } from './Icon';
import { useTheme } from '../../context/ThemeContext';

interface StatusIndicatorProps {
  icon: string;
  value: number | string;
  label: string;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
  variant?: 'default' | 'compact' | 'highlight';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  icon,
  value,
  label,
  color = 'primary',
  style,
  variant = 'default',
}) => {
  const { theme } = useTheme();

  const getContainerStyle = () => {
    const baseStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: variant === 'compact' ? 80 : 100,
    };

    if (variant === 'highlight') {
      return {
        ...baseStyle,
        backgroundColor: theme.colors[color] + '10',
        borderWidth: 1,
        borderColor: theme.colors[color] + '30',
      };
    }

    return baseStyle;
  };

  const getIconContainerStyle = () => {
    const baseStyle = {
      width: variant === 'compact' ? 40 : 48,
      height: variant === 'compact' ? 40 : 48,
      borderRadius: variant === 'compact' ? 10 : 12,
      backgroundColor: theme.colors[color] + '15',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: variant === 'compact' ? 6 : 8,
    };

    return baseStyle;
  };

  return (
    <View style={[getContainerStyle(), style]}>
      <View style={getIconContainerStyle()}>
        <Icon 
          name={icon} 
          color={color} 
          size={variant === 'compact' ? 'md' : 'lg'} 
        />
      </View>
      
      <ThemedText 
        variant={variant === 'compact' ? 'lg' : 'xl2'} 
        weight="bold" 
        color={color}
        style={styles.value}
      >
        {value}
      </ThemedText>
      
      <ThemedText 
        variant="caption" 
        color="textSecondary" 
        style={styles.label}
      >
        {label}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  value: {
    marginBottom: 2,
  },
  label: {
    textAlign: 'center',
    lineHeight: 14,
  },
});