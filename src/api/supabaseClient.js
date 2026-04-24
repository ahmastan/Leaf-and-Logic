import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const url = env.supabase.url || 'https://placeholder.supabase.co';
const key = env.supabase.anonKey || 'placeholder-key';
export const supabase = createClient(url, key);
