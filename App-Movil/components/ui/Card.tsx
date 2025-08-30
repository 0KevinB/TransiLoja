import React from 'react';
import { ViewProps, TouchableOpacity } from 'react-native';
import { ThemedView } from './ThemedView';
import { useTheme } from '../../context/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  elevation?: boolean;
  variant?: 'default' | 'outlined' | 'filled' | 'glass' | 'gradient';
  interactive?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  margin = 'sm',
  borderRadius = 'lg',
  elevation = true,
  variant = 'default',
  interactive = false,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();
  
  const getVariantProps = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'background' as const,
          borderColor: 'border' as const,
        };
      case 'filled':
        return {
          backgroundColor: 'surface' as const,
          borderColor: 'transparent' as const,
        };
      case 'glass':
        return {
          backgroundColor: theme.mode === 'dark' 
            ? 'rgba(30, 41, 59, 0.7)' as const 
            : 'rgba(255, 255, 255, 0.7)' as const,
          borderColor: theme.mode === 'dark' 
            ? 'rgba(148, 163, 184, 0.3)' as const 
            : 'rgba(148, 163, 184, 0.2)' as const,
        };
      case 'gradient':
        return {
          backgroundColor: theme.mode === 'dark' 
            ? 'rgba(59, 130, 246, 0.1)' as const 
            : 'rgba(59, 130, 246, 0.05)' as const,
          borderColor: 'rgba(59, 130, 246, 0.2)' as const,
        };
      default:
        return {
          backgroundColor: 'surface' as const,
          borderColor: 'border' as const,
        };
    }
  };

  const cardContent = (
    <ThemedView
      {...getVariantProps()}
      borderRadius={borderRadius}
      padding={padding}
      margin={margin}
      shadow={elevation}
      {...props}
    >
      {children}
    </ThemedView>
  );

  if (interactive || onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        style={{ borderRadius: borderRadius === 'lg' ? 12 : 8 }}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};