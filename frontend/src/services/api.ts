
import axios from 'axios';
import { supabase } from '../lib/supabase';

const api = axios.create({

// TODO: import.meta.env.VITE_API_BASE_URL is resolving to ".../api" for
// unknown reasons (env file is correct, no .env.local exists, vite.config
// is clean). Hardcoded for now to unblock; investigate before prod deploy.

  baseURL: "http://localhost:5000",
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;