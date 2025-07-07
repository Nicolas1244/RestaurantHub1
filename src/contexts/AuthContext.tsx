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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
      
      // Set up auth state listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session);
          setUser(session?.user || null);
          
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setProfile(null);
          }
        }
      );
      
      setLoading(false);
      
      // Clean up subscription
      return () => {
        subscription.unsubscribe();
      };
    };
    
    initializeAuth();
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
          redirectTo: window.location.origin,
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
      await supabase.auth.signOut();
      window.location.href = '/auth'; // Force redirect to auth page
      
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
  const isAdmin = () => profile?.role === 'admin';
  const isManager = () => profile?.role === 'manager' || profile?.role === 'admin';
  const isEmployee = () => !!profile; // Any authenticated user is at least an employee

  // Check if user has access based on required roles
  const hasAccess = (requiredRoles: UserRole[]) => {
    if (!profile) return false;
    return requiredRoles.includes(profile.role);
  };

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