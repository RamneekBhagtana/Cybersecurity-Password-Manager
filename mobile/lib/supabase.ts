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
const supabaseAnonKey = 'process.env.sb_publishable_J5ml9gUKfJoKN5pfE9LAlQ_eZq-rvag';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});