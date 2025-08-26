import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ThemedTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

export const ThemedTextInput: React.FC<ThemedTextInputProps> = ({
  label,
  error,
  icon,
  variant = 'outlined',
  style,
  value,
  onFocus,
  onBlur,
  ...props
}) => {
  const { theme } = useTheme();
  const { fontSizes, getLineHeight, getMinTouchTarget } = useAccessibleFont();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getContainerStyles = () => {
    const minTouchTarget = getMinTouchTarget();
    const baseStyle = {
      borderRadius: 8,
      minHeight: Math.max(48, minTouchTarget),
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: error 
            ? theme.colors.error 
            : isFocused 
              ? theme.colors.primary 
              : 'transparent',
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: error 
            ? theme.colors.error 
            : isFocused 
              ? theme.colors.primary 
              : theme.colors.border,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderColor: error 
            ? theme.colors.error 
            : isFocused 
              ? theme.colors.primary 
              : theme.colors.border,
        };
    }
  };

  const getInputStyles = () => {
    return {
      flex: 1,
      fontSize: fontSizes.base,
      lineHeight: getLineHeight(fontSizes.base),
      color: theme.colors.text,
      paddingLeft: icon ? 8 : 0,
    };
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText
          variant="caption"
          color={error ? 'error' : 'textSecondary'}
          style={styles.label}
        >
          {label}
        </ThemedText>
      )}
      
      <View style={getContainerStyles()}>
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        
        <TextInput
          style={[getInputStyles(), style]}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={theme.colors.textSecondary}
          selectionColor={theme.colors.primary}
          accessibilityLabel={label}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          accessibilityInvalid={!!error}
          {...props}
        />
      </View>

      {error && (
        <ThemedText
          variant="caption"
          color="error"
          style={styles.error}
        >
          {error}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    marginTop: 4,
  },
});