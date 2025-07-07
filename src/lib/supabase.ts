import { createClient } from '@supabase/supabase-js';
import { AuthUser } from '../types';

// Use placeholder values if environment variables are not available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example-anon-key';

// Log a warning instead of throwing an error
if (import.meta.env.DEV && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn('⚠️ Using placeholder Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file for proper functionality.');
}

// Get the current domain, handling both development and production
const domain = window.location.hostname === 'localhost' 
  ? 'http://localhost:5173'
  : window.location.origin;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    redirectTo: domain,
  },
  global: {
    headers: {
      'X-Client-Info': 'kollab@1.0.0',
    },
  },
});

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:5173',
      queryParams: {
        prompt: 'select_account',
      },
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: domain,
    },
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // Get user's restaurant access and role
  const { data: access, error: accessError } = await supabase
    .from('user_restaurant_access')
    .select('restaurant_id, role')
    .eq('user_id', user.id);

  if (accessError) {
    console.error('Error fetching user access:', accessError);
    return null;
  }

  return {
    ...user,
    restaurantAccess: access?.map(a => a.restaurant_id) || [],
    role: access?.[0]?.role || 'staff'
  };
};