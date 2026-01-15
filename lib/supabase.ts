import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://oyombjqjyjlamqyczjpz.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95b21ianFqeWpsYW1xeWN6anB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDMzOTQ3NiwiZXhwIjoyMDQ5OTE1NDc2fQ.UXU6_BFJUGVNsQLCWhLYSteX46Ipe4wsUjYdR0i_xR0"

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    })

// Helper to check session status
export const getPersistedSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data: { session } };
  } catch (error) {
    console.error('Error getting persisted session:', error);
    return { data: { session: null } };
  }
};
