import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default environment variables or locally stored credentials
const getStoredUrl = () => {
  return localStorage.getItem('hw_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
};

const getStoredKey = () => {
  return localStorage.getItem('hw_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
};

let currentUrl = getStoredUrl();
let currentKey = getStoredKey();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    currentUrl &&
    currentKey &&
    currentUrl.startsWith('https://') &&
    currentUrl.includes('.supabase.co') &&
    currentKey.length > 20
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(currentUrl, currentKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export function updateSupabaseConfig(url: string, key: string): { success: boolean; message: string } {
  try {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl || !cleanKey) {
      localStorage.removeItem('hw_supabase_url');
      localStorage.removeItem('hw_supabase_anon_key');
      currentUrl = '';
      currentKey = '';
      supabaseInstance = null;
      return { success: true, message: 'Supabase configuration cleared.' };
    }

    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
      return { success: false, message: 'Invalid Supabase URL. It should start with https:// and end with .supabase.co' };
    }

    localStorage.setItem('hw_supabase_url', cleanUrl);
    localStorage.setItem('hw_supabase_anon_key', cleanKey);
    currentUrl = cleanUrl;
    currentKey = cleanKey;
    supabaseInstance = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    return { success: true, message: 'Supabase configuration saved successfully!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to configure Supabase' };
  }
}

export const supabase = getSupabase();
