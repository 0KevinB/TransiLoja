import React, { useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { ThemedText } from './ThemedText';
import { Icon } from './Icon';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';

interface QuickActionProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  variant?: 'default' | 'large' | 'compact';
  style?: ViewStyle;
  disabled?: boolean;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  color = 'primary',
  variant = 'default',
  style,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { getMinTouchTarget } = useAccessibleFont();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getContainerStyle = () => {
    const minTouchTarget = getMinTouchTarget();
    
    const baseStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: variant === 'compact' ? 12 : 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: Math.max(variant === 'compact' ? 80 : variant === 'large' ? 120 : 100, minTouchTarget),
      shadowColor: theme.mode === 'dark' ? '#000' : '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
    };

    if (disabled) {
      return {
        ...baseStyle,
        opacity: 0.5,
        backgroundColor: theme.colors.textSecondary + '20',
      };
    }

    return baseStyle;
  };

  const getIconContainerStyle = () => {
    const size = variant === 'compact' ? 44 : variant === 'large' ? 64 : 56;
    
    return {
      width: size,
      height: size,
      borderRadius: size / 4,
      backgroundColor: disabled ? theme.colors.textSecondary + '20' : theme.colors[color] + '15',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: variant === 'compact' ? 8 : 12,
    };
  };

  const getIconSize = () => {
    switch (variant) {
      case 'compact':
        return 'lg';
      case 'large':
        return 'xl2';
      default:
        return 'xl';
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={getContainerStyle()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={subtitle}
        accessibilityState={{ disabled }}
      >
      <View style={getIconContainerStyle()}>
        <Icon 
          name={icon} 
          color={disabled ? 'textSecondary' : color} 
          size={getIconSize()}
        />
      </View>
      
      <ThemedText 
        variant={variant === 'compact' ? 'body' : 'body'} 
        weight="bold" 
        color={disabled ? 'textSecondary' : 'text'}
        style={styles.title}
      >
        {title}
      </ThemedText>
      
      {subtitle && (
        <ThemedText 
          variant="caption" 
          color="textSecondary" 
          style={styles.subtitle}
        >
          {subtitle}
        </ThemedText>
      )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 16,
  },
});