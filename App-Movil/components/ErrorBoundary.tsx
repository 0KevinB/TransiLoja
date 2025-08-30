import React, { Component, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Icon } from './ui/Icon';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ThemedView style={styles.container} backgroundColor="background">
          <ThemedView style={styles.content}>
            <Icon name="error-outline" size="xl" color="error" />
            <ThemedText variant="title" style={styles.title}>
              Oops! Algo salió mal
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" style={styles.message}>
              {this.state.error?.message || 'Ha ocurrido un error inesperado'}
            </ThemedText>
            <ThemedButton
              variant="primary"
              onPress={this.handleRetry}
              style={styles.retryButton}
            >
              Reintentar
            </ThemedButton>
          </ThemedView>
        </ThemedView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    marginTop: 8,
  },
});