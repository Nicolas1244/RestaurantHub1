import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Define user roles
export type UserRole = 'admin' | 'manager' | 'employee';

// Define user profile with role
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  restaurantId?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isEmployee: () => boolean;
  hasAccess: (requiredRoles: UserRole[]) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  // TEMPORARY: Create mock admin user and profile
  const mockUser: User = {
    id: 'admin-user-id',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };
  
  const mockProfile: UserProfile = {
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    restaurantId: '1' // First restaurant ID from mock data
  };
  
  const [user, setUser] = useState<User | null>(mockUser);
  const [profile, setProfile] = useState<UserProfile | null>(mockProfile);
  const [session, setSession] = useState<Session | null>({ access_token: 'mock-token', token_type: 'bearer', user: mockUser });
  const [loading, setLoading] = useState(false);

  // Initialize auth state
  useEffect(() => {
    // TEMPORARY: Skip authentication initialization
    // We're using mock data instead
    setLoading(false);
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      // Query user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          role: data.role || 'employee',
          firstName: data.first_name,
          lastName: data.last_name,
          restaurantId: data.restaurant_id
        });
      } else {
        // If no profile exists, create a default one
        const defaultProfile: UserProfile = {
          id: userId,
          email: user?.email || '',
          role: 'employee'
        };
        
        setProfile(defaultProfile);
        
        // Save default profile to database
        await supabase
          .from('user_profiles')
          .insert([{
            id: userId,
            email: user?.email,
            role: 'employee'
          }]);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      toast.success(t('success.signInSuccess'));
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(t('errors.authenticationFailed'));
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;
      
      toast.success(t('auth.checkEmail'));
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error(t('errors.authenticationFailed'));
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:5173',
          queryParams: {
            prompt: 'select_account',
          }
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error(t('errors.googleSignInFailed'));
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Force redirect to auth page
      window.location.href = '/auth';
      
      toast.success(t('success.signOutSuccess'));
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updatedProfile: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: updatedProfile.firstName,
          last_name: updatedProfile.lastName,
          role: updatedProfile.role,
          restaurant_id: updatedProfile.restaurantId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
      
      toast.success(t('success.profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('errors.profileUpdateFailed'));
      throw error;
    }
  };

  // Role check helpers
  // TEMPORARY: Always return true for role checks
  const isAdmin = () => true;
  const isManager = () => true;
  const isEmployee = () => true;

  // Check if user has access based on required roles
  // TEMPORARY: Always grant access
  const hasAccess = (requiredRoles: UserRole[]) => true;

  // Context value
  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateUserProfile,
    isAdmin,
    isManager,
    isEmployee,
    hasAccess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};