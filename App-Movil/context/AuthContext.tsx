import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../lib/firebase';
import { LoadingScreen } from '../components/LoadingScreen';
import { getFriendlyError } from '../lib/errorMessages';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  favoriteStops: string[];
  favoriteRoutes: string[];
  preferences: {
    language: 'es' | 'en';
    notifications: boolean;
    theme: 'light' | 'dark' | 'high-contrast' | 'system';
    fontScale: number;
    location: boolean;
    defaultLocation?: {
      lat: number;
      lng: number;
      name: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  addFavoriteStop: (stopId: string) => Promise<void>;
  removeFavoriteStop: (stopId: string) => Promise<void>;
  addFavoriteRoute: (routeId: string) => Promise<void>;
  removeFavoriteRoute: (routeId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const loadUserProfile = async (uid: string) => {
    try {
      const database = db();
      if (!database) {
        console.warn('Firestore no disponible');
        return;
      }
      
      const userDoc = await getDoc(doc(database, 'users', uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        const profile: UserProfile = {
          uid,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          role: data.role || 'user',
          favoriteStops: data.favoriteStops || [],
          favoriteRoutes: data.favoriteRoutes || [],
          preferences: {
            language: data.preferences?.language || 'es',
            notifications: data.preferences?.notifications ?? true,
            theme: data.preferences?.theme || 'system',
            fontScale: data.preferences?.fontScale || 1.0,
            location: data.preferences?.location ?? true,
            defaultLocation: data.preferences?.defaultLocation,
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // No hacer throw para evitar que la app se bloquee
    }
  };

  useEffect(() => {
    // Timeout para evitar bloqueos prolongados
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 3000);

    // Si no hay Firebase Auth, continuar sin autenticación rápidamente
    if (!auth) {
      console.warn('Firebase Auth no disponible, continuando sin autenticación');
      clearTimeout(timeoutId);
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        clearTimeout(timeoutId);
        setUser(user);
        
        if (user) {
          // Cargar perfil en segundo plano, no bloquear la UI
          loadUserProfile(user.uid).catch((error) => {
            console.error('Error cargando perfil de usuario:', error);
          });
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }, (error) => {
        console.error('Error en onAuthStateChanged:', error);
        clearTimeout(timeoutId);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error configurando Auth listener:', error);
      clearTimeout(timeoutId);
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  }, []);

  // Solo mostrar loading muy brevemente para no bloquear la app
  if (loading) {
    return <LoadingScreen message="Iniciando TransiLoja..." timeout={3000} />;
  }

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Auth no está disponible');
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error en signIn:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!auth) {
      throw new Error('Firebase Auth no está disponible');
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Actualizar el perfil del usuario en Firebase Auth
      await updateProfile(user, { displayName });

      // Crear el documento del usuario en Firestore (lazy loading)
      const database = db();
      const userProfileData: Omit<UserProfile, 'uid'> = {
        email,
        displayName,
        role: 'user',
        favoriteStops: [],
        favoriteRoutes: [],
        preferences: {
          language: 'es',
          notifications: true,
          theme: 'system',
          fontScale: 1.0,
          location: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(database, 'users', user.uid), userProfileData);
    } catch (error) {
      console.error('Error en signUp:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase Auth no está disponible');
    }
    
    try {
      await signOut(auth);
      setIsGuest(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setLoading(false);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      console.warn('No user available for profile update');
      return;
    }

    try {
      const database = db();
      if (!database) {
        console.warn('Firestore not available, updating local profile only');
        // Solo actualizar localmente si Firestore no está disponible
        if (userProfile) {
          const updateData = { ...data, updatedAt: new Date() };
          setUserProfile({ ...userProfile, ...updateData });
        }
        return;
      }

      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      console.log('Updating user profile in Firestore:', updateData);
      await setDoc(doc(database, 'users', user.uid), updateData, { merge: true });
      
      // Actualizar el estado local inmediatamente después de Firestore
      if (userProfile) {
        const newProfile = { ...userProfile, ...updateData };
        setUserProfile(newProfile);
        console.log('Local profile updated with:', updateData);
      }
      
      console.log('User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      // Intentar actualizar solo localmente si Firestore falla
      if (userProfile) {
        try {
          const updateData = { ...data, updatedAt: new Date() };
          setUserProfile({ ...userProfile, ...updateData });
          console.log('Updated profile locally as fallback');
        } catch (localError) {
          console.error('Error updating local profile:', localError);
          throw error; // Re-throw original error
        }
      } else {
        throw error;
      }
    }
  };

  const addFavoriteStop = async (stopId: string) => {
    if (!user || !userProfile) return;

    try {
      const updatedStops = [...userProfile.favoriteStops, stopId];
      await updateUserProfile({ favoriteStops: updatedStops });
    } catch (error) {
      console.error('Error adding favorite stop:', error);
      throw error;
    }
  };

  const removeFavoriteStop = async (stopId: string) => {
    if (!user || !userProfile) return;

    try {
      const updatedStops = userProfile.favoriteStops.filter(id => id !== stopId);
      await updateUserProfile({ favoriteStops: updatedStops });
    } catch (error) {
      console.error('Error removing favorite stop:', error);
      throw error;
    }
  };

  const addFavoriteRoute = async (routeId: string) => {
    if (!user || !userProfile) return;

    try {
      const updatedRoutes = [...userProfile.favoriteRoutes, routeId];
      await updateUserProfile({ favoriteRoutes: updatedRoutes });
    } catch (error) {
      console.error('Error adding favorite route:', error);
      throw error;
    }
  };

  const removeFavoriteRoute = async (routeId: string) => {
    if (!user || !userProfile) return;

    try {
      const updatedRoutes = userProfile.favoriteRoutes.filter(id => id !== routeId);
      await updateUserProfile({ favoriteRoutes: updatedRoutes });
    } catch (error) {
      console.error('Error removing favorite route:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isAuthenticated: !!user,
      isGuest,
      signIn,
      signUp,
      logout,
      continueAsGuest,
      updateUserProfile,
      addFavoriteStop,
      removeFavoriteStop,
      addFavoriteRoute,
      removeFavoriteRoute,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};