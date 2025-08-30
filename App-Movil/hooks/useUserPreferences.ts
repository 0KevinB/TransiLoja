import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Hook para gestionar las preferencias del usuario
 * Proporciona funciones para actualizar configuraciones y guardarlas en Firebase
 */
export const useUserPreferences = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const { theme, toggleTheme, setFontScale } = useTheme();

  // Función para actualizar tema y guardar en Firebase
  const updateTheme = async (newTheme: 'light' | 'dark' | 'high-contrast') => {
    toggleTheme(newTheme);
    
    if (userProfile) {
      try {
        await updateUserProfile({
          preferences: {
            ...userProfile.preferences,
            theme: newTheme,
          },
        });
      } catch (error) {
        console.error('Error updating theme preference:', error);
      }
    }
  };

  // Función para actualizar tamaño de fuente y guardar en Firebase
  const updateFontScale = async (newScale: number) => {
    setFontScale(newScale);
    
    if (userProfile) {
      try {
        await updateUserProfile({
          preferences: {
            ...userProfile.preferences,
            fontScale: newScale,
          },
        });
      } catch (error) {
        console.error('Error updating font scale preference:', error);
      }
    }
  };

  // Función para actualizar notificaciones
  const updateNotifications = async (enabled: boolean) => {
    if (userProfile) {
      try {
        await updateUserProfile({
          preferences: {
            ...userProfile.preferences,
            notifications: enabled,
          },
        });
      } catch (error) {
        console.error('Error updating notifications preference:', error);
        throw error;
      }
    }
  };

  // Función para actualizar ubicación
  const updateLocation = async (enabled: boolean) => {
    if (userProfile) {
      try {
        await updateUserProfile({
          preferences: {
            ...userProfile.preferences,
            location: enabled,
          },
        });
      } catch (error) {
        console.error('Error updating location preference:', error);
        throw error;
      }
    }
  };

  return {
    currentTheme: theme.mode,
    currentFontScale: theme.fontScale,
    notifications: userProfile?.preferences?.notifications ?? true,
    location: userProfile?.preferences?.location ?? true,
    updateTheme,
    updateFontScale,
    updateNotifications,
    updateLocation,
  };
};