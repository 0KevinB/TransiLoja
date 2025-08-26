import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente para sincronizar automáticamente las preferencias del usuario
 * entre Firebase y el sistema de temas local
 */
export const UserPreferencesSync: React.FC = () => {
  const { userProfile } = useAuth();
  const { syncWithUserProfile } = useTheme();

  // Sincronizar preferencias del usuario con el tema cuando se carga el perfil
  useEffect(() => {
    if (userProfile) {
      syncWithUserProfile(userProfile);
    }
  }, [userProfile, syncWithUserProfile]);

  // Este componente no renderiza nada visible
  return null;
};