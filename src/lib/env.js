/**
 * API keys and URLs must be set manually in .env.local.
 * Copy .env.example to .env.local and fill in your values.
 */
export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
  plantnet: {
    apiKey: import.meta.env.VITE_PLANTNET_API_KEY ?? '',
    apiUrl: (import.meta.env.VITE_PLANTNET_API_URL ?? 'https://my-api.plantnet.org').replace(/\/$/, ''),
  },
  perenual: {
    apiKey: import.meta.env.VITE_PERENUAL_API_KEY ?? '',
    apiUrl: (import.meta.env.VITE_PERENUAL_API_URL ?? 'https://www.perenual.com').replace(/\/$/, ''),
  },
};
