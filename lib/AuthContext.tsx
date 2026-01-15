import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for persisted session on mount
    const initializeAuth = async () => {
      try {
        // First try to get session from AsyncStorage
        const storedSession = await AsyncStorage.getItem('supabase-session');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          setSession(parsedSession);
          
          // Verify the session with Supabase
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (currentSession) {
            setSession(currentSession);
            await AsyncStorage.setItem('supabase-session', JSON.stringify(currentSession));
          } else if (error) {
            // If there's an error or no valid session, clear storage
            await AsyncStorage.removeItem('supabase-session');
            setSession(null);
            router.replace('/(auth)/welcome');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      
      if (newSession) {
        // Store the new session
        await AsyncStorage.setItem('supabase-session', JSON.stringify(newSession));
        setSession(newSession);
      } else {
        // Clear the stored session
        await AsyncStorage.removeItem('supabase-session');
        setSession(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);