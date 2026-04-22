import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        return Platform.OS === 'web'
            ? AsyncStorage.getItem(key)
            : SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        return Platform.OS === 'web'
            ? AsyncStorage.setItem(key, value)
            : SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        return Platform.OS === 'web'
            ? AsyncStorage.removeItem(key)
            : SecureStore.deleteItemAsync(key);
    },
};

const supabaseUrl = 'https://oecgtduobkhffxkcznkq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lY2d0ZHVvYmtoZmZ4a2N6bmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTI3MjcsImV4cCI6MjA4OTcyODcyN30.MqRP1XRChlB0oyygNsbbdWiU5QX7UIuGfY7j6jZ2tEQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});