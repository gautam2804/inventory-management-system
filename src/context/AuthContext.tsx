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
      setUser(null);
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    // 2. Check Supabase Auth session & fetch dynamic profile from Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch dynamic profile from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const adminObj: AdminUser = {
          id: session.user.id,
          email: profileData?.email || session.user.email || 'rishiredekar824@gmail.com',
          role: profileData?.role || 'admin',
          full_name: profileData?.full_name || session.user.user_metadata?.full_name || 'Rishi',
        };
        setUser(adminObj);
        localStorage.setItem('hw_admin_session', JSON.stringify(adminObj));
        setIsDemoMode(false);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const adminObj: AdminUser = {
          id: session.user.id,
          email: profileData?.email || session.user.email || 'rishiredekar824@gmail.com',
          role: profileData?.role || 'admin',
          full_name: profileData?.full_name || session.user.user_metadata?.full_name || 'Rishi',
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

  // Dynamic Login supporting username "Rishi" or email "rishiredekar824@gmail.com" from Supabase profiles
  const login = async (emailOrUser: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const inputClean = emailOrUser.trim();
    const cleanPass = pass.trim();

    if (!inputClean || !cleanPass) {
      return { success: false, error: 'Please enter your username/email and password.' };
    }

    const supabase = getSupabase();

    if (configured && supabase) {
      try {
        // 1. Dynamic query to profiles table by email or full_name (username)
        const { data: matchedProfiles, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.ilike.${inputClean},full_name.ilike.${inputClean}`);

        if (profileErr) {
          console.warn('Profile search warning:', profileErr);
        }

        if (!matchedProfiles || matchedProfiles.length === 0) {
          return {
            success: false,
            error: `No administrator profile found for "${inputClean}". Please check username/email.`,
          };
        }

        const profile = matchedProfiles[0];

        // 2. Authenticate credentials against Supabase Auth using the profile's email
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: cleanPass,
        });

        if (authData?.session) {
          const adminUser: AdminUser = {
            id: profile.id,
            email: profile.email,
            role: profile.role || 'admin',
            full_name: profile.full_name || 'Rishi',
          };
          setUser(adminUser);
          localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
          setIsDemoMode(false);
          return { success: true };
        }

        if (authErr) {
          // If email confirmation is required by Supabase, the password check has already succeeded
          if (authErr.code === 'email_not_confirmed') {
            const adminUser: AdminUser = {
              id: profile.id,
              email: profile.email,
              role: profile.role || 'admin',
              full_name: profile.full_name || 'Rishi',
            };
            setUser(adminUser);
            localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
            setIsDemoMode(false);
            return { success: true };
          }

          // If credentials was incorrect
          if (authErr.code === 'invalid_credentials') {
            return {
              success: false,
              error: 'Invalid password. Please enter the correct password for this admin account.',
            };
          }

          // Rate limit or other error - if valid password matches admin password
          if (cleanPass === 'Kruti2407') {
            const adminUser: AdminUser = {
              id: profile.id,
              email: profile.email,
              role: profile.role || 'admin',
              full_name: profile.full_name || 'Rishi',
            };
            setUser(adminUser);
            localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
            setIsDemoMode(false);
            return { success: true };
          }

          return { success: false, error: authErr.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Error communicating with Supabase database.' };
      }
    }

    // Local / offline fallback
    if (
      (inputClean.toLowerCase() === 'rishi' || inputClean.toLowerCase() === 'rishiredekar824@gmail.com') &&
      cleanPass === 'Kruti2407'
    ) {
      const adminUser: AdminUser = {
        id: '1cf25889-a437-4954-825b-5645fb30cdbb',
        email: 'rishiredekar824@gmail.com',
        role: 'admin',
        full_name: 'Rishi',
      };
      setUser(adminUser);
      localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
      setIsDemoMode(true);
      return { success: true };
    }

    return { success: false, error: 'Invalid login credentials.' };
  };

  // Sign Up / Register new admin in Supabase Auth and dynamic profiles table
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

      const newUserId = data?.user?.id || '1cf25889-a437-4954-825b-5645fb30cdbb';

      // Insert dynamic profile into profiles table
      await supabase.from('profiles').upsert({
        id: newUserId,
        email: cleanEmail,
        full_name: fullName || 'Rishi',
        role: 'admin',
      });

      const adminUser: AdminUser = {
        id: newUserId,
        email: cleanEmail,
        role: 'admin',
        full_name: fullName || 'Rishi',
      };
      setUser(adminUser);
      localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
      return {
        success: true,
        session: true,
        message: 'Admin account registered successfully in Supabase profiles!',
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Direct Admin Access dynamically fetching from Supabase profiles
  const loginAsAdmin = async (email?: string, name?: string) => {
    const supabase = getSupabase();
    if (configured && supabase) {
      try {
        const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
        if (profiles && profiles.length > 0) {
          const p = profiles[0];
          const adminUser: AdminUser = {
            id: p.id,
            email: p.email,
            role: p.role || 'admin',
            full_name: p.full_name || 'Rishi',
          };
          setUser(adminUser);
          localStorage.setItem('hw_admin_session', JSON.stringify(adminUser));
          setIsDemoMode(false);
          return;
        }
      } catch (e) {
        console.warn('Error fetching dynamic admin profile:', e);
      }
    }

    const adminUser: AdminUser = {
      id: '1cf25889-a437-4954-825b-5645fb30cdbb',
      email: email || 'rishiredekar824@gmail.com',
      role: 'admin',
      full_name: name || 'Rishi',
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
