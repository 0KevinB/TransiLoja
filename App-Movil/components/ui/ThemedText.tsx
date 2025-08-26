import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibleFont } from '../../hooks/useAccessibleFont';

interface ThemedTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'button' | 'xl';
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'accent' | 'error' | 'warning' | 'success' | 'background';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'body',
  color = 'text',
  weight = 'normal',
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();
  const { fontSizes, getLineHeight, isBoldTextEnabled, isLargeText } = useAccessibleFont();

  const getVariantStyles = () => {
    switch (variant) {
      case 'title':
        return {
          fontSize: fontSizes.xl3,
          lineHeight: getLineHeight(fontSizes.xl3),
          fontWeight: '700' as const,
        };
      case 'subtitle':
        return {
          fontSize: fontSizes.xl,
          lineHeight: getLineHeight(fontSizes.xl),
          fontWeight: '600' as const,
        };
      case 'xl':
        return {
          fontSize: fontSizes.xl2,
          lineHeight: getLineHeight(fontSizes.xl2),
          fontWeight: '700' as const,
        };
      case 'body':
        return {
          fontSize: fontSizes.base,
          lineHeight: getLineHeight(fontSizes.base),
          fontWeight: '400' as const,
        };
      case 'caption':
        return {
          fontSize: fontSizes.sm,
          lineHeight: getLineHeight(fontSizes.sm),
          fontWeight: '400' as const,
        };
      case 'button':
        return {
          fontSize: fontSizes.base,
          lineHeight: getLineHeight(fontSizes.base),
          fontWeight: '600' as const,
        };
      default:
        return {
          fontSize: fontSizes.base,
          lineHeight: getLineHeight(fontSizes.base),
          fontWeight: '400' as const,
        };
    }
  };

  const getColorStyle = () => {
    return { color: theme.colors[color] };
  };

  const getWeightStyle = () => {
    const weights = {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    };
    
    let fontWeight = weights[weight];
    
    // Si el sistema tiene texto en negrita habilitado, aumentar el peso
    if (isBoldTextEnabled && weight !== 'bold') {
      const boldWeights = {
        normal: '500',
        medium: '600',
        semibold: '700',
        bold: '700',
      };
      fontWeight = boldWeights[weight];
    }
    
    return { fontWeight: fontWeight as any };
  };

  const combinedStyles = [
    styles.base,
    getVariantStyles(),
    getColorStyle(),
    getWeightStyle(),
    style,
  ];

  return (
    <Text style={combinedStyles} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});