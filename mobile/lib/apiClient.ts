import axios from 'axios';
import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();

    // If there is no session, cancel the request - don't send auth-less requests
    if (!session?.access_token) {
      return Promise.reject(new Error('No active session. Request aborted.'));
    }

    config.headers.Authorization = `Bearer ${session.access_token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt a token refresh before signing out — guards against the race
      // where a valid session's access token expires mid-flight.
      const { data: { session } } = await supabase.auth.refreshSession();
      if (!session) {
        await supabase.auth.signOut();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;