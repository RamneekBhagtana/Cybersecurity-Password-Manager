import axios from 'axios';
import { supabase } from './supabase';

const apiClient = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach Supabase JWT as Bearer token on every request
apiClient.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

export default apiClient;