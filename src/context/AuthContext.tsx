import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminUser } from '../types';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (emailOrUser: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, fullName: string) => Promise<{ success: boolean; session?: boolean; error?: string; message?: string }>;
  loginAsAdmin: (email?: string, name?: string) => void;
  logout: () => Promise<void>;
  isDemoMode: boolean;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const configured = isSupabaseConfigured();
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!configured);

  useEffect(() => {
    // 1. Check if there is an active admin session in localStorage
    const savedAdminSession = localStorage.getItem('hw_admin_session');
    if (savedAdminSession) {
      try {
        const parsed = JSON.parse(savedAdminSession);
        setUser(parsed);
        setIsDemoMode(!configured);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('hw_admin_session');
      }
    }

    const supabase = getSupabase();
    if (!configured || !supabase) {
      // Default to Rishi admin
      const defaultAdmin: AdminUser = {
        id: '88b44147-87ee-48f0-a118-f120783a2ae8',
        email: 'rishi@attechdigital.com',
        role: 'admin',
        full_name: 'Rishi',
      };
      setUser(defaultAdmin);
      localStorage.setItem('hw_admin_session', JSON.stringify(defaultAdmin));
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    // 2. Check Supabase Auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const adminObj: AdminUser = {
          id: session.user.id,
          email: session.user.email || 'rishi@attechdigital.com',
          role: 'admin',
          full_name: session.user.user_metadata?.full_name || 'Rishi',
        };
        setUser(adminObj);
        localStorage.setItem('hw_admin_session', JSON.stringify(adminObj));
        setIsDemoMode(false);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const adminObj: AdminUser = {
          id: session.user.id,
          email: session.user.email || 'rishi@attechdigital.com',
          role: 'admin',
          full_name: session.user.user_metadata?.full_name || 'Rishi',
        };
        setUser(adminObj);
        localStorage.setItem('hw_admin_session', JSON.stringify(adminObj));
        setIsDemoMode(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  // Sign In function supporting both username "rishi" and email "rishi@attechdigital.com"
  const login = async (emailOrUser: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const inputClean = emailOrUser.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!inputClean || !cleanPass) {
      return { success: false, error: 'Please enter your username/email and password.' };
    }

    // Direct check for admin credentials: Name/User: "rishi", Password: "rishi24"
    if (
      (inputClean === 'rishi' || inputClean === 'rishi@attechdigital.com') &&
      cleanPass === 'rishi24'
    ) {
      const adminUser: AdminUser = {
        id: '88b44147-87ee-48f0-a118-f120783a2ae8',
        email: 'rishi@attechdigital.com',
        role: 'admin',
        full_name: 'Rishi',
      };
      setUser(adminUser);
      localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
      return { success: true };
    }

    const emailToUse = inputClean.includes('@') ? inputClean : `${inputClean}@attechdigital.com`;

    const supabase = getSupabase();
    if (!configured || !supabase) {
      const adminUser: AdminUser = {
        id: 'admin-rishi',
        email: emailToUse,
        role: 'admin',
        full_name: inputClean === 'rishi' ? 'Rishi' : inputClean,
      };
      setUser(adminUser);
      localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
      setIsDemoMode(true);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: cleanPass,
      });

      if (error) {
        // If error is email not confirmed or credentials, and password is correct for rishi
        if (
          (inputClean === 'rishi' || inputClean.startsWith('rishi')) &&
          cleanPass === 'rishi24'
        ) {
          const adminUser: AdminUser = {
            id: '88b44147-87ee-48f0-a118-f120783a2ae8',
            email: 'rishi@attechdigital.com',
            role: 'admin',
            full_name: 'Rishi',
          };
          setUser(adminUser);
          localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
          return { success: true };
        }

        return { success: false, error: error.message };
      }

      if (data.user) {
        const adminUser: AdminUser = {
          id: data.user.id,
          email: data.user.email || emailToUse,
          role: 'admin',
          full_name: data.user.user_metadata?.full_name || 'Rishi',
        };
        setUser(adminUser);
        localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
        setIsDemoMode(false);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred during authentication.' };
    }
  };

  // Sign Up / Register new admin in Supabase Auth
  const signUp = async (
    email: string,
    pass: string,
    fullName: string
  ): Promise<{ success: boolean; session?: boolean; error?: string; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter email and password.' };
    }

    const supabase = getSupabase();
    if (!configured || !supabase) {
      loginAsAdmin(cleanEmail, fullName);
      return { success: true, session: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            full_name: fullName || 'Rishi',
            role: 'admin',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const adminUser: AdminUser = {
        id: data?.user?.id || 'admin-rishi',
        email: cleanEmail,
        role: 'admin',
        full_name: fullName || 'Rishi',
      };
      setUser(adminUser);
      localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
      return {
        success: true,
        session: true,
        message: 'Admin account created successfully in Supabase Auth!',
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Direct Admin Access for Rishi
  const loginAsAdmin = (email: string = 'rishi@attechdigital.com', name: string = 'Rishi') => {
    const adminUser: AdminUser = {
      id: '88b44147-87ee-48f0-a118-f120783a2ae8',
      email,
      role: 'admin',
      full_name: name,
    };
    setUser(adminUser);
    localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
    setIsDemoMode(!configured);
  };

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Signout warning:', e);
      }
    }
    localStorage.removeItem('hw_admin_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signUp,
        loginAsAdmin,
        logout,
        isDemoMode,
        isConfigured: configured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
