import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ubmqwkugitipqwhxyhkb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVibXF3a3VnaXRpcHF3aHh5aGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzgyMDQsImV4cCI6MjEwMDI1NDIwNH0.P0ySADQdhXv3kXZhr6ChY7ur0XV1SXCyFF1eN3QCjfs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
