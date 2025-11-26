
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec les clés fournies
const supabaseUrl = 'https://wpaandlhikcvhsohmgms.supabase.co';
const supabaseAnonKey = 'sb_publishable_xlB4gKD2Y5Gx-vP4iVU55A_WedrEkKy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
    return true;
};
