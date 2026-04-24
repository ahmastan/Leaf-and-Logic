// Grab API keys and URL from .env.local

export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
  plantId: {
    url: import.meta.env.VITE_PLANT_ID_URL ?? '',
    apiKey: import.meta.env.VITE_PLANT_ID_API_KEY ?? '',
  },

};
