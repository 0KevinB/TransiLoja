import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedTextInput } from '../../components/ui/ThemedTextInput';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';

export default function AuthScreen() {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!isLogin) {
      if (!formData.displayName) {
        Alert.alert('Error', 'Por favor ingresa tu nombre');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        console.log('Iniciando sesión desde auth screen...');
        await signIn(formData.email, formData.password);
        console.log('Login exitoso, redirigiendo...');
      } else {
        console.log('Registrando usuario desde auth screen...');
        await signUp(formData.email, formData.password, formData.displayName);
        console.log('Registro exitoso, redirigiendo...');
      }
      
      // Pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      const errorMessage = error?.message || error?.code || 'Ha ocurrido un error desconocido';
      Alert.alert('Error de Autenticación', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: '',
    });
  };

  const handleGuestAccess = () => {
    continueAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.container} backgroundColor="background">
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.header}>
            <Icon 
              name="directions-bus" 
              size="xl" 
              color="primary" 
              library="material"
            />
            <ThemedText variant="title" style={styles.title}>
              TransiLoja
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" style={styles.subtitle}>
              Tu compañero de viaje en transporte público
            </ThemedText>
          </ThemedView>

          <Card padding="lg" margin="md">
            <ThemedText variant="subtitle" style={styles.formTitle}>
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </ThemedText>

            {!isLogin && (
              <ThemedTextInput
                label="Nombre completo"
                value={formData.displayName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                placeholder="Ingresa tu nombre completo"
                icon={<Icon name="person" color="textSecondary" />}
                autoCapitalize="words"
              />
            )}

            <ThemedTextInput
              label="Correo electrónico"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Icon name="email" color="textSecondary" />}
            />

            <ThemedTextInput
              label="Contraseña"
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              placeholder="Ingresa tu contraseña"
              secureTextEntry
              icon={<Icon name="lock" color="textSecondary" />}
            />

            {!isLogin && (
              <ThemedTextInput
                label="Confirmar contraseña"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                placeholder="Confirma tu contraseña"
                secureTextEntry
                icon={<Icon name="lock" color="textSecondary" />}
              />
            )}

            <ThemedButton
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSubmit}
              style={styles.submitButton}
            >
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </ThemedButton>

            <ThemedButton
              variant="ghost"
              onPress={toggleMode}
              style={styles.toggleButton}
            >
              {isLogin 
                ? '¿No tienes cuenta? Regístrate' 
                : '¿Ya tienes cuenta? Inicia sesión'}
            </ThemedButton>
          </Card>

          {/* Guest Access Section */}
          <Card padding="lg" margin="md">
            <ThemedView style={styles.guestSection}>
              <Icon name="person-outline" size="lg" color="textSecondary" />
              <ThemedText variant="subtitle" style={styles.guestTitle}>
                Continuar como Invitado
              </ThemedText>
              <ThemedText variant="body" color="textSecondary" style={styles.guestDescription}>
                Accede a las funciones básicas sin necesidad de crear una cuenta
              </ThemedText>
              
              <ThemedButton
                variant="outline"
                size="lg"
                onPress={handleGuestAccess}
                style={styles.guestButton}
              >
                Continuar sin cuenta
              </ThemedButton>
            </ThemedView>
          </Card>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  formTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 16,
  },
  toggleButton: {
    marginTop: 8,
  },
  guestSection: {
    alignItems: 'center',
  },
  guestTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  guestDescription: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  guestButton: {
    marginTop: 8,
  },
});