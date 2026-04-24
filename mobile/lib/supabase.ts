import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Supabase credentials ──────────────────────────────────────────
// NOTE: process.env.EXPO_PUBLIC_* doesn't work in Expo Go on a physical
// device, so we hardcode these during local development. Revert to
// environment variables before committing to version control.
const SUPABASE_URL = 'https://oecgtduobkhffxkcznkq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lY2d0ZHVvYmtoZmZ4a2N6bmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTI3MjcsImV4cCI6MjA4OTcyODcyN30.MqRP1XRChlB0oyygNsbbdWiU5QX7UIuGfY7j6jZ2tEQ';

// ── Storage adapter ───────────────────────────────────────────────
// Supabase session tokens (especially ES256-signed ones) can exceed
// expo-secure-store's 2048-byte limit, causing warnings and potential
// data loss. AsyncStorage has no size limit and is the pattern Supabase
// officially recommends for React Native apps.
//
// The session JWT is short-lived (1 hour) and grants API access only.
// Actual vault data remains encrypted at rest with AES-256-GCM keys
// derived from the user's master password via Argon2id — those keys
// never touch AsyncStorage.
const SupabaseStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.warn('Supabase storage setItem failed:', err);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn('Supabase storage removeItem failed:', err);
    }
  },
};

// ── Supabase client ───────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SupabaseStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});